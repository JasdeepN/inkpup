# InkPup Tattoos Web Platform

## Purpose
Provide InkPup Tattoos with a Cloudflare-native web presence that combines the public marketing site and the internal gallery tooling while staying aligned with the studio brand.

## Target Users
- Prospective and returning tattoo clients in the Greater Toronto Area researching the studio.
- InkPup Tattoos staff and artists who curate gallery content and respond to inquiries.
- Developers responsible for the Cloudflare Workers deployment pipeline and storage automation.

## Project Summary
Next.js App Router marketing and admin experience for InkPup Tattoos, deployed to Cloudflare Workers via OpenNext with Cloudflare R2-backed media and automated infrastructure scripts.

## Goals
- Deliver a polished public marketing site with accurate business details, SEO metadata, and Instagram-driven portfolio highlights.
- Provide studio staff with a secure admin portal to upload, optimize, and curate Cloudflare R2 gallery assets.
- Keep Cloudflare deployment, analytics, and storage configuration reproducible through scripts, GitHub Actions, and Wrangler environments.

## Constraints
- Must deploy on Cloudflare Workers using the @opennextjs/cloudflare adapter and Wrangler-managed environments.
- All media lives in Cloudflare R2; credentials stay out of source control and the app must gracefully fall back when bindings are unavailable.
- Repository tests run under Jest and Playwright; CLI-driven Jest usage must include the --forceExit flag to avoid hung processes.

## Stakeholders
- InkPup Tattoos prospects and clients browsing the public site.
- InkPup Tattoos studio staff and artists maintaining gallery content.
- Site maintainers responsible for Cloudflare infrastructure, analytics, and storage operations.
