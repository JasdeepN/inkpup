# Admin Components

This directory contains modular, reusable components for the InkPup Tattoos admin portal. Each component is designed for clarity, testability, and maintainability, and is used across multiple admin pages (dashboard, uploads, gallery).

## Components

### JobSummary (`JobSummary.tsx`)
- **Purpose:** Displays a summary of the upload job queue, including counts for queued, scheduled retries, and dead-lettered jobs.
- **Props:**
  - `jobSummary`: `{ queued: number, scheduled: number, deadLetter: number, nextReadyAt?: number, oldestQueuedAt?: number }`
- **Usage:** Used in dashboard, uploads, and gallery admin pages to show current job status.
- **Test:** `JobSummary.test.tsx`

### UploadForm (`UploadForm.tsx`)
- **Purpose:** Handles image uploads for the admin portal, including file selection, validation, and feedback.
- **Props:**
  - Accepts image files, category selection, and alt/caption input.
- **Usage:** Used in uploads and gallery admin pages for uploading new images.
- **Test:** `UploadForm.test.tsx`

## Testing
- All components are covered by Jest and React Testing Library tests.
- To run tests:
  ```bash
  npm test
  ```

## Patterns
- Components are written as function components with TypeScript for type safety.
- Default exports are used for compatibility with Next.js dynamic imports and test runners.
- All components are designed to be stateless and receive all data via props.

## Maintenance
- When adding new admin components, create a corresponding test file and update this README with usage and props.
- For architectural changes, update the memory bank (`memory-bank/architect.md`) and this documentation to keep the system in sync.
