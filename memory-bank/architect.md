# InkPup Tattoos: System Architecture

## Overview
Architecture notes for the InkPup Tattoos web platform deployed on Cloudflare Workers via OpenNext and surfaced through Next.js App Router.

## Architectural Decisions

- Adopt responsive two-column hero grid with stat cards and quick actions
- Integrate Cloudflare GraphQL Analytics API for real-time traffic stats
- Use stat cards for Today, 7-day, and 30-day KPIs
- Show recent uploads, job queue, and quick links as separate cards
- Add error and loading states for all data-driven components



- Prioritize memory management in all code changes.



- Prioritize memory management in architectural decisions.
- Implement regular context updates during development cycles.



- Prompts will be saved in the MemoryManagement component instead of the prompt file.



- Use a tagging system for easy categorization of tasks
- Implement a memory-saving feature for completed tasks



- Use a prompt file to outline tasks and steps
- Implement a system for saving and retrieving tasks with #todos



- Use a prompt file format for consistency
- Implement a system for tracking progress on tasks



- Use a tagging system for easy identification of tasks
- Implement a memory storage solution for todos



- Extracted JobSummary and UploadForm as modular admin components for maintainability and testability
- Updated test to use getAllByText to resolve duplicate text node issue



- Dashboard now uses JobSummary for consistency with other admin pages.



- Uploads page now uses extracted components for consistency and maintainability.



- Refactored gallery management to use extracted components and modular structure.



- Extracted upload form and job summary into reusable components for DRYness and maintainability.



- Split /admin into dashboard, gallery, and uploads pages for modularity and clarity.
- Introduced shared layout for host/session enforcement.



- Adopt Next.js 15 metadata API and React 19 features as architectural foundation
- Automate as much as possible (sitemaps, audits, monitoring) for reliability and maintainability


- Serve the public site with Next.js App Router (Next 15) bundled by @opennextjs/cloudflare/OpenNext so the worker build runs on Cloudflare Workers with .open-next assets and nodejs_compat enabled.
- Persist gallery media in Cloudflare R2; lib/r2server probes for native bindings, falls back to the AWS S3 client, and can return bundled backups in non-production environments to keep the UI responsive.
- Expose a password-protected admin portal scoped to approved admin hosts; server actions manage uploads and deletes while enforcing signed session cookies.
- Run image uploads through Sharp optimization (rotate, resize to MAX_IMAGE_WIDTH, WebP) before writing to R2, falling back to original buffers when Sharp is unavailable.
- Centralize business metadata and SEO schema through data/business.json, Meta, and LocalBusinessJsonLd components so copy updates stay consistent across the site.

## Design Considerations

- Mobile-first, accessible design (min 44x44px touch targets, readable text, ARIA labels)
- Graceful fallback for missing analytics data
- Caching Cloudflare API results to avoid rate limits
- Dark theme with improved card contrast and depth



- Emphasize memory management in code updates.
- Keep tasks small and concise for better focus.
- Continuously update context to maintain clarity.



- Emphasize memory management in code updates.
- Keep tasks small and concise for better focus and efficiency.
- Continuously update context to maintain clarity in development.



- Data should be saved in the correct memory files to avoid confusion.
- Enhancements should improve the efficiency of memory retrieval.



- Ensure clarity in task breakdown
- Maintain a structured format for todos
- Allow for easy retrieval and updating of tasks



- Ensure tasks are clearly defined and actionable
- Maintain a structured format for easy retrieval
- Incorporate tagging for better organization



- Ensure tasks are clear and actionable
- Maintain a structured format for easy retrieval
- Incorporate tagging for better organization



- Ensure clarity in task breakdown
- Maintain a structured format for todos
- Allow for easy retrieval and updating of tasks



- Dashboard is the entry point for admin users.



- Uploads page should be accessible only to authenticated admins.



- Ensure all gallery actions are protected by admin layout/session.



- Components should be used in both uploads and gallery pages as needed.



