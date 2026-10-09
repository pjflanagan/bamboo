# Plan: Bamboo (Next.js rewrite of `study-mandarin`)

Based on `prompt.md` and a read through `legacy/study-mandarin`, `legacy/bamboo` and `legacy/bamboo-web`.

## Decisions so far

| | decision |
|---|---|
| Repo | **New public repo.** You handle the repo naming and GitHub setup; the code reads the repo from env vars |
| Domain | **`bamboo.flanny.app`**, replacing the current bamboo-web deploy |
| Hosting | Vercel |
| Default script | **Traditional**, with simplified as a user option |
| AdSense | **Yes**, in v1 |
| PWA / offline | **Yes**, in v1 |
| Hanzi fonts | Noto Sans TC, Noto Serif TC, LXGW WenKai TC, Iansui |
| Accounts / Realm data | **Out of scope.** Ignore bamboo-web's accounts and the data in Realm |
| Progress (local user data) | **Deferred** to a later phase |
| flanny.app home button | **Not for now** |
| Light theme | **Bamboo**, taken from `legacy/bamboo-web` |
| Dark theme | **Neon**, taken from `legacy/study-mandarin` |

## What I found in the legacy code

- **study-mandarin** is static HTML, jQuery and CSS with no build step. It has 7 pages: home, flashcards, lists, read, karaoke, zhuyin-chart and zhuyin-trainer. They share `src/base.css` and `src/util.js`, and the site has a service worker (`sw.js`), a web manifest and AdSense (`ca-pub-8781416766784863`).
- The character component today is `renderHanziCharacter()` in `src/util.js`, which builds an HTML string. The hanzi is 54px, pinyin sits underneath at 14px, and zhuyin is absolutely positioned on the right in `writing-mode: vertical-lr`. The tone mark is positioned separately. Everything is in fixed pixels, so it can't scale.
- **Neon theme (from study-mandarin):**
  - The background is `#1c1c1c`, with a gradient from `#080808` on the home page.
  - `.neon` boxes have a 3px border with a triple glow made with `box-shadow` (outer and inset) and `text-shadow`.
  - Colors are `hsl(randomHue, 72%, 48%)`, with border and text hues at least 80° apart. The hue is random on every load and set by jQuery.
  - The Latin font is Noto Sans.
- **Bamboo theme (from bamboo-web, a CRA, React 17 and Redux app on Netlify):**
  - Colors from `src/index.css` and the component styles:
    - `--background-orange: #f5f2ee` (paper) and `#f4f2ed` (header)
    - `--dark-green: #23833d` and `--light-green: #33a853` (primary and its hover state)
    - `--background-green: #daeedd` (row highlight and progress track)
    - `--action-green: #bbeac2`
    - `--dark-orange: #ce995c` and `--light-orange: #e7b172` (secondary, used for pack tiles)
    - `#d11e1e` for danger and `#2e7fb6` for info
    - Text is black, with `#0008` for muted text and `#0001`/`#0003` for hairline borders
  - **Font:** Source Sans Pro, which is now "Source Sans 3" on Google Fonts.
  - **Motifs:**
    - The sidebar toggle is a **bamboo stalk**, drawn as a repeating linear gradient with `#33a853` and `#23833d` bands and thin node lines every ~79px.
    - The splash or login screen is a **canvas animation of bamboo stalks growing**, in `elements/canvas/animation.js`. Stalks are 20px wide with 60px segments, a 2px gap and a `#23833d66` stroke, on a `#33a853` background.
    - The progress bar is a hard-stop gradient from green to `#daeedd`.
  - **Components:**
    - Buttons are bold, 6px radius, green fill with a lighter hover. There's an `orange` variant and a `sm` size.
    - Range sliders have a thin track and a thumb that grows on hover.
    - Table rows are 54px with a green highlight.
    - Pack tiles are orange cards showing a count.
    - The page header is fixed, and the content scrolls under it.
- **Card colors:** `src/colors.css` has 21 named colors, from `red` to `black`, and the CSVs refer to them by name in the `color` column.
- **Data:** `data/` is 24 MB, but 22 MB of that is `data/source/`, which is raw input only the Python scripts use. The app needs:
  - `flashcards/**.csv`
  - `songs/*.csv` with `_songs.json`
  - `dictionary.csv`
  - `zhuyin-chart.json`
  - `resources.json`
  - `flashcard-sets.json`, which you currently update by hand with `make manifest`.
