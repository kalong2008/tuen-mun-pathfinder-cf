This app uses TanStack Start for routing and rendering. Void provides Cloudflare D1 and deployment. Before changing the Vite plugins, read `node_modules/void/docs/integrations/frameworks/tanstack-start.md`. `voidPlugin()` stays first.

<!--injected-by-void-v1.3.0-->
## Void

- This project uses [Void](https://void.cloud), a full-stack Vite framework for Cloudflare Workers with file-based API routing, server-rendered pages, and typed backend services.
- Use Void's CLI and typed APIs. Before working with Void, read the relevant Markdown docs in `node_modules/void/docs/`; start with `guide/quickstart.md` for setup and `reference/cli.md` for commands.

<!--/injected-by-void-->

## Learned User Preferences

- Keep the public UI on the original club site's layout and behavior. Follow that site when pages differ, including header menus, notice PDFs, and past videos. On the calendar, 查看通告詳情 opens the notice PDF only for activities that are not 集會, and each notice shows its 前鋒會 or 幼鋒會 badge even when there is only one file.
- Protected albums and the honors page use the in-page sign-in and return to that page. The header 登入 button stays a popup. Members cannot sign up, and there is no album list.
- Keep the database on Cloudflare. The user rejected Neon and external PostgreSQL.
- Deploy by pushing to `main`. Leave Cloudflare Workers Builds disabled so they do not run a second Wrangler deploy.

## Learned Workspace Facts

- This repo is the Void, Cloudflare, and TanStack Start rewrite of the Next.js app at `/Users/kalongchan/programmer/tuen-mun-pathfinder`. `tuenmunpathfinder.com` and `www.tuenmunpathfinder.com` are custom domains on this Worker. The zone is on Cloudflare; do not point the site back at Vercel. Leave mail records (MX, SPF, DKIM, DMARC) and CAA records in place.
- The database is Cloudflare D1 (SQLite via Void). Do not set Postgres in `void.config.ts`, and do not add Neon, a Neon `DATABASE_URL`, or Hyperdrive.
- Void allows only one root `.env` file. Do not create `.env.example` or `.env.local`. `env.ts` is the schema; `.env` is local-only and is not uploaded on deploy.
- Notices and calendar entries come from Nocoly and are stored in D1. Notice PDFs stay on Nocoly and are served through `/api/notices/:id/file/:slot` (`pathfinder` and `adventurer`). Album metadata and past-video records are in D1; photo files are on Google Cloud; past-video playback uses Mux playback IDs in D1. Mux API tokens are not used by the Worker.
- Pushing to `main` runs `.github/workflows/void-deploy.yml` (`void deploy`), which provisions D1 and applies migrations. The workflow does not use a `DATABASE_URL` secret. Nocoly keys and `CLERK_SECRET_KEY` are Worker secrets (`void secret put`). `VITE_CLERK_PUBLISHABLE_KEY` is a GitHub Actions variable because production builds ignore `.env`. Local `.env` keeps the Clerk development keys.
- Clerk sign-in follows the old site. Photo albums are `/{slug}` (for example `/2026-regular`). There is no album list and no `/archive` page. There is no member sign-up: `/sign-up` redirects home. Sign-in steps such as `/sign-in/factor-one` render the sign-in screen. Albums and `/adventurer-honors` require sign-in; honors content requires a Clerk user whose `publicMetadata.role` is `admin`. The home page, notices, and videos stay public. The home page shows a daily Bible verse stored in D1. Production Clerk uses DNS-only CNAMEs for `clerk.tuenmunpathfinder.com` and `accounts.tuenmunpathfinder.com`.
