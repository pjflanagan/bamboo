/*
 * The new tab page: one flashcard from a Bamboo set, chosen at random and
 * weighted toward cards you know less well, like the site's flashcards page.
 * Sets come from the site's API (app/api/flashcards); progress is kept in
 * step with the site by sync.js (see progress.js).
 *
 *   hidden:    [Reveal]
 *   revealed:  [-] [Next] [+] [Known]
 *
 * Keys: Space/Enter reveals, then moves on; once revealed, - and + adjust
 * and K marks known (each then moves on).
 */

const ALL = "all";

let catalog = null;
let cards = [];
let setTitle = "";
let progress = {};
let script = "trad";
let index = -1;
let isHidden = true;

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// Data -----------------------------------------------------------------------
// ---------------------------------------------------------------------------

async function fetchJson(path) {
  const response = await fetch(`${SITE_URL}${path}`);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

/** The cached catalog right away, refreshed in the background; fetched if there's none. */
async function loadCatalog() {
  const refresh = fetchJson("/api/flashcards").then((fresh) => {
    chrome.storage.local.set({ catalog: fresh });
    return fresh;
  });
  const { catalog: cached } = await chrome.storage.local.get("catalog");
  if (cached) {
    refresh.catch(() => {});
    return cached;
  }
  return refresh;
}

function groupsOf(catalog) {
  return [...catalog.classTopics, ...catalog.collections];
}

function allSets() {
  return groupsOf(catalog).flatMap((group) => group.sets);
}

/** A set's cards. "All" studies one set at random, a new one each tab. */
async function loadSet(selected) {
  const sets = allSets();
  const set =
    sets.find((s) => s.slug === selected) ?? sets[Math.floor(Math.random() * sets.length)];
  const data = await fetchJson(`/api/flashcards/${set.slug}`);
  cards = data.cards;
  setTitle = data.title;
  index = -1;
}

// ---------------------------------------------------------------------------
// Phrases (design-system/hanzi/types.ts) -------------------------------------
// ---------------------------------------------------------------------------

function hanziOf(phrase) {
  return phrase.words
    .flatMap((word) => word.tokens)
    .map((token) => (token.kind === "hanzi" ? token.syllable[script] : token.text))
    .join("");
}

function pinyinOf(phrase) {
  return phrase.words
    .map((word) =>
      word.tokens
        .map((token) => (token.kind === "hanzi" ? (token.syllable.pinyin ?? "") : token.text))
        .join(""),
    )
    .filter(Boolean)
    .join(" ");
}

function englishOf(phrase) {
  return (
    phrase.english ??
    phrase.words
      .map((word) => word.english)
      .filter(Boolean)
      .join("; ")
  );
}

// ---------------------------------------------------------------------------
// Display & Flow -------------------------------------------------------------
// ---------------------------------------------------------------------------

const progressOf = (card) => progress[card.text] ?? 0;

function render() {
  const card = cards[index];
  if (!card) return;

  $("character").textContent = hanziOf(card.phrase);
  $("pinyin").textContent = pinyinOf(card.phrase);
  $("english").textContent = englishOf(card.phrase);
  renderProgress();

  $("google-translate").href =
    `https://translate.google.com/?sl=zh-TW&tl=en&op=translate&text=${encodeURIComponent(card.text)}`;
  $("container").className = `noselect ${card.color ?? "gray"}`;

  for (const id of ["pinyin", "english", "lesson"]) $(id).classList.toggle("hidden", isHidden);
  for (const button of document.querySelectorAll(".rate")) {
    button.classList.toggle("gone", isHidden);
  }
  $("reveal-or-next-button").textContent = isHidden ? "Reveal" : "Next";
}

/** The card's progress, and how much of the set is known. */
function renderProgress() {
  const card = cards[index];
  if (!card) return;
  const value = progressOf(card);
  const known = cards.filter((c) => progressOf(c) >= 1).length;
  $("lesson").textContent =
    `${setTitle} · ${Math.round(value * 100)}% known · ${known}/${cards.length} in set`;
  $("meter-fill").style.width = `${value * 100}%`;
}

function nextCard(updated) {
  if (cards.length === 0) return;
  const weights = cards.map((card, i) =>
    i === index && updated !== undefined ? updated : progressOf(card),
  );
  index = pickNext(weights, index < 0 ? undefined : index);
  isHidden = true;
  render();
}

function revealOrNext() {
  if (isHidden) {
    isHidden = false;
    render();
  } else {
    nextCard();
  }
}

function rate(value) {
  const card = cards[index];
  if (!card || isHidden) return;
  const next = clampProgress(value);
  progress = { ...progress, [card.text]: next };
  saveProgress(card.text, next);
  nextCard(next);
}

/** Moves the card's progress by `delta`, then moves on. */
function adjust(delta) {
  const card = cards[index];
  if (card) rate(progressOf(card) + delta);
}

function buildDropdown(selected) {
  const dropdown = $("dropdown");
  dropdown.replaceChildren(new Option("All sets", ALL));
  for (const group of groupsOf(catalog)) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.title;
    for (const set of group.sets) optgroup.append(new Option(set.title, set.slug));
    dropdown.append(optgroup);
  }
  dropdown.value = allSets().some((s) => s.slug === selected) ? selected : ALL;

  dropdown.onchange = async () => {
    chrome.storage.sync.set({ selectedSet: dropdown.value });
    await loadSet(dropdown.value);
    nextCard();
  };
}

// ---------------------------------------------------------------------------
// Main -----------------------------------------------------------------------
// ---------------------------------------------------------------------------

(async function () {
  try {
    const [loadedCatalog, { selectedSet }, loadedProgress, stored] = await Promise.all([
      loadCatalog(),
      chrome.storage.sync.get("selectedSet"),
      loadProgress(),
      chrome.storage.local.get("script"),
    ]);
    catalog = loadedCatalog;
    progress = loadedProgress;
    if (stored.script === "simp") script = "simp";

    buildDropdown(selectedSet ?? ALL);
    await loadSet($("dropdown").value);
    nextCard();
  } catch (error) {
    console.error(error);
    $("container").classList.add("hidden");
    $("actions").classList.add("hidden");
    $("error").classList.remove("hidden");
  }

  $("container").onclick = revealOrNext;
  $("reveal-or-next-button").onclick = revealOrNext;
  $("less").onclick = () => adjust(-PROGRESS_STEP);
  $("more").onclick = () => adjust(PROGRESS_STEP);
  $("known").onclick = () => rate(1);

  document.addEventListener("keydown", (event) => {
    if (event.target !== document.body || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      revealOrNext();
    } else if (event.key === "-") adjust(-PROGRESS_STEP);
    else if (event.key === "+" || event.key === "=") adjust(PROGRESS_STEP);
    else if (event.key.toLowerCase() === "k") rate(1);
  });

  // Progress made on the site (or in another tab) shows up here as it happens.
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "local") return;
    if (changes.siteProgress || changes.pending) {
      progress = await loadProgress();
      renderProgress();
    }
    if (changes.script) {
      script = changes.script.newValue === "simp" ? "simp" : "trad";
      render();
    }
  });

  $("splash").classList.add("hidden");
})();
