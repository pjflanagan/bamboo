# Bamboo

方昕中文: a Traditional Mandarin study site, the Next.js successor to `study-mandarin` and `bamboo-web`. Deployed to Vercel at `bamboo.flanny.app`.

See [`plan.md`](./plan.md) for the full plan and build order.

## Layout

```
app/              Routes only: layouts, pages, route handlers. Page-private
                  pieces live next to the page in _components/ and _lib/.
components/       App components built from the design system and app state:
                  PageHeader, PreferencesMenu, preference controls, RichText,
                  AppLink, flashcards/ (SetChooser, SetPicker).
hooks/            App hooks: useTheme, useScript, useHanziFont, useProgress, useLocalStore.
providers/        App-level state. AppProviders wraps the app once in the root
                  layout; PreferencesScript applies saved preferences before
                  first paint.
lib/              Framework-free logic.
  hanzi/          pinyin, zhuyin, dictionary, tokenize (+ tests)
  preferences/    cookie format and the client store behind providers/
  progress/       per-card progress (0-1) and weighted card choice
  storage/        localStorage-backed stores for useSyncExternalStore
  text/           [markdown](link) parsing for content files
  data/           data loaders, read from GitHub at runtime (step 6)
design-system/    Standalone UI library: no app state, no data access.
  attributes.ts   the data-theme / data-hanzi-font / data-script contract
  tokens/         reset, colors, themes, fonts, scales
  typography/     global h1–h6, p, a, lists, code (zero specificity)
  layout/         Page, Section, Stack, Cluster, HeaderBar
  hanzi/          Character, Word, Phrase, AnnotationScope
  motifs/         Sign, BambooCanvas
  controls/       Button, Card, Checkbox, SegmentedControl, ProgressBar, Slider, Table, Tabs
  overlays/       Modal (Tooltip, Toast later)
  icons/          a few inline SVG icons
data/             PUBLIC DATA: flashcards, songs, dictionary, manifests
scripts/          Python pipeline that writes into data/
  source/         raw inputs used only by scripts/setup (not served)
print/            printable flashcard PDFs
```

Dependencies point one way, enforced by ESLint (`no-restricted-imports`):

```
app → components → hooks / providers → lib → design-system
```

## Develop

```bash
npm install
cp .env.example .env.local
npm run dev            # or: make dev
```

Other scripts: `npm run lint`, `npm run typecheck`, `npm test`, `npm run format`.

## Data

The app reads `data/` from the public GitHub repo at runtime, so editing a CSV and pushing updates the site without a rebuild. `vercel.json` has an `ignoreCommand` that skips the Vercel build when a commit only touches `data/`.

| env var | meaning |
|---|---|
| `DATA_SOURCE` | `local` reads `./data` from disk; `remote` reads from GitHub |
| `DATA_REPO` | `owner/repo` the data is read from |
| `DATA_BRANCH` | branch the data is read from (default `main`) |

### Flashcard pipeline

```bash
pip3 install -r requirements.txt
make help
```

`make refine` fills in pinyin and English, converts to traditional, and splits class sets into files of 30. `make print` writes PDFs to `print/`. `make manifest` regenerates `data/flashcard-sets.json`.

Google Translate credentials (for missing English) are read from `.env`:

```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcloud/service-account.json
```
