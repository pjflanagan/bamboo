/*
 * The service worker: makes the installed app open and work offline.
 *
 *   /_next/static, /icons     cache first (file names are content-hashed)
 *   pages (navigations)       network first, cached copy when offline or slow
 *   /api, other GETs          network first, cached copy when offline or slow
 *   /_next/image              cache first, capped
 *
 * RSC requests (client-side navigation) are left to the network: when one
 * fails offline, Next falls back to a full page load, which is served here.
 *
 * Bump VERSION to drop every cache on the next activation.
 */

const VERSION = "v1";
const STATIC_CACHE = `bamboo-static-${VERSION}`;
const PAGES_CACHE = `bamboo-pages-${VERSION}`;
const DATA_CACHE = `bamboo-data-${VERSION}`;
const IMAGES_CACHE = `bamboo-images-${VERSION}`;
const CACHES = [STATIC_CACHE, PAGES_CACHE, DATA_CACHE, IMAGES_CACHE];

/** Pages cached on install, so every tool opens offline even before a visit. */
const PAGES = [
  "/",
  "/flashcards",
  "/read",
  "/songs",
  "/lists",
  "/zhuyin-chart",
  "/zhuyin-trainer",
  "/transfer",
];
/** Data cached on install: the set list, every set, and the reader's dictionary. */
const DATA = ["/manifest.webmanifest", "/api/dictionary"];
const ICONS = ["/icons/icon-192.png", "/icons/icon-512.png"];

/** How long a network-first request waits before using a cached copy. */
const NETWORK_TIMEOUT_MS = 4000;
const MAX_STATIC_ENTRIES = 600;
const MAX_IMAGE_ENTRIES = 100;
/** At most this often, a new deploy's chunks refresh every cached page. */
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

const STATIC_ASSET = /\/_next\/static\/[^"'\\\s)<>]+/g;

let lastRefresh = 0;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // The home page and its assets are required; everything else is best effort.
      await cachePage("/");
      await Promise.allSettled([
        ...PAGES.slice(1).map(cachePage),
        ...DATA.map((path) => cacheData(path)),
        cacheFlashcardSets(),
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(ICONS)),
      ]);
      lastRefresh = Date.now();
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("bamboo-") && !CACHES.includes(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }
  if (request.headers.get("RSC")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(cacheFirst(request, IMAGES_CACHE, MAX_IMAGE_ENTRIES));
    return;
  }
  if (url.pathname.startsWith("/_next/")) return;

  event.respondWith(networkFirst(event, DATA_CACHE));
});

async function handleNavigation(event) {
  const { request } = event;
  const key = pageKey(request.url);
  const cache = await caches.open(PAGES_CACHE);
  const cached = await cache.match(key, { ignoreVary: true });

  const network = fetch(request);
  // Chained before the page reads the body, so the clone is still possible.
  event.waitUntil(
    network
      .then(async (response) => {
        if (isCacheable(response) && isHtml(response)) {
          await storePage(key, await storable(response.clone()));
        }
      })
      .catch(() => {}),
  );

  try {
    return cached ? await withTimeout(network, NETWORK_TIMEOUT_MS) : await network;
  } catch {
    if (cached) return cached;
    return offlinePage(Boolean(await cache.match("/", { ignoreVary: true })));
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(response)) {
    await cache.put(request, response.clone());
    if (maxEntries) trim(cache, maxEntries);
  }
  return response;
}

async function networkFirst(event, cacheName) {
  const { request } = event;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });

  const network = fetch(request);
  event.waitUntil(
    network
      .then((response) => isCacheable(response) && cache.put(request, response.clone()))
      .catch(() => {}),
  );

  try {
    return cached ? await withTimeout(network, NETWORK_TIMEOUT_MS) : await network;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

/** Fetches a page and every static asset its HTML names into the cache. */
async function cachePage(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!isCacheable(response) || !isHtml(response)) throw new Error(`${path}: ${response.status}`);
  await storePage(pageKey(new URL(path, self.location.origin).href), await storable(response));
}

/**
 * Stores a page's HTML along with the static assets it references, so the
 * page hydrates offline. Assets missing from the cache mean a new deploy, so
 * the other cached pages are refreshed too, to keep them on the same build.
 */
async function storePage(key, response) {
  const html = await response.clone().text();
  const pages = await caches.open(PAGES_CACHE);
  await pages.put(key, response);

  const statics = await caches.open(STATIC_CACHE);
  const assets = [...new Set(html.match(STATIC_ASSET) ?? [])];
  const missing = [];
  for (const asset of assets) {
    if (!(await statics.match(asset))) missing.push(asset);
  }
  if (missing.length === 0) return;
  await Promise.allSettled(missing.map((asset) => statics.add(asset)));
  await trim(statics, MAX_STATIC_ENTRIES);

  if (Date.now() - lastRefresh > REFRESH_INTERVAL_MS) {
    lastRefresh = Date.now();
    const keyPath = new URL(key).pathname;
    await Promise.allSettled(PAGES.filter((path) => path !== keyPath).map(cachePage));
  }
}

async function cacheData(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!isCacheable(response)) throw new Error(`${path}: ${response.status}`);
  const cache = await caches.open(DATA_CACHE);
  await cache.put(new URL(path, self.location.origin).href, response.clone());
  return response;
}

async function cacheFlashcardSets() {
  const response = await cacheData("/api/flashcards");
  const catalog = await response.json();
  const groups = [...(catalog.classTopics ?? []), ...(catalog.collections ?? [])];
  const slugs = groups.flatMap((group) => (group.sets ?? []).map((set) => set.slug));
  await Promise.allSettled(slugs.map((slug) => cacheData(`/api/flashcards/${slug}`)));
}

/** Drops the oldest entries (cache keys keep insertion order) past the limit. */
async function trim(cache, maxEntries) {
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, Math.max(0, keys.length - maxEntries)).map((k) => cache.delete(k)),
  );
}

function pageKey(href) {
  const url = new URL(href);
  return url.origin + url.pathname;
}

function isCacheable(response) {
  return response.ok && response.type === "basic";
}

function isHtml(response) {
  return (response.headers.get("Content-Type") ?? "").includes("text/html");
}

/** Safari refuses navigation responses marked as redirected; rebuild them. */
async function storable(response) {
  if (!response.redirected) return response;
  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function offlinePage(hasHome) {
  const home = hasHome ? `<p><a href="/">Go to the home page</a></p>` : "";
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline · 方昕中文</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
    font-family: system-ui, sans-serif; background: #f4ecdf; color: #222; text-align: center; padding: 16px; }
  @media (prefers-color-scheme: dark) { body { background: #1c1c1c; color: #eee; } }
  a, button { color: inherit; font: inherit; }
  button { margin-top: 8px; padding: 8px 16px; border-radius: 8px; border: 1px solid currentColor; background: none; }
</style>
</head>
<body>
<main>
  <h1>You're offline</h1>
  <p>This page hasn't been saved for offline use yet.</p>
  ${home}
  <button onclick="location.reload()">Try again</button>
</main>
</body>
</html>`;
  return new Response(html, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