- **legacy/bamboo** is the MongoDB Stitch/Realm backend for bamboo-web, which provided accounts and a personal phrase library. It isn't carried forward: no accounts, and no migration of Realm data.

---

## 1. Repo and app setup

- `create-next-app` with the App Router, TypeScript and ESLint, using **no Tailwind**. The design system relies on CSS custom properties, attribute selectors and grid areas, which plain CSS Modules plus one global token file handle better than utility classes.
- Use `npm`. pnpm isn't installed on this machine, and npm avoids a global install.
- **Scaffolded on Next 16.4 / React 19.3** with `cacheComponents` and `partialPrefetching` on by default. Reading cookies on the server would make every route dynamic, so preferences are applied client-side by an inline script instead (see §2.2).
- You create and name the GitHub repo. It must be public, because the data folder is read from it (see §3). Nothing in the code hard-codes the repo name.
- Repository layout (set up after step 2):

```
app/              Routes only: layouts, pages, route handlers. Page-private
                  pieces live next to the page in _components/ and _lib/.
components/       App components built from the design system and app state
                  (PreferenceControls; Header, flashcard views, etc. later).
hooks/            App hooks: useTheme, useScript, useHanziFont.
providers/        App-level state. AppProviders wraps the app once in the root
                  layout; PreferencesScript applies saved preferences before
                  first paint.
lib/              Framework-free logic.
  hanzi/          pinyin, zhuyin, dictionary, tokenize (+ tests)
  preferences/    cookie format and the client store behind providers/
  data/           data loaders, read from GitHub at runtime (step 6)
design-system/    Standalone UI library: no app state, no data access.
  attributes.ts   the data-theme / data-hanzi-font / data-script contract
  tokens/         colors, themes, fonts, scales
  hanzi/          Character, Word, Phrase, AnnotationScope
  controls/       SegmentedControl (Button, Checkbox, ... in step 5)
data/             PUBLIC DATA: flashcards, songs, dictionary, manifests
scripts/          Python pipeline that writes into data/
  source/         raw inputs used only by scripts/setup (not served)
print/            printable flashcard PDFs
```

Dependencies point one way, enforced by ESLint (`no-restricted-imports`):

```text
app → components → hooks / providers → lib → design-system
```

- **App state:** `ThemeProvider`, `ScriptProvider` and `HanziFontProvider` each expose one preference through context (`useTheme`, `useScript`, `useHanziFont`), so a component re-renders only when its preference changes. All three share the cookie store in `lib/preferences`. Rendering still never depends on them: the visual effect of every preference is CSS through `<html>` data attributes, which keeps routes static. The providers are for controls and for logic that must know the value (search, text-to-speech).

- Copy over `scripts/`, `data/` (without `data/source`, see §3), `Makefile` and `requirements.txt` from study-mandarin so the Python pipeline keeps working against `/data`.

---

## 2. Design system

### 2.1 The hanzi component family: Character, Word, Phrase

This is the core of the app, so it's designed in detail below.

#### Data model first

Annotations belong to different levels:

| level | owns |
|---|---|
| **Character** | hanzi (trad + simp), pinyin syllable, zhuyin, tone |
| **Word** | a run of Characters, plus an optional English gloss |
| **Phrase** | a run of Words and punctuation, plus an optional English line |

Pinyin and zhuyin are per character. English is per word or per phrase. Putting English on each character would be wrong, because 知了 means "cicada" and 知 and 了 alone do not. So there is **one** layout primitive used at two levels:

```ts
type Syllable = { trad: string; simp: string; pinyin?: string; zhuyin?: string; tone?: 1|2|3|4|5 };
type Token    = { kind: 'hanzi'; syllable: Syllable } | { kind: 'text'; text: string }; // punctuation, latin
type WordData = { tokens: Token[]; english?: string };
type PhraseData = { words: WordData[]; english?: string };
```

