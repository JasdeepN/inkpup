---
applyTo: "**"
---
# InkPup Tattoos — AI Coding Agent Instructions

## Workflow Dispatch

**Use prompt files when provided:** `.github/prompts/` defines structured workflows.
- `Think.prompt.md` → Research & analysis before planning
- `Plan.prompt.md` → Break tasks into #todos
- `Execute.prompt.md` → Implement with memory updates (build must pass)
- `Startup.prompt.md` → Session initialization
- `Checkpoint.prompt.md` → End-of-session memory sync

**Agent:** `memory-deep-think.agent.md` handles autonomous memory + deep reasoning.

**Fallback (no prompts):** Gather context → Plan todos → Execute incrementally → Update memory

---

## Architecture

**Stack:** Next.js 15 (App Router) + Cloudflare Workers (`@opennextjs/cloudflare`)  
**Data:** D1 (pricing/gallery metadata) → KV (cache) → R2 (images, source of truth)  
**Validation:** Zod v4+ in `lib/schemas/`

**Data Flow:** `R2 → D1 (non-blocking sync) → KV (read cache) → UI`

---

## Commands

```bash
npm run dev                    # Local dev with Cloudflare bindings
npm test                       # Jest (--forceExit configured)
npm run test:e2e               # Playwright
npm run opennext:build         # Build for Workers
wrangler d1 migrations apply inkpup-db-dev --local --env dev  # Local D1
```

**Critical:** Tests require `--forceExit` or they hang indefinitely.

**Local dev/unit testing:** Run on port `3002` via reverse proxy exposes the app at `devapp.lan` so you can also test `admin.devapp.lan`. Production runs on port `3000`.

---

## Key Patterns

**Server Actions** (`lib/admin-actions*.ts`):
```typescript
'use server';
export async function action(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) return { error: 'Database not available' };
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  // ... work, then revalidatePath()
}
```

**Bindings** (`lib/db/d1.ts`, `lib/r2server/probe.ts`): Check `Symbol.for('__cloudflare-context__')` → `getCloudflareContext()` → env fallbacks.

**R2 Access:** `listGalleryImages(category).asPromise()` — bindings first, S3 fallback.

---

## File Map

| Path | Purpose |
|------|---------|
| `lib/db/d1.ts` | D1 queries |
| `lib/cache/kv.ts` | KV cache + dev shim |
| `lib/r2server/` | R2 storage modules |
| `lib/schemas/` | Zod schemas |
| `lib/admin-actions*.ts` | Server actions |
| `scripts/db/migrations/` | D1 migrations |
| `memory-bank/` | Agent memory (append-only) |

---

## Don't

- Run tests without `--forceExit`
- Fail R2 ops on D1 errors (non-blocking)
- Use shims when bindings work
- Commit `.env` or secrets
- Modify `.github/prompts/`, `.github/agents/`, `.github/instructions/`

---

*Detailed setup: `docs/local-cloudflare-dev.md` | Patterns: `memory-bank/systemPatterns.md`*
