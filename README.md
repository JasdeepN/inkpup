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

Cloudflare Pages notes
- Use SSG/ISR pages where possible. For Cloudflare Pages, connect the repository and set the build command to `npm run build` and output directory to `.next` (or use adapter/Workers for SSR features).

Cloudflare deployment (GitHub Actions)

This repo contains a GitHub Actions workflow at `.github/workflows/deploy-cloudflare-pages.yml` that builds the site. You'll still need to connect the repository to Cloudflare Pages (recommended) or implement a script to upload `.next` artifacts to Pages/Workers depending on your preferred deployment.

Update business data
- Edit `data/business.json` with exact address, phone, email, website domain before deploying. The layout uses this file to populate LocalBusiness JSON-LD.

End-to-end tests (Playwright)

This project includes Playwright e2e tests that verify keyboard navigation (skip link) and mobile menu behavior.

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
