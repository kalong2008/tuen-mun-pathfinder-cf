# Adventurer honors reference data

Files here are **not loaded by the app** (except `categoryPages`, which is imported by `lib/data/types.ts` for category filter links).

| File | Purpose |
| --- | --- |
| `hkmc-source-urls.json` | HKMC category page URLs (`categoryPages`) and per-honor historical links for AI assistants |

Production honor content lives in `../content/{category}/*.md`.

The markdown fixture `test0000-markdown-styles` is excluded from the admin UI via `HONOR_FIXTURE_IDS` in `lib/data/loader.ts`.