A `tokenize(phrase, dictionary)` helper in `lib/` converts a CSV row or arbitrary text into this shape. This replaces `getCharacterHtml`. Components only render data and never look things up.

#### Fixed-size layout

Every annotated unit is a CSS grid with **named areas that are always present**:

```
           ┌──────────┬────┐
 pinyin    │   chī    │    │
           ├──────────┤ ㄔ │  ← zhuyin column, vertical-rl, tone mark in its own sub-cell
 hanzi     │    吃    │    │
           ├──────────┴────┤
 english   │      eat      │  ← only on Word/Phrase level
           └───────────────┘
```

- Every dimension is in `em`, based on a single `--hanzi-size` variable. To scale a Word, Phrase or whole flashcard, you set one variable. The pinyin row is about 0.28em, the zhuyin column about 0.36em wide, and so on. These are design tokens, not magic numbers.
- **Hidden annotations reserve their space.** A hidden slot gets `visibility: hidden` (plus `opacity` for transitions), never `display: none`. The box keeps the same size whether all annotations are showing or none are. This meets the "any subset without changing size" requirement.
- There is one escape hatch: a `collapse` mode removes a slot's track entirely (`grid-template-rows: 0`). It's for dense contexts such as a reading view where you never want zhuyin. You choose it on purpose at the scope level and never get it by accident.
- **Font swaps don't change the size.** Each hanzi font has different vertical metrics, so the hanzi cell has a fixed `block-size: 1em` with `line-height: 1`. Each font also gets a `size-adjust`/`ascent-override` in its `@font-face` (next/font exposes `adjustFontFallback`, or we tune it by hand), so all fonts sit in the same box.
- Long Phrases wrap at **word** boundaries, because each Word is `inline-grid`, and never in the middle of a word.

#### Visibility as layered state, not props

Instead of props like `showPinyin`, `revealOnHover` and `revealOnClick` on every component, visibility has two parts that combine:

1. **What is visible.** For each layer (`pinyin`, `zhuyin`, `english`, and also `hanzi`, so you can quiz in the other direction), the state is `shown | hidden | collapsed`.
2. **How hidden things get revealed:** `none | hover | click | focus`. This is the trigger.

Both live in an `AnnotationScope`, a React context provider that renders a wrapper `<div>` with **data attributes**:

```html
<div data-annot-pinyin="hidden" data-annot-zhuyin="shown" data-annot-english="hidden" data-reveal="hover">
```

**CSS does the work.** For example:

```css
[data-annot-pinyin="hidden"] .slot-pinyin { visibility: hidden; }
[data-reveal="hover"] .unit:hover .slot,
[data-reveal="click"] .unit[data-revealed] .slot,
[data-revealed-all] .slot { visibility: visible; }
```

This approach has several benefits:
- **Hover costs nothing.** It's pure CSS, so there's no re-render for every character on mousemove. This matters on the Read page, which can hold thousands of characters.
- **Click** is the only trigger that needs JS. A delegated click handler on the scope toggles `data-revealed` on the nearest `.unit`. It's one listener per scope, not one per character.
- **Parent instruction:** a parent such as a flashcard can control the scope by passing `revealed` (true/false or a set of layers), which sets `data-revealed-all`. A flashcard flip becomes `<AnnotationScope revealed={flipped}>`. The page can also call `scope.reveal('pinyin')` through a ref or a `useAnnotationScope()` hook. That's how "reveal pinyin first, then english" quiz steps work.
- **Scopes nest and inherit.** An inner scope overrides only what it specifies. A page can set "zhuyin off everywhere" while one flashcard sets "english hidden, reveal on click".
- **User preferences** are a top-level scope stored in a cookie. They hold default layers, font and script, and the header toggles change them. Page and component scopes sit on top of the user preferences.
- Granularity is a scope setting: `revealUnit="character" | "word" | "phrase"`. It controls whether hovering 吃 reveals only that character or the whole word.

So `Character`, `Word` and `Phrase` take almost no visual props. They take **data**, plus an optional `size`. Everything else comes from the nearest scope.

#### As built (step 3)

The design held up, with these refinements:

