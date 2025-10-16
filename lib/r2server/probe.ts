type ProbeSource = 'none' | 'env' | 'context';

export type ProbeResult = { binding?: unknown; source: ProbeSource; contextSymbolPresent: boolean };

function createDefaultResult(): ProbeResult {
  return { binding: undefined, source: 'none', contextSymbolPresent: false };
}

function looksLikeBinding(candidate: unknown): boolean {
  if (!candidate) return false;
  if (typeof candidate !== 'object') return false;
  const binding = candidate as Record<string, unknown>;
  return (
    typeof binding.list === 'function' ||
    typeof binding.get === 'function' ||
    typeof binding.put === 'function' ||
    typeof binding.delete === 'function'
  );
}

export async function probeR2Binding(): Promise<ProbeResult> {
  const result = createDefaultResult();
  try {
    const globalBucket = (globalThis as any).R2_BUCKET;
    if (looksLikeBinding(globalBucket)) {
      result.binding = globalBucket;
      result.source = 'env';
      return result;
    }

    const symbolKey = Symbol.for('__cloudflare-context__');
    const symbolBinding = (globalThis as any)[symbolKey];
    if (symbolBinding && symbolBinding.env && looksLikeBinding(symbolBinding.env.R2_BUCKET)) {
      result.binding = symbolBinding.env.R2_BUCKET;
      result.source = 'context';
      result.contextSymbolPresent = true;
      return result;
    }

    const legacyRequest = (globalThis as any).__R2_WORKER_REQUEST__;
    if (legacyRequest?.cf?.env && looksLikeBinding(legacyRequest.cf.env.R2_BUCKET)) {
      result.binding = legacyRequest.cf.env.R2_BUCKET;
      result.source = 'context';
      result.contextSymbolPresent = false;
      return result;
    }

    if (process.env.R2_BUCKET) {
      result.binding = process.env.R2_BUCKET;
      result.source = 'env';
      return result;
    }

    try {
      const mod = await import('@opennextjs/cloudflare');
      if (mod && typeof (mod as any).getCloudflareContext === 'function') {
        const ctx = (mod as any).getCloudflareContext();
        const binding = ctx?.env?.R2_BUCKET;
        if (looksLikeBinding(binding)) {
          result.binding = binding;
          result.source = 'context';
          result.contextSymbolPresent = false;
          return result;
        }
      }
    } catch (e) {
      // ignore missing helper module
    }
  } catch (err) {
    // ignore runtime errors and fall back to default result
  }
  return result;
}

export function probeR2BindingSync(): ProbeResult {
  const result = createDefaultResult();
  try {
    const globalBucket = (globalThis as any).R2_BUCKET;
    if (looksLikeBinding(globalBucket)) {
      result.binding = globalBucket;
      result.source = 'env';
      return result;
    }

    const symbolKey = Symbol.for('__cloudflare-context__');
    const symbolBinding = (globalThis as any)[symbolKey];
    if (symbolBinding && symbolBinding.env && looksLikeBinding(symbolBinding.env.R2_BUCKET)) {
      result.binding = symbolBinding.env.R2_BUCKET;
      result.source = 'context';
      result.contextSymbolPresent = true;
      return result;
    }

    const legacyRequest = (globalThis as any).__R2_WORKER_REQUEST__;
    if (legacyRequest?.cf?.env && looksLikeBinding(legacyRequest.cf.env.R2_BUCKET)) {
      result.binding = legacyRequest.cf.env.R2_BUCKET;
      result.source = 'context';
      result.contextSymbolPresent = false;
      return result;
    }

    if (process.env.R2_BUCKET) {
      result.binding = process.env.R2_BUCKET;
      result.source = 'env';
      return result;
    }
  } catch (err) {
    // ignore and fall back to default result
  }
  return result;
}

export async function getR2Binding(): Promise<unknown> {
  const probe = await probeR2Binding();
  if (probe.binding === undefined || probe.binding === null) {
    throw new Error('R2_BUCKET binding is not available');
  }
  return probe.binding;
}
