# Local Cloudflare Development Guide

This project supports two local development modes:

1) Next-only dev server (fast feedback, no real bindings)
- Run with `npm run dev`.
- We initialize the Cloudflare context in `next.config.js` via `initOpenNextCloudflareForDev()` so calls to `getCloudflareContext()` do not error during `next dev`.
- R2 access during Next-only dev works in two ways:
  - Preferred: provide a Cloudflare R2 binding via Wrangler (not available in pure Next dev) → use Wrangler dev below, or
  - Fallback: provide R2 environment credentials so the app can reach R2 with the S3-compatible API.

2) Wrangler dev (closest to production)
- Build the app with the OpenNext Cloudflare adapter and preview the Worker with Wrangler. This gives you real Cloudflare bindings (R2, KV, etc.).

---

## Next-only dev server (no bindings)

- Start the dev server:

```bash
npm run dev
```

- If you need mutation (upload/delete) without bindings, set the following env vars locally (do NOT commit secrets):
  - `R2_ACCOUNT_ID`
  - `R2_API_TOKEN` (or `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY`, plus `R2_SESSION_TOKEN` when you are reusing temporary credentials from the CI pipeline)
  - `R2_BUCKET`

The server code will derive the access key id from `R2_API_TOKEN` when needed. See `lib/r2-server.ts` for details. When you import temporary credentials from a CI run, remember to set `AWS_SESSION_TOKEN` alongside `R2_SESSION_TOKEN` so lower-level AWS SDK calls continue to work during local tooling.

- Public image URLs are built from `R2_PUBLIC_HOSTNAME` (defaults to `https://r2.inkpup.ca`). You can override locally to test against raw R2 endpoints, but remember to revert.

### Troubleshooting Next-only dev
- Error: `getCloudflareContext ... initOpenNextCloudflareForDev` → We added `initOpenNextCloudflareForDev()` in `next.config.js`. Ensure `@opennextjs/cloudflare` is installed and restart the dev server.
- Missing credentials message but you set a token → Confirm you used `R2_API_TOKEN` and `R2_ACCOUNT_ID` (not `CF_*` names). Restart after editing `.env`.
- Uploads failing with binding present → In pure `next dev`, a shim context may expose an `R2_BUCKET` placeholder without full methods. We now only use a binding if it implements the required method (`put`, `list`, `delete`). Otherwise the code falls back to the S3-compatible client using your `R2_*` env vars.
- Listing shows items that 404 on view → The dev shim can list stale or simulated data. Set `R2_FORCE_S3=true` to bypass bindings entirely and use the S3 API in dev; this ensures the UI reflects real R2 state.

---

## Wrangler dev (with real bindings)

This path builds the Worker and runs a local Cloudflare simulation with real bindings.

1) Build for Cloudflare:
```bash
npm run opennext:build
```

2) Start Wrangler dev:
```bash
npx wrangler dev
```

Wrangler reads `wrangler.toml`. This repo binds the R2 bucket as:

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "inkpup"
```

- Use your own bucket name if needed. Wrangler requires a literal bucket name here; it does not expand `${R2_BUCKET}` for `bucket_name`.
- The binding makes uploads/deletes work without any R2_* env credentials.

### Routes and hosts
- `env.dev` and `env.production` sections in `wrangler.toml` define routes. Update them to match your zones if you deploy using routes.
- For purely local dev, the default `wrangler dev` tunnel will work without needing a public DNS route.

### Troubleshooting Wrangler dev
- Error: `r2_buckets[0].bucket_name="${R2_BUCKET}" is invalid` → Use a literal bucket name. This repo already sets `bucket_name = "inkpup"`.
- Credentials errors when deploying → Ensure `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_API_TOKEN` (or `CF_*` aliases) are exported in your shell.

---

## Security notes

- Do not commit secrets. If you need to use env credentials locally, keep them in your untracked `.env` and avoid pushing.
- Prefer bindings (Wrangler dev and production) where possible; they avoid copying secrets and better match the production runtime.

---

## Quick reference

- Next-only dev:
```bash
npm run dev
```

- Wrangler dev (with bindings):
```bash
npm run opennext:build
npx wrangler dev
```

- Typecheck, lint, and tests:
```bash
npx tsc -p tsconfig.json --noEmit
npm run lint
npm test
```