- **One mode per layer instead of separate visibility and trigger.** Each layer is `shown | hidden | hover | click | collapsed`, so you can say "pinyin on hover, english on click" in one scope: `<AnnotationScope pinyin="hover" english="click">`. `revealUnit` picks character, word (the default) or phrase.
- **Custom properties, not attribute selectors.** A selector like `[data-annot-pinyin="hidden"] .slot` matches *any* ancestor, so nested scopes couldn't override an outer one. Instead the scope writes custom properties (`--base-pinyin`, `--hw-pinyin`, `--k-pinyin`, `--rev-pinyin`…), and each slot reads a `var()` fallback chain: hovered character > hovered word > hovered phrase > clicked unit > revealed by parent > resting mode. Custom properties inherit, so the nearest scope always wins.
- **Touch screens:** hover reveals only apply under `(hover: hover)`. On devices that can't hover, a tap reveals hover layers instead.
- **Keyboard:** in click mode, units become `role="button"` with `tabIndex=0`, and Enter or Space toggles them. `aria-pressed` is managed by the scope's listener, so React re-renders don't reset it.
- **The tokenizer uses the CSV's pinyin**, not just the dictionary: its spaces become word boundaries, and polyphones get their reading from context (知了 = zhīliǎo, where the dictionary says 了 = le). Across all 3653 flashcard and song rows, 99.7% line up; the rest fall back to the dictionary, one word per character.
  - Latin text inside the pinyin (Wi-Fi, 3D) is skipped when lining up.
  - Closing punctuation attaches to the word before it and opening punctuation to the word after, so a line never starts with "，".
- **Not done in step 3:** user default layers ("never show zhuyin") move to step 4 with the header menu. They'll set the same `--base-*` properties on `<html>`, under any scope.

#### Other options on the same scope
- `toneColors: boolean`: the scope sets `data-tone-colors`, and each syllable carries `data-tone="3"`. This is all CSS, with a palette for each theme.
- `script: 'trad' | 'simp'`, **defaulting to `trad`**. Each Syllable carries both forms, and the scope chooses which to render with `data-script`, so switching never refetches. The `FORCE_SIMPLIFIED` exceptions (了, 出, 回…) are already handled in the data.
- **Selection and highlight state** for the Read page cursor: `data-selected` on a unit, replacing the current `.highlight` div.

#### Fonts
- Load fonts with `next/font/google` as CSS variables: **Noto Sans TC**, **Noto Serif TC**, **LXGW WenKai TC** and **Iansui** (both based on Klee One, a textbook handwriting style). They aren't preloaded: the browser downloads only the unicode-range slices for characters on the page. Because next/font self-hosts them, they are precached by the service worker for offline use.
- `data-hanzi-font="sans|serif|wenkai|iansui"` on any element sets `--font-hanzi`. That means a global toggle in the header, a per-card override, or the "font toggle" on the Read page from `_todo/plan/web.md` all use the same mechanism.
- Latin text (pinyin and English) uses a separate `--font-latin`, set by the theme: **Noto Sans** in neon and **Source Sans 3** in bamboo. The hanzi font is independent of the theme.

### 2.2 Theming: Neon (dark) and Bamboo (light)

- `tokens.css` defines **semantic** tokens. Components use only these:
  - surfaces and text: `--bg`, `--surface`, `--surface-raised`, `--text`, `--text-muted`, `--border`
  - actions: `--primary`, `--primary-hover`, `--secondary`, `--secondary-hover`, `--danger`
  - other: `--focus-ring`, `--highlight`, `--annot-color`, `--tone-1..5`, `--font-latin`
- `neon.css` and `bamboo.css` map those tokens to values under `[data-theme="neon"]` and `[data-theme="bamboo"]`.
- The default follows `prefers-color-scheme` (dark → neon, light → bamboo). The user can override it in the header, and the choice is stored in a cookie. **Done in step 2:**
  - An inline `<head>` script reads the cookie and sets `data-theme`, `data-hanzi-font` and `data-script` on `<html>` before first paint. There's **no flash of the wrong theme**, and every route stays statically prerendered, which the PWA needs. This is the pattern from Next 16's "Preventing Flash" guide.
  - `PreferencesSync` re-applies the attributes after React's dev remount and follows OS light/dark changes while the theme is "system".
  - Every preference is pure CSS via those attributes. Pages never read preferences to decide what to render; only controls use `usePreferences()`.
  - `--font-latin` must not end in a generic family. On macOS, `system-ui` covers CJK and would stop hanzi reaching the hanzi font.

