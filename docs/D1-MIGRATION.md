# D1 Gallery Migration & Verification

This document outlines the changes made to integrate Cloudflare D1 for gallery image metadata storage and how to verify the integration.

## Changes Implemented

1.  **Database Schema**:
    *   Verified `gallery_images` table exists in D1.
    *   Columns: `id`, `key`, `url`, `category`, `alt`, `caption`, `width`, `height`, `size_bytes`, `uploaded_at`, `updated_at`.

2.  **Type Definitions**:
    *   Updated `GalleryItem` in `lib/gallery-types.ts` to include `width`, `height`, and `lastModified`.

3.  **R2 Integration**:
    *   **Upload**: Modified `lib/r2server/storage.ts` to extract image dimensions using `sharp`.
    *   **Queue**: Updated `lib/r2server/queue.ts` to insert metadata into D1 (`insertGalleryImage`) after successful R2 upload.
    *   **Delete**: Updated `lib/r2server/storage.ts` to delete metadata from D1 (`deleteGalleryImage`) after successful R2 deletion.

4.  **D1 Client**:
    *   Updated `lib/db/d1.ts` to support the new schema fields (`width`, `height`).
    *   Added `getAllGalleryImages` for debugging.

## Verification Steps

### 1. Local Verification (Manual)

You can verify the D1 operations using `wrangler`:

```bash
# Check table existence
npx wrangler d1 execute inkpup-db-dev --local --env dev --command "SELECT name FROM sqlite_master WHERE type='table' AND name='gallery_images';"

# Insert a test record
npx wrangler d1 execute inkpup-db-dev --local --env dev --command "INSERT INTO gallery_images (id, key, url, category, alt, caption, width, height, size_bytes, uploaded_at, updated_at) VALUES ('test-manual', 'test-key-manual', 'http://example.com', 'art', 'Manual Test', 'Caption', 800, 600, 1024, 1234567890, 1234567890);"

# Read it back
npx wrangler d1 execute inkpup-db-dev --local --env dev --command "SELECT * FROM gallery_images WHERE id='test-manual';"

# Delete it
npx wrangler d1 execute inkpup-db-dev --local --env dev --command "DELETE FROM gallery_images WHERE id='test-manual';"
```

### 2. Application Verification

A debug page has been added at `/test-gallery-d1`.

**Prerequisites**:
The application must be running in an environment where the `DB` binding is available.
*   **Local**: Use `npm run preview` (if configured with wrangler) or `wrangler dev`.
    *   *Note*: Standard `npm run dev` (Next.js dev server) does **not** have access to the D1 binding by default.
*   **Production/Preview**: Deploy to Cloudflare Pages.

**Using the Test Page**:
1.  Navigate to `/test-gallery-d1`.
2.  Click "Create Test Record in D1" to insert a dummy record via the API.
3.  Verify the record appears in the list.
4.  Click "Delete from D1" to remove the record.

### 3. Full Integration Test

To test the full flow (Upload Image -> R2 -> D1):
1.  Go to the Admin Dashboard (`/admin`).
2.  Upload a real image to the gallery.
3.  Check the `/test-gallery-d1` page (or query D1 directly) to see if the new image appears with correct dimensions.
4.  Delete the image from the Admin Dashboard.
5.  Verify it is removed from D1.

### 4. Remote/Shared Environment Testing (QAT/UAT)

If you are using a shared D1 database for Dev/QAT/UAT and want to test against it locally:

1.  **Build the Worker**:
    ```bash
    npm run opennext:build
    ```

2.  **Run with Remote Connection**:
    ```bash
    npx wrangler dev --remote --env dev
    ```
    *   This runs the application locally but connects to the **actual remote D1 database** defined in `wrangler.toml` (env.dev).
    *   **Warning**: Actions taken here (like deleting images) will affect the shared database.

3.  **Verify Data Remotely**:
    ```bash
    npx wrangler d1 execute inkpup-db-dev --remote --env dev --command "SELECT * FROM gallery_images ORDER BY uploaded_at DESC LIMIT 5;"
    ```

## Troubleshooting

*   **"D1 binding not found"**: This error occurs when the `DB` environment variable is missing. This is expected when running `next dev` locally without a proxy or binding injector. Use `wrangler` commands for local data verification.
