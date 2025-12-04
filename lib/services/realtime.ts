/**
 * Cloudflare Service Binding: Realtime Worker
 * Provides access to the bound realtime Worker (WebSockets + DO)
 * Pattern: Check Cloudflare context symbol → getCloudflareContext() → fallbacks
 */

/** Minimal Fetcher-like type for service bindings */
export interface ServiceFetcher {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

function looksLikeServiceBinding(candidate: unknown): candidate is ServiceFetcher {
  return !!candidate && typeof (candidate as any).fetch === 'function';
}

/**
 * Resolve the REALTIME service binding from the Cloudflare Workers environment
 */
export function getRealtimeServiceBinding(): ServiceFetcher | undefined {
  try {
    // Cloudflare Workers may expose bindings on globalThis
    const globalBinding = (globalThis as Record<string, unknown>).REALTIME;
    if (looksLikeServiceBinding(globalBinding)) {
      return globalBinding as ServiceFetcher;
    }

    // Check Cloudflare context symbol (set by OpenNext dev helper)
    const symbolKey = Symbol.for('__cloudflare-context__');
    const symbolCtx = (globalThis as Record<symbol, unknown>)[symbolKey] as { env?: Record<string, unknown> } | undefined;
    if (symbolCtx?.env && looksLikeServiceBinding(symbolCtx.env.REALTIME)) {
      return symbolCtx.env.REALTIME as ServiceFetcher;
    }

    // Try getCloudflareContext() from @opennextjs/cloudflare
    try {
      const mod = require('@opennextjs/cloudflare');
      if (mod && typeof mod.getCloudflareContext === 'function') {
        const ctx = mod.getCloudflareContext();
        if (ctx?.env && looksLikeServiceBinding(ctx.env.REALTIME)) {
          return ctx.env.REALTIME as ServiceFetcher;
        }
      }
    } catch {
      // Module not available; ignore
    }
  } catch {
    // Ignore runtime errors
  }
  return undefined;
}

/**
 * Notify the realtime worker about an inquiry update.
 * Non-blocking: logs errors but does not throw.
 */
export async function notifyInquiryUpdate(message: {
  type: 'email_received' | 'email_sent' | 'status_changed';
  inquiryId: number | string;
  emailId?: number | string;
  newStatus?: string;
  timestamp?: string;
}): Promise<{ ok: boolean; delivered?: number; total?: number } | null> {
  const svc = getRealtimeServiceBinding();
  if (!svc) {
    // No binding available (local dev without Cloudflare)
    console.warn('[Realtime] Service binding REALTIME not available');
    return null;
  }

  const payload = {
    ...message,
    inquiryId: String(message.inquiryId),
    emailId: message.emailId != null ? String(message.emailId) : undefined,
    timestamp: message.timestamp || new Date().toISOString(),
  };

  try {
    const res = await svc.fetch(`http://realtime/notify/${payload.inquiryId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn('[Realtime] Notify failed:', res.status, await res.text());
      return { ok: false };
    }
    return (await res.json()) as { ok: boolean; delivered?: number; total?: number };
  } catch (err) {
    console.warn('[Realtime] Notify error:', err);
    return { ok: false };
  }
}