**How bamboo-web's colors map to the tokens:**

| token | bamboo | neon |
|---|---|---|
| `--bg` | `#f5f2ee` | `#1c1c1c` (gradient from `#080808`) |
| `--surface` (header) | `#f4f2ed` + `#0003` hairline | `rgba(12,12,12,.88)` + blur |
| `--primary` / hover | `#23833d` / `#33a853` | seeded neon hue, `hsl(h 72% 48%)` |
| `--secondary` / hover | `#ce995c` / `#e7b172` | second seeded hue (≥80° away) |
| `--highlight` | `#daeedd` | `#ffffff2f` |
| `--text` / muted | `#000` / `#0008` | `#fff` / `#999` |
| `--danger` | `#d11e1e` | neon red glow |

- **Card colors:** the 21 named colors in `colors.css` become `--card-red`, `--card-teal` and so on, defined for each theme. Neon keeps the current saturated values, and bamboo gets softer earthy versions tuned to sit on `#f5f2ee`. CSVs still use the names.

### 2.3 Motifs: one component per role, styled by theme

Each theme has a signature look. Pages shouldn't need to branch on the theme to get it.

- **`<Sign>`** is the heading treatment.
  - In **neon** it renders as the glowing neon sign: a triple-layer glow built from `--sign-hue`. Today's `Math.random()` would cause a hydration mismatch in React, so the hue is **derived from a seed** (a hash of the heading text, or the date if you want it to change daily). It's stable on reload and still varied.
  - In **bamboo** the same markup renders as a **bamboo stalk**: the striped green gradient with node lines from the bamboo-web sidebar, used as a side bar or underline.
- **`<BambooCanvas>`** is the growing-stalks animation from bamboo-web, ported to a client component with `requestAnimationFrame` and `prefers-reduced-motion` support. It's used for the splash, the empty states and the 404 page.
  - In neon the same canvas draws glowing stalk outlines instead of filled ones, so the animation works in both themes.
- **`<ProgressBar>`** uses the hard-stop gradient from bamboo-web. In neon it has a glow.

### 2.4 Global styles and layout

- **Typography:** global `h1`–`h6`, `p`, `a`, `ul/li`, `hr`, `code` and `blockquote` on a modular type scale with tokens. `h1` and `h2` can opt into `<Sign>`. A `lang="zh-Hant"` on mixed-language headings gets the hanzi font.
- **Header:** global and fixed. It carries over study-mandarin's blurred `#header` and bamboo-web's fixed `PageHeader`, where content scrolls under it.
  - It has a back/home link, the page title, a slot for page actions, and a preferences menu with the theme, hanzi font, script (繁/简) and default-annotation toggles.
  - Pages set their title and actions through a `<PageHeader>` they render, rather than prop-drilling from the layout.
- **Page:** `<Page>` handles max width (720 default, plus `wide` and `full`), padding and header offset. `<Section>`, `<Stack>` and `<Cluster>` handle spacing so pages don't hand-write margins.
- Inline `style=""` blocks like the ones in today's `index.html` go away.

### 2.5 Controls

These are the components to build. bamboo-web's versions are the starting point for the bamboo look.

- **Button:** primary, secondary, ghost and danger, in `sm` and `md`, plus icon-only. Bold, 6px radius.
- **Checkbox:** checked items get strikethrough, as in the current to-do list.
- **Toggle.**
- **SegmentedControl:** for the pinyin/zhuyin/english toggles and the 繁/简 switch.
- **Slider:** from bamboo-web, with a thin track and a thumb that grows on hover.
- **Select.**
- **TextInput and TextArea:** for input on the Read page.
- **Card:** takes a color name. Bamboo-web's pack tile becomes a Card variant with a count.
- **Table and Row:** 54px rows with a highlight.
- **Tag.**
- **Modal and Sheet:** these replace `modal.css`.
- **Tooltip.**
- **Toast:** used for the "new version available" message from the PWA (§4).

