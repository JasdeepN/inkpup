# Copilot instructions — Tattoo business website (Next.js + Cloudflare)


**CHAT MODE INSTRUCTIONS ALWAYS TAKE PRIORITY**

Purpose
- Provide explicit, actionable guidance for implementing a SEO-first Next.js website for a Toronto/GTA tattoo business and for any automated assistant (Copilot-style) working on this repository.

Toolsets for Implementation (from Tools.toolsets.jsonc):

**Deep Thinking**
- Use for structured thinking, problem solving, and action planning. Always prefer these tools for research, planning, and complex analysis.

**Memory Management**
- Use for managing and utilizing project memory, tracking progress, updating context, and logging decisions.

**Web Research**
- Use for light web research and information gathering only when Deep Thinking tools are not sufficient.

**Project Management**
- Use for managing project briefs, tracking progress, updating system patterns, and overall project organization.

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
  - /about/page.tsx, /contact/page.tsx, /blog/page.tsx
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

Styling / Tailwind best practices
- Use Tailwind for layout, spacing, and utility-first patterns. Prefer semantic class names only when a style is reused often and extract it to SCSS with `@apply`.
- Keep components lightweight: use Tailwind utility classes in JSX for one-off styles; extract repeated patterns to SCSS (e.g., `.btn-primary`, `.card`, `.prose` overrides).
- SCSS modules or global `app/globals.scss` may hold design tokens (CSS variables), utility helpers, and `@apply` extracted classes.
- Content paths in `tailwind.config.js` must include `./app`, `./components`, and `./pages` so unused CSS is purged in production.
- Accessibility: always include focus styles (use `focus:outline-none focus:ring-2 focus:ring-offset-2` or `ring` utilities) and ensure sufficient color contrast for text over backgrounds.
- Typography: use `@tailwindcss/typography` for blog/portfolio body copy and adjust via `prose` utility classes in SCSS when necessary.
- Forms: use `@tailwindcss/forms` to normalize inputs and apply consistent spacing.
- Keep dark mode consistent with `darkMode: 'class'` — add a `theme` class on the `<html>` root for toggling.
- Responsive design: prefer mobile-first utilities (no `sm:` prefix for base), and test at common breakpoints: 640, 768, 1024, 1280.
- Naming convention: when extracting utilities to classes, use BEM-like or semantic names: `.btn`, `.btn--primary`, `.card`, `.gallery__item`.
- Performance: avoid deep nesting and large custom CSS — rely on Tailwind utilities to reduce specificity and CSS size.
- Example: extract a reusable CTA button in `app/globals.scss` and use it like `<button className="btn btn--primary">Book</button>`.

Example SCSS extract (in `app/globals.scss`):
```
.btn { @apply inline-flex items-center justify-center gap-2 rounded-md font-medium; }
.btn--primary { @apply bg-accent text-white px-4 py-2 shadow; }
.card { @apply bg-white rounded-lg p-4 shadow-sm; }
.prose-custom { @apply prose prose-sm md:prose lg:prose-lg; }
```

Linting & consistency
- Add a Tailwind lint rule or ESLint plugin for className ordering if desired (optional).
- Document component styling patterns in this instructions file when you introduce a new pattern.

Tests
- Is using `npx jest` for any testing you MUST use the `--forceExit` flag in addition to any other flags you are using if running tests in Terminal.
- Do NOT run tests without this flag if you don't, test suite will hang forever and you will not be able to continue without human intervention.
- `--testTimeout=xxxxx` does not work DO NOT use it

File created by Copilot instructions generator. Keep this file updated as the project evolves.
