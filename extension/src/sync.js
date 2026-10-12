/*
 * Runs on bamboo.flanny.app (before the page's scripts) and keeps the
 * extension's progress and the site's in step (see progress.js):
 *
 *   extension -> site  pending changes are written into the site's
 *                      localStorage now, and again whenever more come in
 *                      while the tab is open
 *   site -> extension  the site's progress is copied to siteProgress now,
 *                      and whenever it changes while the tab is open; its
 *                      starred cards are copied to siteStars the same way
 *
 * Also copies the site's script preference (traditional or simplified), so
 * the new tab page writes hanzi the same way.
 */

(function () {
  function readSite() {
    try {
      return parseProgress(JSON.parse(localStorage.getItem(SITE_PROGRESS_KEY) ?? "{}"));
    } catch {
      return {};
    }
  }

  /** Saves to the extension, unless it was reloaded or removed (this script is then orphaned). */
  function store(items) {
    try {
      chrome.storage.local.set(items).catch(() => {});
    } catch {
      // extension context invalidated
    }
  }

  let lastSeen = null;
  let lastStars = null;
  let lastScript = null;

  /** Copies the site's progress to the extension, if it changed. */
  function pushSite() {
    const raw = localStorage.getItem(SITE_PROGRESS_KEY);
    if (raw === lastSeen) return;
    lastSeen = raw;
    store({ siteProgress: readSite() });
  }

  /** Copies the site's starred cards to the extension, if they changed. */
  function pushStars() {
    const raw = localStorage.getItem(SITE_STARS_KEY);
    if (raw === lastStars) return;
    lastStars = raw;
    let stars = [];
    try {
      stars = parseStars(JSON.parse(raw ?? "[]"));
    } catch {
      // malformed: the site reads it as no stars too
    }
    store({ siteStars: stars });
  }

  /** Writes the extension's pending changes into the site's localStorage. */
  async function applyPending() {
    const { pending } = await chrome.storage.local.get("pending");
    const changes = parseProgress(pending);
    if (Object.keys(changes).length === 0) return;

    localStorage.setItem(SITE_PROGRESS_KEY, JSON.stringify({ ...readSite(), ...changes }));
    // The site's store only rereads storage on a `storage` event (lib/storage).
    window.dispatchEvent(new StorageEvent("storage", { key: SITE_PROGRESS_KEY }));

    // Clear what was applied, keeping anything changed since it was read.
    const { pending: latest } = await chrome.storage.local.get("pending");
    const left = Object.entries(parseProgress(latest)).filter(
      ([key, value]) => changes[key] !== value,
    );
    await chrome.storage.local.set({ pending: Object.fromEntries(left) });
    pushSite();
  }

  function pushScript() {
    const match = document.cookie.match(/(?:^|; )bamboo-prefs=([^;]*)/);
    let script = "trad";
    try {
      if (match && JSON.parse(decodeURIComponent(match[1])).script === "simp") script = "simp";
    } catch {
      // malformed cookie: the site falls back to traditional too
    }
    if (script === lastScript) return;
    lastScript = script;
    store({ script });
  }

  applyPending().finally(pushSite);
  pushStars();
  pushScript();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.pending) applyPending();
  });

  // The site's own writes don't fire `storage` events in its own tab, so look.
  setInterval(() => {
    pushSite();
    pushStars();
    pushScript();
  }, 2000);
  for (const [target, type] of [
    [document, "visibilitychange"],
    [window, "pagehide"],
  ]) {
    target.addEventListener(type, pushSite);
    target.addEventListener(type, pushStars);
  }
})();
