# Bamboo

方昕中文: a Traditional Mandarin study site, the Next.js successor to `study-mandarin` and `bamboo-web`. Deployed to Vercel at `bamboo.flanny.app`.

See [`plan.md`](./plan.md) for the full plan and build order.

## Layout

```
app/              Next.js routes (App Router)
  design/         design-system kitchen sink
design-system/    component library: tokens, hanzi, layout, controls, motifs (step 2+)
lib/data/         data loaders, read from GitHub at runtime (step 6)
data/             PUBLIC DATA: flashcards, songs, dictionary, manifests
scripts/          Python pipeline that writes into data/
  source/         raw inputs used only by scripts/setup (not served)
print/            printable flashcard PDFs
legacy/           old study-mandarin, bamboo, and bamboo-web code, for reference
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
