// Re-export the public API from the modularized implementation.
export * from './r2server/storage';
export * from './r2server/credentials';
export * from './r2server/utils';
export * from './r2server/probe';
export * from './r2server/sniff';
export * from './r2server/queue';

import * as credentialsModule from './r2server/credentials';
import { listGalleryImages as asyncListGalleryImages, getCredentialStatus as storageGetCredentialStatus } from './r2server/storage';

type ResettableCredentialsNamespace = typeof credentialsModule & { _resetSingletons?: () => void };
const credentialsNamespace = credentialsModule as ResettableCredentialsNamespace;

const trackedLegacyProps = ['verifyAccessKeyPromise', 'clientPromise'] as const;
type TrackedLegacyProp = (typeof trackedLegacyProps)[number];
const legacyOverrides = new Map<TrackedLegacyProp, unknown>();

const readLegacyValue = (prop: TrackedLegacyProp) => {
  if (legacyOverrides.has(prop)) {
    return legacyOverrides.get(prop);
  }
  return (credentialsNamespace as Record<string, unknown>)[prop];
};

const applyLegacyOverride = (prop: TrackedLegacyProp, value: unknown) => {
  if (value === undefined) {
    legacyOverrides.delete(prop);
  } else {
    legacyOverrides.set(prop, value);
  }

  try {
    (credentialsNamespace as Record<string, unknown>)[prop] = value as unknown;
  } catch {
    // Ignore assignment failures when targeting read-only ESM namespaces.
  }

  const reset = credentialsNamespace._resetSingletons;
  if (typeof reset === 'function') {
    try {
      reset();
    } catch {
      // Swallow reset errors to maintain legacy resilience.
    }
  }
};

const installLegacyDescriptor = (exportsObject: Record<string, unknown>, prop: TrackedLegacyProp) => {
  try {
    const existing = Object.getOwnPropertyDescriptor(exportsObject, prop);
    if (existing && existing.configurable === false && typeof existing.set === 'function') {
      return true;
    }

    const enumerable = existing ? existing.enumerable ?? true : true;

    Object.defineProperty(exportsObject, prop, {
      configurable: true,
      enumerable,
      get() {
        return readLegacyValue(prop);
      },
      set(value) {
        applyLegacyOverride(prop, value);
      },
    });

    return true;
  } catch {
    return false;
  }
};

type LegacyModuleContainer = { exports?: Record<string, unknown> };

const resolveLegacyModuleContainer = (): LegacyModuleContainer | null => {
  if (typeof module !== 'undefined' && module && typeof module === 'object') {
    return module as LegacyModuleContainer;
  }

  const maybeGlobal = (globalThis as { module?: LegacyModuleContainer }).module;
  if (maybeGlobal && typeof maybeGlobal === 'object') {
    return maybeGlobal;
  }

  return null;
};

const resolveLegacyExportsObject = (): Record<string, unknown> | null => {
  const container = resolveLegacyModuleContainer();
  const exportsObject = container?.exports;
  if (exportsObject && typeof exportsObject === 'object') {
    return exportsObject;
  }

  return null;
};

const LEGACY_WRAPPED_SYMBOL = Symbol.for('r2-server:legacy-wrapped');

type WrappedLegacyExports = Record<PropertyKey, unknown>;

const defineLegacyProperty = (target: Record<string, unknown>, prop: TrackedLegacyProp, enumerable: boolean) => {
  Object.defineProperty(target, prop, {
    configurable: true,
    enumerable,
    get() {
      return readLegacyValue(prop);
    },
    set(value) {
      applyLegacyOverride(prop, value);
    },
  });
};

function ensureLegacyCompatibility(exportsObject: Record<string, unknown>) {
  const container = resolveLegacyModuleContainer();
  if (!container || !container.exports) {
    return exportsObject;
  }

  const current = container.exports as WrappedLegacyExports;
  if (current[LEGACY_WRAPPED_SYMBOL]) {
    return current;
  }

  const descriptors = Object.getOwnPropertyDescriptors(current);
  const replacement: WrappedLegacyExports = {};
  const trackedEnumerability = new Map<TrackedLegacyProp, boolean>();

  trackedLegacyProps.forEach((prop) => {
    const baseDescriptor = descriptors[prop];
    trackedEnumerability.set(prop, baseDescriptor?.enumerable ?? true);
    delete descriptors[prop];
  });

  Object.defineProperties(replacement, descriptors);

  trackedLegacyProps.forEach((prop) => {
    defineLegacyProperty(replacement, prop, trackedEnumerability.get(prop) ?? true);
  });

  Object.defineProperty(replacement, LEGACY_WRAPPED_SYMBOL, {
    value: true,
    enumerable: false,
    configurable: false,
  });

  Object.setPrototypeOf(replacement, Object.getPrototypeOf(current));

  container.exports = replacement;
  return replacement;
}

