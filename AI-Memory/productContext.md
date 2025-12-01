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
- Admin webhook receiver for job lifecycle notifications: the site accepts signed job events from the upload worker to revalidate the admin UI and surface job states.
 - Cloudflare D1 pricing & gallery metadata persistence (size categories, styles, color profiles, and gallery_images table storing width/height/size_bytes + timestamps) with planned KV caching layer for high-frequency read optimization. [PRODUCT:2025-11-25]

## Technical Stack
- Next.js 15 App Router running on Cloudflare Workers via @opennextjs/cloudflare/OpenNext.
- React 19 with TypeScript, Tailwind CSS utilities, and SCSS globals.
- Cloudflare R2 storage accessed through native bindings or the AWS SDK (@aws-sdk/client-s3).
- Sharp-driven image optimization with fallbacks when the module is absent.
- Jest + Testing Library and Playwright for unit, integration, and end-to-end coverage.
- ESLint 9, PostCSS, and Tailwind configuration for linting and styling workflows.


## Project Description

[PRODUCT:2025-11-19] Public marketing site now includes dual segmentation: /flash (pre-designed pieces with booking flow) & /custom-design (consultation process and pricing). Hero component integrates both pathways via two cards (Flash vs Custom) improving above-the-fold clarity. Adaptive /contact form handles both flash bookings and custom consultations through query parameters (design, type) with dynamic fields and email content.



Hero now houses dual-path selection (Flash vs Custom) eliminating need for separate ServiceExplainer section. Homepage simpler, reduces scroll depth and improves conversion focus.



This project is a web application that emphasizes optimal memory management practices to enhance performance and reduce resource consumption.



This project is aimed at optimizing memory management in applications, ensuring efficient use of resources and improving performance.



This project involves memory management for saving prompts and related data.



Create a comprehensive prompt file to break down tasks into actionable steps with todos for each step.



## Architecture

[ARCH:2025-11-19] Hero grid widened (1.25fr copy / 1fr media). Adaptive form pattern implemented: server route /api/contact parses optional design_id, booking_type, concept, placement_size, budget; builds dynamic subject/body; degrades gracefully if RESEND_API_KEY not present.



Hero component expanded: left column contains two selectable cards (grid) with bullet lists + CTA; right column still hero image/carousel. Grid width adjusted in SCSS to 1.25fr/1fr for balanced layout.



The project follows a modular architecture with a focus on efficient memory management. Each module is designed to handle specific tasks while minimizing memory usage.



The project follows a modular architecture with a focus on memory management and efficient resource utilization. Each module is designed to handle specific tasks while minimizing memory overhead.



The architecture includes a memory management system that handles the storage and retrieval of prompts and other data.



Utilizes a structured approach to task management and memory storage.



## Technologies

- Next.js 15 App Router
- React 19
- TypeScript
- SCSS + Tailwind utilities
- Resend API (email)
- Cloudflare Workers/OpenNext
- Cloudflare R2 storage



- Next.js App Router
- React 19
- SCSS



- JavaScript
- HTML
- CSS
- REST APIs



- JavaScript
- Node.js
- Express



- JavaScript
- Node.js



- Markdown
- Task Management Tools



## Libraries and Dependencies

- next
- react
- @resend/client
- @testing-library/react
- jest
- playwright
- tailwindcss



- @testing-library/react
- jest



- React
- Node.js
- Express
- MongoDB



- memory.js
- resource-manager



- memory-management-lib



- Memory Management Libraries

[PRODUCT:2025-11-24] Cross-browser glassmorphism refinement implemented: adaptive blur for navigation (6px general / 4px Firefox) preserves particle background clarity while maintaining consistent hero aesthetic. Removed unused debug env variable to keep runtime behavior predictable.
[PRODUCT:2025-11-25] Remote gallery schema (gallery_images) established in dev database (version 3) with manual migration fallback; production D1 now configured with migrations_dir for unified schema evolution. Upcoming work: KV caching of gallery listings and signed URL TTL management.

