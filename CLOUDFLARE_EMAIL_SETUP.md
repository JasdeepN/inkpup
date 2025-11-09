# Cloudflare Email Workers Setup

This project uses **Cloudflare Email Workers** with the native `send_email` binding for contact form email delivery.

## Overview

- **Service**: Cloudflare Email Routing + Email Workers
- **Cost**: Free (100,000 Workers requests/day)
- **No external dependencies**: No third-party API keys required
- **Configuration**: Managed via `wrangler.toml` bindings

## Requirements

1. **Email Routing Enabled**: Must have Cloudflare Email Routing configured for your domain
2. **Verified Email Address**: At least one verified email address in Email Routing
3. **Send Email Binding**: Configured in `wrangler.toml`

## Current Configuration

### Email Routing Setup
- **Domain**: `inkpup.ca`
- **Test Email**: `test@inkpup.ca` → forwards to `jasdeepn4@hotmail.com`
- **Sender**: `noreply@inkpup.ca`

### Wrangler.toml Binding

```toml
# Global binding
send_email = [
  { type = "send_email", name = "SEND_EMAIL", allowed_destination_addresses = ["*"] }
]

# Dev environment
[[env.dev.send_email]]
type = "send_email"
name = "SEND_EMAIL"
allowed_destination_addresses = ["*"]

# Production environment
[[env.production.send_email]]
type = "send_email"
name = "SEND_EMAIL"
allowed_destination_addresses = ["*"]
```

### Environment Variables

```env
CONTACT_EMAIL=test@inkpup.ca
```

## Usage in Code

```typescript
// Get Cloudflare email binding from environment
const env = process.env as unknown as CloudflareEnv;

await env.SEND_EMAIL.send({
  to: [{ email: 'recipient@example.com' }],
  from: { email: 'noreply@inkpup.ca', name: 'InkPup Contact Form' },
  reply_to: 'user@example.com',
  subject: 'Email Subject',
  text: 'Plain text version',
  html: '<p>HTML version</p>',
});
```

## Local Development

To test email sending locally, use `wrangler dev` with the `--remote` flag:

```bash
npm run build
wrangler dev --remote
```

The `--remote` flag is required because email bindings only work in the Cloudflare Workers runtime environment.

## Limits

- **Free Tier**: 100,000 Workers requests per day
- **Message Size**: Maximum 25 MiB per email
- **CPU Allocation**: May encounter `EXCEEDED_CPU` errors on free tier with high volume
- **Destination Addresses**: Currently allows any email address (`["*"]`)

## Migration Notes

### From MailChannels (Deprecated August 31, 2024)

MailChannels discontinued their free email-sending service for Cloudflare Workers on August 31, 2024. This project has migrated to use Cloudflare's native Email Workers solution instead.

**Changes Made**:
1. Removed MailChannels API integration
2. Added `send_email` binding to `wrangler.toml`
3. Updated `/app/api/contact/route.ts` to use `env.SEND_EMAIL.send()`
4. Removed `RESEND_API_KEY` and MailChannels environment variables

## Troubleshooting

### Email Not Sending

1. **Check Email Routing**: Verify Email Routing is enabled in Cloudflare dashboard
2. **Verify Email Address**: Ensure `CONTACT_EMAIL` email is verified in Email Routing
3. **Check Logs**: View Cloudflare Workers logs for error messages
4. **CPU Limits**: Look for `EXCEEDED_CPU` errors - consider Workers Paid plan if frequent

### Local Development Issues

- **Binding Not Found**: Use `wrangler dev --remote` instead of `npm run dev`
- **Runtime Errors**: Email bindings only work in Cloudflare Workers environment, not in Node.js

## References

- [Cloudflare Email Routing Documentation](https://developers.cloudflare.com/email-routing/)
- [Email Workers Send Email](https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/)
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)