- All admin pages must be protected by host and session checks.
- Redirect /admin to /admin/dashboard for a clear entry point.



- Each step validated with real user and SEO tools before moving to the next
- Automated and manual audits for accessibility and SEO
- A/B testing for CTAs and user engagement elements



- For Python scripts we must use Pylance tools (e.g., configure environment, run code snippets) rather than generic alternatives.



- Terminal usage: run long-lived commands (e.g. npm run dev) in background mode using '&' or a new terminal session; avoid interrupting them with Ctrl+C immediately after launch.


- Local development toggles between Next-only dev (shimmed bindings) and Wrangler dev with real bindings; scripts make it easy to switch without leaking credentials.
- Storage helpers preserve synchronous instrumentation (global sendMock) so existing Jest suites can assert on client behavior without refactoring.

## Components

### AdminDashboard

Modernized admin dashboard UI/UX for portfolio backend, featuring a responsive grid, stat cards, Cloudflare analytics integration, and quick actions.

**Responsibilities:**

- Display key business and traffic metrics (Cloudflare hits, bandwidth, cache rate)
- Show upload queue and recent activity
- Provide quick access to gallery, uploads, and admin actions
- Surface alerts and notifications
- Ensure mobile-first, accessible, and visually appealing layout

### CloudflareAnalyticsFetcher

Server-side data layer for fetching and caching Cloudflare traffic analytics via GraphQL API.

**Responsibilities:**

- Fetch and cache request/visit/bandwidth stats from Cloudflare
- Expose metrics for dashboard stat cards
- Handle API errors and missing credentials gracefully

### StatCard

Reusable stat card component for displaying KPIs and trends in the dashboard.

**Responsibilities:**

- Show metric value, label, icon, and trend delta
- Support loading, error, and fallback states
- Integrate sparkline or mini chart for trends

### QuickActions

UI component for primary admin actions (upload, manage gallery, view leads).

**Responsibilities:**

- Display accessible, icon-based action buttons
- Ensure 48px+ touch targets and keyboard navigation

### RecentUploadsList

Card component listing recent uploads for admin review.

**Responsibilities:**

- Show recent gallery uploads with thumbnails and metadata
- Link to full gallery management page

### JobSummary

Expanded job summary card for queued, scheduled, and dead-lettered uploads.

**Responsibilities:**

- Show job counts and status badges
- Link to detailed job/activity log





### MemoryManagement

Memory Management System

**Responsibilities:**

- Store and manage prompts and their responses
- Ensure data integrity and retrieval efficiency





### TaskManager

Task Management System

**Responsibilities:**

- Break down tasks into actionable steps
- Save tasks with #todos for tracking
- Facilitate project management and memory management





### TaskManager

Task Management System

**Responsibilities:**

- Break down tasks into actionable steps
- Save tasks with #todos for tracking
- Facilitate project management and memory management





### TaskManager

Task Management System

**Responsibilities:**

- Break down tasks into actionable steps
- Save tasks with #todos for tracking
- Facilitate project management and memory management





### TaskManager

Task Management System

**Responsibilities:**

- Break down tasks into actionable steps
- Save tasks with #todos for tracking
- Facilitate project management and memory management





### JobSummary

Displays admin job queue summary and status counts.

**Responsibilities:**

- Show queued, scheduled, and dead-lettered job counts
- Display oldest queued and next retry times

### UploadForm

Handles admin image uploads with validation and feedback.

**Responsibilities:**

- Accept image files for upload
- Show upload progress and errors





### AdminDashboardPage (app/admin/dashboard/page.tsx)

Admin dashboard landing page. Uses JobSummary for upload queue status. Placeholder for quick links and recent activity.

**Responsibilities:**

- Landing page for admin portal
- Show upload queue status





### AdminUploadsPage (app/admin/uploads/page.tsx)

Dedicated uploads page for admin. Uses UploadForm and JobSummary components. Handles image uploads and shows queue status.

**Responsibilities:**

- Image upload for admin
- Upload queue status





### AdminGalleryPage (app/admin/gallery/page.tsx)

