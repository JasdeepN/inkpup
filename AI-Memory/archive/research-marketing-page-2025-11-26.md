# Research Brief: Marketing Page Feasibility

**Date:** 2025-11-26  
**Status:** Research Complete  
**Verdict:** Don't build a "Marketing Page" - build specific high-value features instead

---

## Problem Statement

User asked: Can we create a marketing page with real value? Features considered:
- Lead generation
- Sales alerts/banners
- Social media post suggestions
- One-click post to all social accounts
- Track mentions across the internet

**Constraint:** Must provide actual value, not just "rotating tooltips"

---

## Research Findings

### Feature Feasibility Analysis

| Feature | Feasible? | Cost | Effort | Value |
|---------|-----------|------|--------|-------|
| **Promotions/Banners** | ✅ Yes | Free | 1-2 days | HIGH |
| **Inquiry Inbox + Templates** | ✅ Yes | Free (Resend) | 2-3 days | VERY HIGH |
| Social Post Templates | ⚠️ Limited | Free | 0.5 day | MEDIUM |
| 1-Click Multi-Platform Post | ❌ No | $50-500/mo | Complex | N/A |
| Mention Tracking | ❌ No | $0-300/mo | Complex | N/A |
| AI Post Suggestions | ❌ No | API costs | Medium | LOW |

### Social Media Posting - Why NOT To Build

**Third-party API services exist:**
- Ayrshare: $49-499/month
- Late.dev: Paid tiers
- Upload-Post: Paid

**DIY approach problems:**
- Instagram requires Business Account + Facebook App Review
- Each platform has different OAuth, rate limits, terms
- Ongoing maintenance as APIs change
- Not worth it for a single-user portfolio site

**Recommendation:** Use free tools like Later.com, Buffer free tier, or native scheduling

### Mention Tracking - Why NOT To Build

**Free alternatives already exist:**
- Google Alerts (free, email-based)
- Talkwalker Alerts (free, better for social)
- Set up alerts for "inkpup", "toronto tattoo artist", your name

**Paid alternatives (if needed later):**
- Sprout Social, Meltwater, Brandwatch ($100-1000+/mo)

**Recommendation:** Just set up Google Alerts - takes 5 minutes, free

---

## What IS Worth Building

### 1. Promotions/Banner System ✅

**Purpose:** Enable flash sales, holiday promos, limited-time offers

**How it works:**
```
Admin creates promotion:
  - Title: "Flash Friday Sale"
  - Banner text: "🔥 20% off all flash designs this weekend!"
  - Start date: Nov 29, 2025
  - End date: Dec 1, 2025
  - Active: true

Public site displays:
  - Banner at top of homepage/flash page
  - Auto-hides after end date
```

**D1 Schema:**
```sql
CREATE TABLE promotions (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  banner_text TEXT NOT NULL,
  description TEXT,
  discount_percent INTEGER,
  start_date TEXT,
  end_date TEXT,
  active INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);
```

**Admin UI:** `/dashboard/promotions`
- List all promotions
- Create/edit promotion
- Toggle active
- Preview banner

**Frontend:** Banner component on public pages
- Query active promotions where now() between start_date and end_date
- Display styled banner
- Dismissible (localStorage)

**Effort:** 1-2 days
**Value:** HIGH - directly drives bookings

---

### 2. Inquiry Inbox + Email Templates ✅ (ENHANCED)

**Purpose:** 
- Track contact form submissions, never lose a lead
- Reply directly from admin with professional templates
- Send deposit requests, terms, aftercare instructions

**Current state:** Contact form → Resend email → gone

**Proposed state:** Contact form → D1 storage + email → viewable inbox → reply with templates

**D1 Schema:**
```sql
CREATE TABLE inquiries (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  inquiry_type TEXT, -- 'contact', 'flash', 'custom'
  design_id TEXT,    -- for flash bookings
  message TEXT,
  placement TEXT,
  budget TEXT,
  status TEXT DEFAULT 'unread', -- 'unread', 'read', 'replied', 'archived', 'booked'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  replied_at TEXT,
  notes TEXT         -- internal notes about this client
);

CREATE TABLE email_templates (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,  -- 'deposit_request', 'booking_confirmed', etc.
  name TEXT NOT NULL,         -- Display name: "Deposit Request"
  subject TEXT NOT NULL,
  body TEXT NOT NULL,         -- supports {{name}}, {{design}}, {{amount}}, {{date}} variables
  is_default INTEGER DEFAULT 0, -- system templates can't be deleted
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE TABLE inquiry_emails (
  id INTEGER PRIMARY KEY,
  inquiry_id INTEGER NOT NULL,
  template_id INTEGER,       -- NULL if custom message
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id),
  FOREIGN KEY (template_id) REFERENCES email_templates(id)
);
```

**Template Storage:** Database-driven (NOT hardcoded)

Templates are stored in D1's `email_templates` table and fully editable via admin UI. Default templates are seeded on first deploy but can be customized at any time.

