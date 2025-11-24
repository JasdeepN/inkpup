
/**
 * Simple signal mechanism to coordinate View Transitions with Next.js navigation.
 * Allows the transition callback to wait until the new route is mounted.
 */

let resolveNavigation: (() => void) | null = null;

export function waitForNavigation(): Promise<void> {
  return new Promise((resolve) => {
    resolveNavigation = resolve;
  });
}

export function signalNavigationComplete(): void {
  if (resolveNavigation) {
    resolveNavigation();
    resolveNavigation = null;
  }
}