Notes:
- Build on Radix primitives only where accessibility is hard: Dialog, Tooltip and Select. Native elements cover the rest.
- Every control supports focus-visible, keyboard use and both themes.

### 2.6 The `/design` page

A kitchen-sink route shows every component in both themes. It includes an interactive annotation playground with toggles for each layer, the trigger, the font and the script, so you can verify that sizes never change. This becomes the main tool for developing the design system. It doesn't need Storybook, and it is excluded from ads and from the sitemap.

---

## 3. Data and hosting

### Hosting and domain
- Create a Vercel project from `pjflanagan/bamboo` and attach **`bamboo.flanny.app`** to it.
- **Cutover:** `bamboo.flanny.app` currently points at the bamboo-web Netlify deploy (it has `netlify/` and `_redirects`).
  1. Build and test on the `*.vercel.app` preview URL first.
  2. Then move the DNS record to Vercel and retire the Netlify site.
  3. The legacy Stitch hosting already redirects to `bamboo.flanny.app`, so that redirect keeps working.
- **Old study-mandarin URLs:** once pages are ported, replace each `flanny.app/study-mandarin/page/*` with a redirect stub to its new `bamboo.flanny.app/*` route so existing links and installed PWAs carry over.

### Public data folder
- `/data` sits at the repo root, **not** in `/public`. Files in `/public` are baked into each deployment, which defeats the point.
- The app reads the data **from GitHub at runtime**: `https://raw.githubusercontent.com/${DATA_REPO}/${DATA_BRANCH}/data/...`. `DATA_REPO` (e.g. `pjflanagan/bamboo`) and `DATA_BRANCH` (default `main`) are env vars set in Vercel, so renaming the repo is a config change, not a code change.
- `lib/data` is the only module that knows where data comes from:
  - It has typed loaders: `getSetsManifest()`, `getFlashcardSet(path)`, `getSongs()`, `getDictionary()` and so on. They parse CSVs on the **server** with Papaparse, so the client gets typed JSON.
  - It fetches with `{ next: { revalidate: 300, tags: ['data'] } }`, so edits show up within about 5 minutes, with no rebuild.
  - **Instant updates (recommended):** a GitHub webhook calls `POST /api/revalidate` with a shared secret, which runs `revalidateTag('data')`. A push to `data/` is then live within seconds.
  - **Local dev:** when `DATA_SOURCE=local`, it reads `./data` from disk, so you can edit a CSV and refresh without pushing.
- **`/api/data/[...path]`** exposes the same loaders as JSON for client components and the service worker (§4), with `Cache-Control: s-maxage=300, stale-while-revalidate`.
- `data/source/` (22 MB, used only by scripts) moves to `scripts/source/` or stays git-ignored. It shouldn't sit in the public data folder.
- **Dictionary:** `dictionary.csv` is loaded and indexed into a `Map` on the server, then cached. Pages receive tokenized phrases and never the whole dictionary. The Read page tokenizes through a route handler.
  - **Offline exception:** the Read page needs the dictionary on the client when offline. A compact JSON build of it (`data/dictionary.json`, generated by the same GitHub Action below) is cached by the service worker only when the user opens the Read page.

### Not triggering rebuilds
In `vercel.json`:
```json
{ "ignoreCommand": "git diff --quiet HEAD^ HEAD -- . ':(exclude)data'" }
```
Vercel skips the build when this command exits 0, which happens when nothing outside `data/` changed. A commit that only touches `data/` therefore doesn't deploy, and a commit that touches code does.

### Manifest automation
This addresses `_todo/plan/data-management.md`.
- A **GitHub Action** runs on pushes to `data/**`. It runs `gen_sets_manifest.py` (extended to cover songs and the dictionary JSON) and commits `data/index.json` if anything changed.
- The ignore rule above covers that commit too, so it doesn't trigger a deploy. The Action also calls the revalidate webhook once it's done.
- The flashcards page reads the manifest, which ends manual updates to the set list.

---

## 4. PWA and offline support

Use **Serwist** (`@serwist/next`), the maintained successor to `next-pwa`, which supports the App Router.
- **Caveat to verify at scaffold time:** Serwist's service worker build has historically required webpack. If it still doesn't support Turbopack, use Turbopack for `next dev` and webpack for `next build`.

