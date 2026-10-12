/*
 * Card progress, the same as the site's (lib/progress): 0 (new) to 1
 * (known), keyed by the phrase as written. Shared by the new tab page and
 * the content script (sync.js).
 *
 * chrome.storage.local holds two maps and a list:
 *   siteProgress  a copy of the site's progress, refreshed by sync.js
 *                 whenever a bamboo.flanny.app tab is open
 *   siteStars     a copy of the cards starred on the site, refreshed the
 *                 same way; stars are only set on the site
 *   pending       changes made on the new tab page that the site hasn't
 *                 taken yet; sync.js writes them into the site's
 *                 localStorage the next time the site is open
 * The new tab page shows the site's copy with pending changes on top.
 */

const SITE_URL = "https://bamboo.flanny.app";

/** The site's localStorage key for card progress (lib/progress/store.ts). */
const SITE_PROGRESS_KEY = "bamboo-progress";

/** The site's localStorage key for starred cards (lib/progress/store.ts). */
const SITE_STARS_KEY = "bamboo-stars";

/** How many times more often a starred card comes up. */
const STAR_BOOST = 3;

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

/** Keeps only strings, each once. */
function parseStars(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((key) => typeof key === "string"))];
}

/** New cards weigh 1.05, half-known 0.3, known 0.05; a star multiplies that. */
function weightOf(progress, starred = false) {
  return (0.05 + (1 - clampProgress(progress)) ** 2) * (starred ? STAR_BOOST : 1);
}

/**
 * Index of the next card, at random by weight (weightOf). Never repeats
 * `current` unless it's the only card.
 */
function pickNext(cardWeights, current) {
  if (cardWeights.length <= 1) return 0;
  const weights = cardWeights.map((w, i) => (i === current ? 0 : w));
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

/** The cards starred on the site, as last copied. */
async function loadStars() {
  const { siteStars } = await chrome.storage.local.get("siteStars");
  return new Set(parseStars(siteStars));
}

async function saveProgress(key, value) {
  const { pending } = await chrome.storage.local.get("pending");
  await chrome.storage.local.set({
    pending: { ...parseProgress(pending), [key]: clampProgress(value) },
  });
}
