This app uses TanStack Start for routing and rendering. Void provides Cloudflare D1 and deployment. Before changing the Vite plugins, read `node_modules/void/docs/integrations/frameworks/tanstack-start.md`. `voidPlugin()` stays first.

<!--injected-by-void-v1.3.0-->
## Void

- This project uses [Void](https://void.cloud), a full-stack Vite framework for Cloudflare Workers with file-based API routing, server-rendered pages, and typed backend services.
- Use Void's CLI and typed APIs. Before working with Void, read the relevant Markdown docs in `node_modules/void/docs/`; start with `guide/quickstart.md` for setup and `reference/cli.md` for commands.

<!--/injected-by-void-->

## Learned User Preferences

- Keep the public UI on the original club site's layout and behavior. Follow that site when pages differ, including header menus, notice PDFs, and past videos.
- Keep the database on Cloudflare. The user rejected Neon and external PostgreSQL.

## Learned Workspace Facts

- This repo is the Void, Cloudflare, and TanStack Start rewrite of the Next.js app at `/Users/kalongchan/programmer/tuen-mun-pathfinder`.
- The database is Cloudflare D1 (SQLite via Void). Do not set Postgres in `void.config.ts`, and do not add Neon, a Neon `DATABASE_URL`, or Hyperdrive.
- Void allows only one root `.env` file. Do not create `.env.example` or `.env.local`.
- Notices and calendar entries come from Nocoly and are stored in D1. Notice PDFs stay on Nocoly and are served through `/api/notices/:id/file/:slot` (`pathfinder` and `adventurer`). Album metadata and past-video records are in D1; photo files are on Google Cloud; past-video playback is on Mux.
- Deploy with `void deploy`. Void provisions D1, and the GitHub workflow does not use a `DATABASE_URL` secret.
