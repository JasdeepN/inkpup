# Product Context

## Overview
InkPup Tattoos runs a Cloudflare-hosted Next.js App Router site that showcases the studio, embeds SEO metadata, and links prospects to current work while sharing infrastructure with a secure gallery admin portal.

## Core Features
- Marketing homepage with hero imagery, particles background, navigation, and Instagram call-to-action.
- Centralized business metadata surfaced through Meta and LocalBusinessJsonLd components backed by data/business.json.
- Cloudflare R2-backed gallery services that list, upload, optimize, and delete artwork with graceful fallbacks when storage is unavailable.
- Password-protected admin portal with server actions for gallery management and credential status messaging.
- Automation scripts and docs for configuring R2 CORS, custom domains, and Wrangler/OpenNext deployments.
- Playwright and Jest coverage for gallery views, navigation experiences, and storage behaviors.

## Technical Stack
- Next.js 15 App Router running on Cloudflare Workers via @opennextjs/cloudflare/OpenNext.
- React 19 with TypeScript, Tailwind CSS utilities, and SCSS globals.
- Cloudflare R2 storage accessed through native bindings or the AWS SDK (@aws-sdk/client-s3).
- Sharp-driven image optimization with fallbacks when the module is absent.
- Jest + Testing Library and Playwright for unit, integration, and end-to-end coverage.
- ESLint 9, PostCSS, and Tailwind configuration for linting and styling workflows.