Gallery management UI for admin. Now uses UploadForm and JobSummary components. Handles category tabs, gallery list, and delete actions.

**Responsibilities:**

- Gallery management for admin
- Image deletion
- Category navigation
- Upload form integration





### UploadForm (components/admin/UploadForm.tsx)

Reusable upload form for admin image uploads. Used in uploads and gallery pages.

**Responsibilities:**

- Image upload form
- Category selection
- Alt/caption input

### JobSummary (components/admin/JobSummary.tsx)

Reusable job summary/status card for admin. Shows queued, scheduled, and dead-lettered uploads.

**Responsibilities:**

- Display upload queue status
- Show retry/oldest queued info





### AdminLayout (app/admin/layout.tsx)

Shared layout for all admin pages. Enforces admin host and session authentication before rendering children.

**Responsibilities:**

- Host enforcement
- Session authentication
- Wraps all admin subpages

### AdminDashboardPage (app/admin/dashboard/page.tsx)

Admin dashboard landing page. Placeholder for job summary, quick links, and recent activity.

**Responsibilities:**

- Landing page for admin portal

### AdminGalleryPage (app/admin/gallery/page.tsx)

Gallery management UI for admin. Will show gallery list, delete UI, and category tabs.

**Responsibilities:**

- Gallery management for admin

### AdminUploadsPage (app/admin/uploads/page.tsx)

Dedicated uploads page for admin. Will contain upload form and queue hints.

**Responsibilities:**

- Image upload for admin





### SEO Optimization

Implements modern SEO best practices for Next.js 15 portfolio site, including metadata, structured data, SSR/SSG/ISR, image optimization, Core Web Vitals, routing, and automated sitemap/robots.txt.

**Responsibilities:**

- Centralize metadata using Next.js 15 metadata API
- Add and validate JSON-LD structured data
- Choose optimal rendering mode per page (SSR/SSG/ISR)
- Optimize all images with Next.js Image component
- Monitor and improve Core Web Vitals
- Maintain clean, canonical URLs with dynamic routing
- Automate sitemap and robots.txt generation

### User Impact Optimization

Maximizes user engagement and accessibility using React 19 features, mobile-first design, fast/bold UX, clear CTAs, and social proof.

**Responsibilities:**

- Leverage React 19 Server Components and use() for performance
- Ensure accessibility with semantic HTML, ARIA, and audits
- Design mobile-first, responsive layouts and components
- Deliver fast, bold, interactive UX with suspense, code splitting, and micro-interactions
- Strategically place and test CTAs
- Showcase social proof with testimonials and project stats





### Public App Router
app/ layout, head, and page modules render the marketing site, hero, and Instagram CTA.

**Responsibilities:**
- Render marketing content and Instagram CTAs for InkPup Tattoos.
- Load structured data and analytics scripts.
- Share global styles, header, footer, and particles background.

### Admin Portal
app/(admin)/admin/page.tsx implements server actions, authentication, and gallery management UI.

**Responsibilities:**
- Gate access by host and portal password.
- Handle uploads, deletions, and feedback messaging.
- Revalidate gallery routes after mutations.

### R2 Storage Module
lib/r2server/* houses credentials, storage helpers, and fallback logic.

**Responsibilities:**
- Create S3 clients or use Cloudflare bindings.
- Optimize and upload images, delete keys, list gallery entries.
- Report credential status and expose fallback results when R2 is unreachable.

### Business Data
data/business.json and SEO components synchronize contact information and LocalBusiness JSON-LD.

**Responsibilities:**
- Provide canonical business details for metadata and UI.
- Drive dynamic titles, descriptions, and schema markup.

### Deployment & Infrastructure Config
open-next.config.*, wrangler.toml, and scripts/configure-r2-*.js encode Cloudflare build and storage automation.

**Responsibilities:**
- Build Worker bundles and asset manifests.
- Bind R2 buckets and configure routes per environment.
- Manage R2 CORS, custom domains, and GitHub Actions secrets.
