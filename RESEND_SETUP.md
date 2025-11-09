# Resend Email Service Setup

This project uses [Resend](https://resend.com) for transactional email delivery from the contact form.

## Why Resend?

- **Free tier**: 3,000 emails/month, 100 emails/day
- **Simple API**: One SDK, clean integration
- **Reliable**: Modern email infrastructure
- **No lock-in**: Works with any platform (not just Cloudflare)

## Setup Instructions

### 1. Create Resend Account

1. Go to https://resend.com and sign up
2. Verify your email address
3. Complete account setup

### 2. Verify Domain

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter `mail.inkpup.ca` (or your sending subdomain)
4. Add the DNS records provided by Resend to your Cloudflare DNS:
   - SPF record (TXT)
   - DKIM record (TXT)
   - DMARC record (TXT)
5. Wait for verification (usually 1-5 minutes)

### 3. Generate API Key

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it (e.g., "InkPup Production")
4. Copy the key starting with `re_`
5. **Store it securely** - you won't see it again

### 4. Configure Environment Variables

#### Local Development

Add to `.env`:
```bash
RESEND_API_KEY=re_your_api_key_here
CONTACT_EMAIL=test@inkpup.ca
```

#### Production (GitHub Actions)

1. Go to repository **Settings**
2. Navigate to **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `RESEND_API_KEY`
5. Value: Your Resend API key
6. Click **Add secret**

#### wrangler.toml

Already configured - the `RESEND_API_KEY` environment variable is automatically injected:

```toml
[env.dev.vars]
RESEND_API_KEY = "${RESEND_API_KEY}"

[env.production.vars]
RESEND_API_KEY = "${RESEND_API_KEY}"
```

## Usage

The contact form API route (`/app/api/contact/route.ts`) automatically uses Resend:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'InkPup Contact Form <noreply@mail.inkpup.ca>',
  to: [contactEmail],
  replyTo: email,
  subject: `New Contact Form Submission from ${name}`,
  // ...
});
```

## Free Tier Limits

| Limit | Value |
|-------|-------|
| **Monthly emails** | 3,000 |
| **Daily emails** | 100 |
| **Rate limit** | 2 requests/second |
| **Domains** | 1 verified domain |
| **Spam rate** | Must stay under 0.08% |
| **Bounce rate** | Must stay under 4% |

### For This Project

Expected usage: **~10-30 emails/month** (contact form submissions)

This is **well within** the free tier limits. You won't need to upgrade unless the business drastically scales.

## Monitoring

### Check Email Status

1. Log in to [Resend dashboard](https://resend.com/emails)
2. View sent emails, delivery status, opens (if tracking enabled)
3. Monitor bounce and spam rates

### Quota Usage

1. Go to **Settings** → **Usage**
2. View current month's usage
3. Set up alerts if approaching limits

## Troubleshooting

### Emails Not Sending

1. **Check API key**: Verify `RESEND_API_KEY` is set correctly
2. **Check domain**: Ensure `mail.inkpup.ca` is verified in Resend
3. **Check logs**: Look at Cloudflare Workers logs or local console
4. **Check spam folder**: Emails may be filtered initially

### Common Errors

**Error: `"API key is invalid"`**
- API key not set or incorrect
- Check GitHub Secrets and `.env` file

**Error: `"Domain not verified"`**
- Add Resend's DNS records to Cloudflare
- Wait for DNS propagation (usually 1-5 min)

**Error: `"Rate limit exceeded"`**
- Too many requests (>2/second)
- Implement retry logic with exponential backoff

## Security

- ✅ API key stored in GitHub Secrets (production)
- ✅ API key in `.env` file (excluded from git)
- ✅ Never commit API keys to repository
- ✅ `.env` file listed in `.gitignore`

## Cost Considerations

**Current plan**: Free (sufficient for contact form)

**If you exceed free tier**:
- Pro plan: $20/month for 50,000 emails
- Scale plan: $40/month for 100,000 emails

For a small business contact form, free tier should last indefinitely.

## Migration from Cloudflare Email Workers

This implementation replaced Cloudflare's `send_email` binding (which requires a paid Workers subscription). Resend provides the same functionality for free.

**Changes made**:
- ✅ Removed `[[env.dev.send_email]]` from `wrangler.toml`
- ✅ Removed `[[env.production.send_email]]` from `wrangler.toml`
- ✅ Installed `resend` npm package
- ✅ Updated `/app/api/contact/route.ts` to use Resend SDK
- ✅ Added `RESEND_API_KEY` to environment variables

## Support

- **Resend Docs**: https://resend.com/docs
- **Resend Support**: support@resend.com
- **Status Page**: https://resend.com/status
