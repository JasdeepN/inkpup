# Progress (Updated: 2025-11-27)

## Done

- [2025-11-27] Phase 1: Created /api/admin/logout/route.ts - clears session cookie and redirects
- [2025-11-27] Phase 1: Added buildRedirectUrl() helper to /api/contact/route.ts - respects X-Forwarded-* headers
- [2025-11-27] Phase 3: Added adminFadeIn animation to _admin.scss with prefers-reduced-motion support
- [2025-11-27] Phase 2: Installed svix, created D1 migration 007 for direction/from_email/resend_email_id columns
- [2025-11-27] Phase 2: Created /api/webhooks/resend/route.ts for inbound email capture
- [2025-11-27] Phase 2: Updated InquiryDetail.tsx - shows inbound (blue) vs outbound (green) emails
- [2025-11-27] CI/CD: Refactored deploy workflow to build-once/reuse pattern with artifact sharing
- [2025-11-27] CI/CD: Simplified cloudflare-reusable.yml - removed credential derivation complexity
- [2025-11-27] CI/CD: Added RESEND_WEBHOOK_SECRET to workflow secrets and wrangler.toml
- [2025-11-27] Fixed lint warnings: removed 21 unused eslint-disable directives
- [2025-11-27] All tests pass (658/659), build succeeds, lint clean

## Doing



## Next

- Manual test: logout on admin.devapp.lan
- Manual test: contact form redirect on devapp.lan
- Manual config: Enable Resend receiving + MX record for mail.inkpup.ca
- Manual config: Add RESEND_WEBHOOK_SECRET to production GitHub secrets
- Test inbound email webhook flow end-to-end
- Write admin portal E2E tests after manual verification
