# 屯門前鋒會

Public site for the Tuen Mun Pathfinder and Adventurer Club. Pages are rendered with [TanStack Start](https://tanstack.com/start). [Void](https://void.cloud) provides the Cloudflare Worker, D1 database, and deploy workflow.

## Local development

Install dependencies and start the dev server:

```bash
pnpm install
pnpm dev
```

Open the URL printed in the terminal, usually [http://localhost:5173](http://localhost:5173).

Put local values in a single root `.env` file. Void does not read `.env.local`, `.env.example`, or other dotenv files. `.env` is gitignored.

```ini
CLERK_SECRET_KEY=
VITE_CLERK_PUBLISHABLE_KEY=
NOCOLY_APP_KEY=
NOCOLY_SIGN=
```

Apply the schema and load the seed data. `void db seed` resets the local database, reapplies migrations, then runs `db/seed.ts`.

```bash
pnpm exec void db migrate
pnpm exec void db seed
```

Check local values with `pnpm exec void env check`.

`voidPlugin()` stays first in `vite.config.ts`.

## Environment

Keys are declared in `env.ts` and read with `import { env } from "void/env"`.

| Key | Where it is used |
| --- | --- |
| `CLERK_SECRET_KEY` | Clerk server API. Sign-in, and the admin check for 幼鋒會榮譽證. |
| `VITE_CLERK_PUBLISHABLE_KEY` | Public Clerk key, embedded in the client build. |
| `NOCOLY_APP_KEY` / `NOCOLY_SIGN` | Nocoly credentials used when a notice PDF is opened. |

Production builds ignore client values in `.env`. Set `VITE_CLERK_PUBLISHABLE_KEY` in the deploy environment. The checked-in Worker var in `void.config.ts` is the public production key. Server keys are Worker secrets:

```bash
pnpm exec void secret put CLERK_SECRET_KEY
pnpm exec void secret put NOCOLY_APP_KEY
pnpm exec void secret put NOCOLY_SIGN
```

`void deploy` does not upload `.env`.

## Pages

| Path | What it shows |
| --- | --- |
| `/` | Homepage, verse popup, and the club calendar. |
| `/notice` | Activity notices grouped by type, with PDF links. |
| `/{slug}` | One album, for example `/2026-regular`. A slug starting with `20` requires sign-in. Photos load from the Google Cloud manifest. |
| `/videos` | Past videos. `?v=<id>` selects an item. Playback and thumbnails come from Mux. |
| `/videos` download | `/api/videos/:id/download` redirects to the Mux 720p MP4. |
| `/adventurer-honors` | Adventurer honor requirements. Requires a signed-in user whose Clerk `publicMetadata.role` is `admin`. |
| `/sign-in` | Clerk sign-in. `/sign-up` redirects home. Members cannot create an account. |

Notice PDFs stay on Nocoly. The site streams them inline through `/api/notices/:id/file/pathfinder` and `/api/notices/:id/file/adventurer`.

## Data

Cloudflare D1 is the database. Tables live in `db/schema.ts`. Photo files are on Google Cloud Storage (`tuenmunpathfinder-storage`). Past-video playback is on Mux. Album metadata, notices, calendar rows, navigation links, and video records are in D1.

`db/seed.ts` loads:

- `db/hyperlink-seed.json` — header and archive links
- `db/notice-seed.json` — notice rows; PDF bytes are fetched from Nocoly on open
- `db/video-seed.json` — Mux playback IDs
- `db/calendar-seed.json` — calendar entries
- homepage image paths and photo-section labels

After a schema change, generate a migration, review the SQL, and commit it:

```bash
pnpm exec void db generate
pnpm exec void db migrate
```

Deploy applies pending migrations. It does not run the seed.

## Deploy

Deploy to the saved Cloudflare target:

```bash
pnpm exec void deploy
```

Pushes to `main` deploy through `.github/workflows/void-deploy.yml`. The workflow needs:

- Secret `CLOUDFLARE_API_TOKEN`
- Variable `CLOUDFLARE_WORKERS_SUBDOMAIN`
- Variable `VITE_CLERK_PUBLISHABLE_KEY`

`CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` are only needed when Cloudflare Access protects Worker readiness.
