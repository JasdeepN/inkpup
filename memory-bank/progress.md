# Progress (Updated: 2025-10-20)

## Done

- Wrapped GalleryView dialog cancel and resize interactions in React.act to eliminate React 19 warnings; Jest suite rerun cleanly.
- Made CF_WEB_ANALYTICS_TOKEN optional in reusable Cloudflare deploy workflow to prevent false-required failure.
- Moved R2 credentials into env-specific vars in wrangler.toml so Cloudflare Worker inherits secrets; resolved wrangler warnings about missing env vars.
- Renamed env var to R2_BUCKET_NAME in wrangler.toml to avoid binding name collision with R2 bucket binding.

## Doing



## Next


