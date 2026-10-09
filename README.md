# Bamboo

方昕中文: a Traditional Mandarin study site, the Next.js successor to `study-mandarin` and `bamboo-web`. Deployed to Vercel at `bamboo.flanny.app`.

See [`plan.md`](./plan.md) for the full plan and build order.

## Layout

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
  preferences/    cookie format and the client store behind providers/
  data/           data loaders, read from GitHub at runtime (step 6)
design-system/    Standalone UI library: no app state, no data access.
  attributes.ts   the data-theme / data-hanzi-font / data-script contract
  tokens/         colors, themes, fonts, scales
  controls/       SegmentedControl (Button, Checkbox, ... in step 5)
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

Other scripts: `npm run lint`, `npm run typecheck`, `npm run format`.

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
