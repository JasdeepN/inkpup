# InkPup Tattoos — Website scaffold

This repository contains a Next.js App Router scaffold for a tattoo studio website intended for the GTA/Toronto area.

What I added
- Minimal Next.js scaffold (App Router) with `app/layout.tsx`, `app/head.tsx`, and a homepage.
- `components/Meta.tsx` and `components/LocalBusinessJsonLd.tsx` for SEO and structured data.
- `next.config.js`, `next-sitemap.config.js`, and `public/robots.txt`.

Assumptions
- Business Instagram: `https://www.instagram.com/inkpup.tattoos/` — used as the social handle and link.
- Business name assumed: "InkPup Tattoos" (please update `components/LocalBusinessJsonLd.tsx` with exact business info: address, phone, hours, geo coords).
- Replace `your-domain.example` in `next-sitemap.config.js` and `public/robots.txt` with the production domain before deploying (use `https://www.inkpup.ca`).

Getting started
1. Install dependencies:
```bash
npm install
```
2. Run dev server:
```bash
npm run dev
```
3. Build for production:
```bash
npm run build
npm run start
```

Cloudflare Workers notes
- Build and deploy with the `@opennextjs/cloudflare` adapter (`npm run opennext:build` / `npm run opennext:deploy`) as documented in [OpenNext for Cloudflare – Get started](https://opennext.js.org/cloudflare/get-started).
- Ensure `wrangler.toml` keeps the compatibility date at `2024-09-23` or later with `nodejs_compat` enabled so the Worker runtime matches the adapter requirements.

Cloudflare deployment (GitHub Actions)

This repo contains a GitHub Actions workflow at `.github/workflows/deploy-cloudflare-workers.yml` that builds, tests, and deploys the Worker via `@opennextjs/cloudflare`. The legacy `.github/workflows/deploy-cloudflare-pages.yml` file is deprecated and kept only as a stub to avoid duplicate runs.

### Required GitHub secrets

Set the following repository secrets under **Settings → Secrets and variables → Actions**:

- `CF_API_TOKEN` – a Cloudflare API token with the Workers "Edit" template (or `Account.Workers Scripts:Edit`, `Account.Workers Scripts:Read`, and any additional resources your app binds to, such as R2 or KV). Wrangler 3.99+ is required by the adapter (see [OpenNext CLI docs](https://opennext.js.org/cloudflare/cli)).
- `CF_ACCOUNT_ID` – the account identifier from the Cloudflare dashboard (**Manage Account → Overview → Account ID**).

The workflow exports these secrets to the OpenNext CLI as `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Tokens created before 2024 may be missing the Workers scripts scopes; recreate them if the deploy step reports permission errors.

### Validating credentials locally

Before triggering the workflow, confirm that the token and account ID line up:

```bash
export CLOUDFLARE_API_TOKEN=YOUR_TOKEN
export CLOUDFLARE_ACCOUNT_ID=YOUR_ACCOUNT_ID
npx --yes wrangler@4 whoami --config wrangler.toml --account "$CLOUDFLARE_ACCOUNT_ID"
```

The command should print membership details for the account. A failure that mentions "no route for that URI" or Cloudflare API error **7003** indicates an invalid identifier or missing permission; re-copy the Account ID or regenerate the token with Projects:Read/Write, Pages:Read/Write, and Workers Scripts:Read scopes. See [Bobcares – *How to Resolve Cloudflare API Error 7003* (Dec 2024)](https://bobcares.com/blog/cloudflare-api-error-7003/) for a deeper breakdown of common causes.

### Verify the latest Worker deployment

The workflow checks the active deployment after publishing. You can reproduce the same verification locally with Wrangler’s deployments API:

```bash
export CLOUDFLARE_API_TOKEN=YOUR_TOKEN
export CLOUDFLARE_ACCOUNT_ID=YOUR_ACCOUNT_ID
npx --yes wrangler@4 deployments status --config wrangler.toml
```

`wrangler deployments status` prints the most recent Worker version and whether traffic is serving from it ([Wrangler command reference](https://developers.cloudflare.com/workers/wrangler/commands/#deployments)). A non-zero exit means the account ID or token scopes are incorrect, or the Worker has not been published yet.

### Troubleshooting error 7003

Error 7003 means the request could not be routed to the targeted resource—most often because the Account ID or token scopes do not match the Worker you're deploying to. Double-check the values saved in GitHub Secrets and verify that the OpenNext `wrangler.toml` file references the same account. If the issue persists, rerun `wrangler whoami` / `wrangler deployments status` locally to confirm the token can see the account; Cloudflare will respond with a non-zero status when the combination is invalid.

Update business data
- Edit `data/business.json` with exact address, phone, email, website domain before deploying. The layout uses this file to populate LocalBusiness JSON-LD.

End-to-end tests (Playwright)

This project includes Playwright e2e tests that cover the gallery experience (category switching, error states, modal interactions) in addition to navigation, skip links, and mobile menu behavior.

To run the tests locally:

1. Install Playwright and browsers:

```bash
npm i -D @playwright/test
npx playwright install
```

2. Start the dev server on the default port (or note the port shown):

```bash
npm run dev
```

3. In another terminal, run the tests (set the base URL if your dev server uses a different port):

```bash
# if your dev server runs on :3002
PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test
```

The tests are located under `tests/e2e/` and the Playwright config is `playwright.config.ts`.

Storybook snapshot tests

Storybook stories are validated with the official test runner to ensure they render without regressions. Run them from a clean workspace with:

```bash
npm run test:storybook
```

The script will build Storybook, serve the static build, and execute the runner with DOM snapshot assertions stored under `__snapshots__/`.

## Local GitHub Actions cache for `act`

Running `act` repeatedly can be slow if the Docker runner images have to be re-downloaded each time. This project bundles a helper script, inspired by the [official `act` image catalog](https://github.com/nektos/act/blob/master/IMAGES.md), that pulls `ghcr.io/catthehacker/ubuntu:act-latest`, stores a compressed archive locally, and can reload it on demand.

```bash
# Warm (pull + save) the cache
npm run act:cache:warm

# Restore images from the cache before running act
npm run act:cache:load

# Inspect cache status or remove the archives
npm run act:cache:list
npm run act:cache:prune
```

By default the archives are written to `~/.cache/act-images`. You can override the location or image list by setting `ACT_IMAGE_CACHE_DIR` and `ACT_IMAGE_CACHE_IMAGES` (space-delimited) before executing the script. After warming the cache, you can run `act` with `--pull=false` or rely on the cached layers for much faster local CI loops.

## Admin portal

A password-protected gallery portal is available for managing Cloudflare R2 assets. Configure the following environment variables (see `.env.example`):

- `ADMIN_PORTAL_SLUG`: Single path segment for the hidden URL (e.g. `studio-console` -> `/studio-console`).
- `ADMIN_PORTAL_PASSWORD`: Portal password required to sign in.
- `ADMIN_SESSION_SECRET`: Secret used to sign session cookies (rotate on compromise).
- Optional overrides: `ADMIN_SESSION_COOKIE_NAME`, `ADMIN_SESSION_TTL_HOURS`, and `R2_MAX_IMAGE_WIDTH` (defaults to 1800px).

Uploads are optimized with Sharp (auto-rotation, max width, WebP output) before being pushed to R2 with long-lived cache headers. The portal lists existing gallery assets, provides direct links, and supports deletion. R2 credentials (`R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) must be present for mutations; otherwise, the UI falls back to read-only mode.

## Attribution

This project uses the "Wolf" icon from Flaticon for the site favicon. The icon is provided by the author Freepik and is free to use with attribution.

Required attribution:

"Wolf icon by Freepik from www.flaticon.com"

See `ATTRIBUTION.md` for details and usage instructions.
