/*
 * Card progress, the same as the site's (lib/progress): 0 (new) to 1
 * (known), keyed by the phrase as written. Shared by the new tab page and
 * the content script (sync.js).
 *
 * chrome.storage.local holds two maps:
 *   siteProgress  a copy of the site's progress, refreshed by sync.js
 *                 whenever a bamboo.flanny.app tab is open
 *   pending       changes made on the new tab page that the site hasn't
 *                 taken yet; sync.js writes them into the site's
 *                 localStorage the next time the site is open
 * The new tab page shows the site's copy with pending changes on top.
 */

const SITE_URL = "https://bamboo.flanny.app";

/** The site's localStorage key for card progress (lib/progress/store.ts). */
const SITE_PROGRESS_KEY = "bamboo-progress";

/** What - and + move a card's progress by. */
const PROGRESS_STEP = 0.1;

function clampProgress(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;
}

/** Keeps only numeric entries. */
function parseProgress(raw) {
  if (typeof raw !== "object" || raw === null) return {};
  const map = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "number") map[key] = clampProgress(value);
  }
  return map;
}

/** New cards weigh 1.05, half-known 0.3, known 0.05. */
function weightOf(progress) {
  return 0.05 + (1 - clampProgress(progress)) ** 2;
}

/**
 * Index of the next card, at random, weighted toward lesser-known cards.
 * Never repeats `current` unless it's the only card.
 */
function pickNext(progress, current) {
  if (progress.length <= 1) return 0;
  const weights = progress.map((p, i) => (i === current ? 0 : weightOf(p)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let target = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    target -= weights[i];
    if (target < 0 && weights[i] > 0) return i;
  }
  return weights.findLastIndex((w) => w > 0);
}

/** Every card's progress as the new tab page sees it. */
async function loadProgress() {
  const { siteProgress, pending } = await chrome.storage.local.get(["siteProgress", "pending"]);
  return { ...parseProgress(siteProgress), ...parseProgress(pending) };
}

async function saveProgress(key, value) {
  const { pending } = await chrome.storage.local.get("pending");
  await chrome.storage.local.set({
    pending: { ...parseProgress(pending), [key]: clampProgress(value) },
  });
}
