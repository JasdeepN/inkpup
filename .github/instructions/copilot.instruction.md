# Copilot instructions — Tattoo business website (Next.js + Cloudflare)

Purpose
- Provide explicit, actionable guidance for implementing a SEO-first Next.js website for a Toronto/GTA tattoo business and for any automated assistant (Copilot-style) working on this repository.

High-level requirements (extract from user request)
- Build a Next.js site optimized for SEO and social engagement.
- Host on Cloudflare Pages/Workers.
- Prioritize local SEO for GTA/Toronto (NAP consistency, LocalBusiness schema, neighborhood pages).
- Provide shareable social assets (OG images) and review display.
- Scaffold minimal runnable starter files, tests, and deployment notes.

Contract (inputs / outputs / success criteria)
- Inputs: content (text, images), business info (name, address, phone, hours), portfolio items.
- Outputs: static/public site buildable with `npm run build` and runnable with `npm start` or `next start`, sitemap.xml, robots.txt, JSON-LD LocalBusiness in head, per-page meta/OG, deploy config for Cloudflare.
- Success: production build passes, sitemap present, sample LocalBusiness JSON-LD rendered on the homepage, canonical + OG meta present, basic Lighthouse SEO audit should pass core checks.

Edge cases to handle
- Missing business hours or geo coords: render schema partial but valid.
- Large galleries: lazy-load and use responsive srcsets / next/image or Cloudflare Images.
- Offline or CDN edge errors: fallback copy + clear error logging.

Repository layout to follow (prefer App Router)
- app/
  - layout.tsx, head.tsx
  - page.tsx (home), /portfolio/[slug]/page.tsx
  - /services/page.tsx, /contact/page.tsx, /blog/page.tsx
- components/
  - Meta.tsx
  - LocalBusinessJsonLd.tsx
  - Gallery.tsx
  - ReviewList.tsx
- public/social/ (OG images)
- scripts/generate-sitemap.js
- next.config.js
- next-sitemap.config.js

Deliverables for this task (minimum)
- Add/maintain: `Meta.tsx` (title/description/OG/canonical), `LocalBusinessJsonLd.tsx` (schema output), `robots.txt`, `next-sitemap.config.js`, and a short `README.md` with Cloudflare Pages deployment notes.
- Provide at least one sample portfolio page and a homepage with visible NAP and CTA (book/call).

Commands & QA (for devs/automation)
- Install: `npm ci` or `npm install`
- Dev: `npm run dev` (Next dev server)
- Build: `npm run build` then `npm run start` to test production
- Lint/type: `npm run lint` / `npm run typecheck` (if present)
- Tests: run unit tests (Jest/Playwright) if added

Cloudflare specifics
- Prefer deploying static pages with SSG/ISR to Cloudflare Pages.
- For edge SSR, use Cloudflare Workers/Pages Functions or the official Next.js adapter.
- Use Cloudflare Images or a remote loader for optimized image delivery; allowlist domains in `next.config.js`.

Developer notes / constraints
- Keep changes minimal and test-driven. Add unit tests for any business logic.
- Do not auto-commit or push changes on behalf of the user.
- When creating new files, follow the existing repo formatting and conventions (TypeScript/TSX preferred).

Next steps this file expects an implementer to follow
- Scaffold `app/layout.tsx`, `components/Meta.tsx`, and `components/LocalBusinessJsonLd.tsx`.
- Create `next.config.js` with recommended image loader settings for Cloudflare.
- Add `next-sitemap` config and `robots.txt`.

Contact / metadata
- Focus geography: Toronto, GTA; include neighborhood pages where possible.
- Social: encourage OG image per portfolio item and Instagram embed where appropriate.

Todo (copyable, use when working on the project)
```
- [ ] Create Next.js app skeleton (App Router) under `app/` with `layout.tsx` and `head.tsx`.
- [ ] Implement `components/Meta.tsx` to manage title, description, canonical, OG, and twitter meta.
- [ ] Implement `components/LocalBusinessJsonLd.tsx` and include it in the homepage layout.
- [ ] Add `robots.txt` and `next-sitemap.config.js` and script to generate sitemap.
- [ ] Add sample portfolio page with OG image and share buttons.
- [ ] Add Cloudflare Pages deployment notes to `README.md` and `next.config.js` settings.
- [ ] Run `npm run build` and verify production start works; fix any build issues.
- [ ] Submit sitemap to Google Search Console and verify indexing (manual step).
```

File created by Copilot instructions generator. Keep this file updated as the project evolves.