**Admin UI: Template Editor** → `/dashboard/templates`
```
┌─────────────────────────────────────────────────────────────────────┐
│  📝 Email Templates                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  [+ New Template]                                                   │
├─────────────────────────────────────────────────────────────────────┤
│  📄 Deposit Request                              [Edit] [Preview]   │
│      Subject: Deposit Request for Your Tattoo Appointment           │
│      Variables: {{name}}, {{design}}, {{amount}}                    │
├─────────────────────────────────────────────────────────────────────┤
│  📄 Booking Confirmed                            [Edit] [Preview]   │
│      Subject: Your Tattoo Appointment is Confirmed!                 │
├─────────────────────────────────────────────────────────────────────┤
│  📄 Aftercare Instructions                       [Edit] [Preview]   │
│      Subject: Tattoo Aftercare Instructions                         │
├─────────────────────────────────────────────────────────────────────┤
│  📄 Terms & Policies                             [Edit] [Preview]   │
│      Subject: Booking Terms & Policies                              │
└─────────────────────────────────────────────────────────────────────┘
```

**Template Editor Form:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  Edit Template: Deposit Request                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Name (internal):  [deposit_request        ]                        │
│                                                                     │
│  Subject Line:     [Deposit Request for Your Tattoo - InkPup   ]   │
│                                                                     │
│  Body:                                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Hi {{name}},                                                 │   │
│  │                                                              │   │
│  │ Thanks for reaching out about {{design}}!                   │   │
│  │                                                              │   │
│  │ To secure your appointment, I require a ${{amount}} deposit │   │
│  │ ...                                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Available Variables:                                               │
│  {{name}} {{email}} {{design}} {{amount}} {{date}} {{time}}        │
│                                                                     │
│  [Preview with Sample Data]  [Cancel]  [💾 Save Template]          │
└─────────────────────────────────────────────────────────────────────┘
```

**Why Database-Stored:**
- ✅ Edit templates without code deployment
- ✅ Test different wording (A/B)
- ✅ Add new templates (e.g., "Holiday Hours", "Reschedule Request")
- ✅ Personalize for different inquiry types
- ✅ Rollback to previous versions (future: add `version` column)

**Seed Data:** Default templates inserted on first migration. User can edit/delete but system ensures at least one template exists.

---

**Default Templates (Seeded):**

1. **Deposit Request**
```
Subject: Deposit Request for Your Tattoo Appointment - InkPup

Hi {{name}},

Thanks for reaching out about {{design}}!

To secure your appointment, I require a ${{amount}} deposit. This deposit goes toward your final tattoo price and is non-refundable.

Payment options:
• E-transfer to: [email]
• PayPal: [link]

Once I receive your deposit, I'll confirm your appointment date.

Questions? Just reply to this email.

– InkPup
```

2. **Booking Confirmed**
```
Subject: Your Tattoo Appointment is Confirmed! - InkPup

Hi {{name}},

Your appointment is confirmed for {{date}} at {{time}}.

Design: {{design}}
Location: [studio address]

What to bring:
• Valid ID
• Snacks/drinks (sessions over 2 hours)
• Reference photos if applicable

Please arrive 10-15 minutes early.

See you soon!
– InkPup
```

3. **Aftercare Instructions**
```
Subject: Tattoo Aftercare Instructions - InkPup

Hi {{name}},

Congrats on your new tattoo! Here's how to keep it looking fresh:

FIRST 24 HOURS:
• Leave bandage on for 2-4 hours
• Wash gently with unscented soap
• Pat dry, don't rub

DAYS 1-14:
• Apply thin layer of unscented lotion 2-3x daily
• Don't scratch or pick at scabs
• Avoid swimming, hot tubs, direct sunlight

HEALING TIME:
• Surface healing: 2-3 weeks
• Full healing: 4-6 weeks

Questions? Reply to this email or DM me on Instagram.

– InkPup
```

4. **Terms & Policies**
```
Subject: Booking Terms & Policies - InkPup

Hi {{name}},

Before we proceed, please review my booking terms:

DEPOSITS:
• Required to secure your appointment
• Applied to final tattoo price
• Non-refundable within 48 hours of appointment

CANCELLATIONS:
• 48+ hours notice: deposit transfers to new date
• Less than 48 hours: deposit forfeited
• No-shows: deposit forfeited

TOUCH-UPS:
• Free within 3 months of original session
• Must be booked in advance

AGE REQUIREMENT:
• Must be 18+ with valid ID

Reply "I agree" to confirm you've read these terms.

– InkPup
```

**Admin UI:** `/dashboard/inquiries`
```
┌─────────────────────────────────────────────────────────────────────┐
│  📬 Inquiries                                    [Unread: 3]        │
├─────────────────────────────────────────────────────────────────────┤
│  Filter: [All ▼] [Unread] [Replied] [Booked] [Archived]            │
├─────────────────────────────────────────────────────────────────────┤
│  ● John Doe • john@email.com                          2 hours ago  │
│    Flash booking - Design #wolf-01                                  │
│    "I'd like to book the wolf design for my forearm..."            │
│    [Reply ▼] [Mark Read] [Archive]                                 │
│        └─ [Custom Message]                                          │
│           [📄 Deposit Request]                                      │
│           [📄 Terms & Policies]                                     │
│           [📄 Booking Confirmed]                                    │
│           [📄 Aftercare]                                            │
├─────────────────────────────────────────────────────────────────────┤
│  ○ Jane Smith • jane@email.com                        1 day ago    │
│    Custom consultation                                              │
│    Status: Replied                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Reply Flow:**
1. Click "Reply" dropdown on inquiry
2. Select template (or custom message)
3. Template loads with variables pre-filled from inquiry
4. Edit if needed, click Send
5. Email sent via Resend API
6. Copy saved to `inquiry_emails` table
7. Inquiry status updated to "replied"