**Manifest**
- `app/manifest.ts`: name 方昕中文 / Bamboo, `display: standalone`, and icons from the bamboo logo assets.
- `theme_color` should follow the active theme. The manifest has one static value, so the dynamic part goes in `<meta name="theme-color" media=…>` tags.

**What gets cached, and how**

| what | strategy |
|---|---|
| App shell, JS/CSS, self-hosted fonts, icons | precache (versioned per deploy) |
| Page navigations | NetworkFirst → fall back to cached page → fall back to an `/offline` page |
| `/api/data/*` (sets, songs, manifest) | StaleWhileRevalidate, so offline works and online stays fresh |
| `dictionary.json` | CacheFirst, revalidated when the manifest's hash changes |
| AdSense / Google ad domains | **never cached** (NetworkOnly) |

**Offline behavior**
- Any flashcard set you've opened works offline.
- A **"Save for offline"** action on the sets list prefetches every set, so you can study on a plane.
- Progress tracking (known cards and other local user data) is deferred to a later phase. When it's added, it will be stored locally, so it will work offline by default.

**Next 16 built-in:** turn on `experimental.useOffline`, so navigations and fetches that fail offline wait and retry instead of throwing. Use the `useOffline()` hook to show an offline indicator. This complements the service worker; it doesn't replace it.

**Updates**
- When a new service worker is waiting, show a `Toast` that says "New version — reload". Don't use silent `skipWaiting`, because that could swap code in the middle of a flashcard session.

**Migration**
- study-mandarin's `sw.js` and `gen_sw.py` are retired.

---

## 5. AdSense

- Keep the existing publisher ID, `ca-pub-8781416766784863`. **Add `bamboo.flanny.app` as a site in the AdSense console** and wait for approval. This is a manual step, and it can take days, so start it early.
- Add `public/ads.txt`.
- Load the AdSense script once in the root layout with `next/script` (`strategy="afterInteractive"`).
- **`<AdSlot>`** design-system component:
  - It **reserves a fixed size**, so ads never cause layout shift.
  - It's styled to sit naturally in both themes.
  - It calls `adsbygoogle.push()` on mount and again when the route changes, because App Router navigations don't reload the page.
- **Placement:** on index and list pages (home, sets list, songs list, zhuyin chart). Keep ads **out of** active study surfaces (a flashcard session, the trainer, karaoke playback) and out of `/design`.
- Ads don't load offline. `<AdSlot>` collapses to its reserved empty space when it's offline.
- Before launch, check whether the domain is in a region or market that needs a consent banner (the GDPR CMP in AdSense settings).

---

## 6. Build order

1. ✅ **Scaffold:** Next app (in the repo you set up), folder layout, ESLint/Prettier, Vercel project on a preview URL, `vercel.json` ignore rule.
2. ✅ **Tokens and themes:** semantic tokens, neon and bamboo, cookie-based preferences (theme, font, script), fonts.
3. ✅ **Hanzi family:** data model, `tokenize`, `Character`/`Word`/`Phrase`, `AnnotationScope`, and the playground on `/design`. *Most of the effort goes here.*
4. **Global typography, Header, Page, layout primitives, and motifs (`Sign`, `BambooCanvas`).**
5. **Controls.**
6. **Data layer:** loaders, local/remote switch, `/api/data`, revalidation webhook, GitHub Action for the manifest and dictionary JSON.
7. **PWA:** Serwist, manifest, caching rules, offline page, update toast.
8. **AdSense:** apply for the domain early, at step 1, then build `AdSlot`, `ads.txt` and placement.
9. **Port pages:** home, then flashcards, read, lists, karaoke, zhuyin chart and zhuyin trainer. This is a separate phase, with a plan per page once the design system has settled.
10. **Cutover:** move `bamboo.flanny.app` DNS to Vercel, retire Netlify, add redirect stubs from the study-mandarin pages.
11. **Later:**
    - **Progress and local user data:** known cards and study history, stored locally on the device.
    - **Chrome extension:** it can reuse the design system via a shared package and the same remote data.