const tryInstallLegacyDescriptors = () => {
  let exportsObject = resolveLegacyExportsObject();
  if (!exportsObject) return;

  let needsCompatibilityWrap = false;
  trackedLegacyProps.forEach((prop) => {
    const success = installLegacyDescriptor(exportsObject as Record<string, unknown>, prop);
    if (!success) {
      needsCompatibilityWrap = true;
    }
  });

  if (needsCompatibilityWrap) {
    exportsObject = ensureLegacyCompatibility(exportsObject);
    trackedLegacyProps.forEach((prop) => {
      installLegacyDescriptor(exportsObject as Record<string, unknown>, prop);
    });
  }
};

try {
  tryInstallLegacyDescriptors();
} catch {
  // ignore descriptor installation failures to preserve compatibility in exotic runtimes
}

type AsyncListGalleryImagesResult = Awaited<ReturnType<typeof asyncListGalleryImages>>;
type LegacyListGalleryImagesParams = Parameters<typeof asyncListGalleryImages>;
type LegacyListGalleryImagesResult = AsyncListGalleryImagesResult & {
  asPromise(): Promise<AsyncListGalleryImagesResult>;
  then: Promise<AsyncListGalleryImagesResult>['then'];
  catch: Promise<AsyncListGalleryImagesResult>['catch'];
  finally: Promise<AsyncListGalleryImagesResult>['finally'];
  [Symbol.asyncIterator](): AsyncGenerator<AsyncListGalleryImagesResult['items'][number], void, unknown>;
};

// Provide the legacy API shape for listGalleryImages: synchronous immediate result
// object with `.asPromise()`/`then()` compatibility while delegating the real work
// to the modular async function.
export const listGalleryImages = (
  category: LegacyListGalleryImagesParams[0],
  options?: LegacyListGalleryImagesParams[1],
): LegacyListGalleryImagesResult => {
  let initialCredentialStatus: AsyncListGalleryImagesResult['credentialStatus'];
  if (typeof storageGetCredentialStatus === 'function') {
    try {
      initialCredentialStatus = storageGetCredentialStatus();
    } catch {
      initialCredentialStatus = undefined;
    }
  } else {
    initialCredentialStatus = undefined;
  }

  const result = {
    items: [] as AsyncListGalleryImagesResult['items'],
    isFallback: false,
    usedBundledFallback: false,
    credentialStatus: initialCredentialStatus,
    fallbackReason: undefined as AsyncListGalleryImagesResult['fallbackReason'],
  } as LegacyListGalleryImagesResult;

  const backgroundPromise: Promise<AsyncListGalleryImagesResult> = (async () => {
    try {
      const res = await asyncListGalleryImages(category, options);
      result.items = res.items;
      result.isFallback = res.isFallback;
      result.fallbackReason = res.fallbackReason;
      result.usedBundledFallback = res.usedBundledFallback;
      result.credentialStatus = res.credentialStatus ?? initialCredentialStatus;
      return res;
    } catch (err) {
      console.error('listGalleryImages background error', err);
      const fallback: AsyncListGalleryImagesResult = {
        items: [] as AsyncListGalleryImagesResult['items'],
        isFallback: true,
        usedBundledFallback: false,
        fallbackReason: 'r2_fetch_failed',
        credentialStatus: initialCredentialStatus,
      };
      result.items = fallback.items;
      result.isFallback = fallback.isFallback;
      result.fallbackReason = fallback.fallbackReason;
      result.usedBundledFallback = fallback.usedBundledFallback;
      result.credentialStatus = fallback.credentialStatus;
      return fallback;
    }
  })();

  Object.defineProperties(result, {
    asPromise: {
      value: () => backgroundPromise,
      enumerable: false,
      configurable: true,
    },
    then: {
      value: backgroundPromise.then.bind(backgroundPromise) as LegacyListGalleryImagesResult['then'],
      enumerable: false,
      configurable: true,
    },
    catch: {
      value: backgroundPromise.catch.bind(backgroundPromise) as LegacyListGalleryImagesResult['catch'],
      enumerable: false,
      configurable: true,
    },
    finally: {
      value: backgroundPromise.finally.bind(backgroundPromise) as LegacyListGalleryImagesResult['finally'],
      enumerable: false,
      configurable: true,
    },
  });

  Object.defineProperty(result, Symbol.asyncIterator, {
    enumerable: false,
    configurable: true,
    value: async function* (): AsyncGenerator<
      AsyncListGalleryImagesResult['items'][number],
      void,
      unknown
    > {
      const final = await backgroundPromise;
      for (const item of final.items) {
        yield item;
      }
    },
  });

  if (process.env.DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.debug('[r2-server] listGalleryImages returning result keys:', Object.keys(result));
  }

  return result;
};