**Conversation History:**
- Click on inquiry to expand
- See all sent emails with timestamps
- Add internal notes (not visible to client)

**Effort:** 2-3 days (more complex with templates)
**Value:** VERY HIGH - professional communication, never lose context

---

### 3. Social Post Templates (Optional) ⚠️

**Purpose:** Generate copy-paste text after gallery uploads

**How it works:**
- After upload, show modal: "Share this on social media"
- Pre-filled templates with image title, hashtags, link
- Copy button for each platform

**Example templates:**
```
Instagram:
🔥 New flash available!
"{design_title}"
Book this design: inkpup.com/flash
.
#torontotattoo #flashtattoo #tattooartist #inkpup

Twitter/X:
New flash just dropped! "{design_title}" 🎨
Book: inkpup.com/flash
#torontotattoo
```

**Effort:** 0.5 day
**Value:** MEDIUM - saves typing but not critical

---

## Recommendation

### Don't Build
- ❌ Generic "Marketing Page" with tips
- ❌ Social media auto-posting (use Buffer/Later free tier)
- ❌ Mention tracking (use Google Alerts)
- ❌ AI post suggestions (no value without auto-posting)

### Do Build (in order of priority)
1. **Inquiry Inbox + Email Templates** - `/dashboard/inquiries` + contact form update + template system
2. **Promotions system** - `/dashboard/promotions` + frontend banner

### Use External Tools (Free)
- [Google Alerts](https://www.google.com/alerts) - Monitor "inkpup" mentions
- [Talkwalker Alerts](https://www.talkwalker.com/alerts) - Social monitoring
- [Buffer](https://buffer.com) or [Later](https://later.com) - Post scheduling (free tier)
- Instagram native Insights - Analytics

---

## Implementation Approach

### Phase 1: Inquiry Inbox + Email Templates (Priority)
1. D1 migrations for `inquiries`, `email_templates`, `inquiry_emails` tables
2. Seed default templates (Deposit, Booking Confirmed, Aftercare, Terms)
3. Update contact form API to store in D1 + send email
4. Admin inbox at `/dashboard/inquiries`
   - List/filter inquiries
   - Reply with template selection
   - Send via Resend API
   - Track sent emails per inquiry
5. **Admin template editor at `/dashboard/templates`**
   - List all templates
   - Edit subject/body with live preview
   - Create custom templates
   - Variable reference guide
6. Badge on nav for unread count

### Phase 2: Promotions (Later)
1. D1 migration for `promotions` table
2. Admin CRUD at `/dashboard/promotions`
3. Frontend `PromoBanner` component
4. Display on homepage/flash page

---

## Success Criteria

**Inquiry Inbox + Templates:**
- [ ] Contact submissions stored in D1
- [ ] Admin can view all inquiries with filters
- [ ] Unread count badge visible on dashboard/nav
- [ ] Can reply with pre-built templates (Deposit, Terms, Aftercare, Booking Confirmed)
- [ ] Templates support variables ({{name}}, {{design}}, {{amount}}, {{date}})
- [ ] **Templates editable via admin UI (not hardcoded)**
- [ ] **Can create new custom templates**
- [ ] Sent emails tracked per inquiry (conversation history)
- [ ] Can add internal notes to inquiries
- [ ] Status workflow: unread → read → replied → booked/archived

**Promotions:**
- [ ] Can create/edit/delete promotions
- [ ] Can set date ranges for auto-activation
- [ ] Banner displays on public site when active
- [ ] Banner auto-hides after end date

---

## Final Answer

**Is a "Marketing Page" worth building?** 

**No** - a generic marketing page with tips/suggestions is not valuable.

**But** specific features ARE worth building:
- **Inquiry Inbox + Email Templates** = YES, high value (track leads, professional replies, deposit/aftercare emails)
- **Promotions/Banners** = Yes, enables real business actions (sales)
- **Social/Mention stuff** = No, use free external tools

---

## Technical Notes

### Resend API Integration
- Already configured with `RESEND_API_KEY`
- Free tier: 3,000 emails/month, 100 emails/day
- Sufficient for small tattoo studio
- Templates can use React Email or plain HTML

### Email Reply Threading
- Set `In-Reply-To` header to original inquiry email
- Use same `Message-ID` for threading in Gmail/Outlook
- Store `message_id` in `inquiry_emails` table

### Variable Substitution
```typescript
function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}
```

---

*Research completed: 2025-11-26*
*Updated: Added full email template system per user request*
