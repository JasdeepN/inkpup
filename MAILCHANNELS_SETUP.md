# MailChannels Setup for inkpup.ca

## Current Status
⚠️ **MailChannels is configured in code but requires DNS verification to work**

The contact form shows "success" but emails aren't actually being delivered because MailChannels requires DNS records to be set up first.

## Required DNS Records

Add these DNS records to your `inkpup.ca` domain (in Cloudflare DNS):

### 1. SPF Record (Anti-spam verification)
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.mx.cloudflare.net ~all
TTL: Auto
```

### 2. Domain Lockdown (Required for free tier)
```
Type: TXT  
Name: _mailchannels
Value: v=mc1 cfid=3fa0a5663d51ae5473029f71cc97fa7d
TTL: Auto
```

### 3. DKIM Record (Email authentication)
```
Type: TXT
Name: mailchannels._domainkey
Value: v=DKIM1; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDPGdKfKFAqpPdlBpjRcPcULqIUuRNZVkOu+0A6MF3KvjQS8sLqnAm5qrHmGnZBNsS8vGR8NVyPKCPqHDXCjCL0chQ8jPfvL4HN2IvPFjkp6VCkPL4kUPcLZmNz5VhX0Y5bYtBPkHt7iQw9F/hMvkwKBgGQdXkJ1U9EhVLHQIDAQAB
TTL: Auto
```
*(Note: Use the actual DKIM public key provided by MailChannels)*

### 4. DMARC Policy (Optional but recommended)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@inkpup.ca
TTL: Auto
```

## How to Add DNS Records

1. Log in to Cloudflare Dashboard
2. Select the `inkpup.ca` domain
3. Go to **DNS** → **Records**
4. Click **Add record**
5. Add each record above

## Verification

After adding the DNS records, you can verify them:

```bash
# Check SPF
dig TXT inkpup.ca | grep spf

# Check Domain Lockdown
dig TXT _mailchannels.inkpup.ca

# Check DKIM
dig TXT mailchannels._domainkey.inkpup.ca
```

## Testing After Setup

1. Wait 5-10 minutes for DNS propagation
2. Submit a test form at https://dev.inkpup.ca/contact
3. Check Cloudflare Workers logs:
   ```bash
   npx wrangler tail --env dev
   ```
4. Look for "✅ Email sent successfully via MailChannels" in logs
5. Check your inbox at jasdeepn4@hotmail.com (configured for test@inkpup.ca)

## Alternative: Use Cloudflare Email Workers

If MailChannels doesn't work, you can use Cloudflare Email Workers instead:
- More reliable
- Better integrated with Cloudflare
- Free tier available
- Documentation: https://developers.cloudflare.com/email-routing/

## Current Configuration

- **From:** noreply@inkpup.ca
- **To:** test@inkpup.ca (routes to jasdeepn4@hotmail.com)
- **Reply-To:** User's submitted email address
- **DKIM Domain:** inkpup.ca
- **DKIM Selector:** mailchannels

## Troubleshooting

If emails still don't send after DNS setup:

1. Check Cloudflare Workers logs for detailed error messages
2. Verify DNS records propagated: https://dnschecker.org/
3. Test MailChannels API directly:
   ```bash
   curl -X POST https://api.mailchannels.net/tx/v1/send \
     -H "Content-Type: application/json" \
     -d '{
       "personalizations": [{
         "to": [{"email": "test@example.com"}],
         "dkim_domain": "inkpup.ca",
         "dkim_selector": "mailchannels"
       }],
       "from": {"email": "noreply@inkpup.ca"},
       "subject": "Test",
       "content": [{"type": "text/plain", "value": "Test"}]
     }'
   ```
4. Check MailChannels status: https://status.mailchannels.net/
