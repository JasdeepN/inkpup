/**
 * @jest-environment jsdom
 */
import {
  supportsViewTransitions,
  startViewTransition,
  generateTransitionName,
  setTransitionName,
  __resetViewTransitionsSupportCache,
} from './viewTransitions';

describe('viewTransitions', () => {
  beforeEach(() => {
    __resetViewTransitionsSupportCache();
    // Clean any existing mock
    // @ts-ignore
    delete document.startViewTransition;
  });

  describe('supportsViewTransitions', () => {
    it('returns false when document is undefined (SSR)', () => {
      const originalDocument = global.document;
      // @ts-ignore
      delete global.document;
      
      expect(supportsViewTransitions()).toBe(false);
      
      global.document = originalDocument;
    });

    it('returns false when startViewTransition is not available', () => {
      const originalStartViewTransition = document.startViewTransition;
      // @ts-ignore
      delete document.startViewTransition;
      
      // @ts-ignore - reset cache
      global.viewTransitionsSupported = undefined;
      expect(supportsViewTransitions()).toBe(false);
      
      document.startViewTransition = originalStartViewTransition;
    });

    it('returns true when startViewTransition is available', () => {
      // @ts-ignore
      document.startViewTransition = () => ({
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
      });
      __resetViewTransitionsSupportCache();
      expect(supportsViewTransitions()).toBe(true);
    });

    it('caches the result', () => {
      // @ts-ignore
      document.startViewTransition = () => ({
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
      });
      __resetViewTransitionsSupportCache();
      const first = supportsViewTransitions();
      const second = supportsViewTransitions();
      expect(first).toBe(second);
      expect(first).toBe(true);
    });
  });

  describe('startViewTransition', () => {
    it('executes callback immediately when not supported', async () => {
      const originalStartViewTransition = document.startViewTransition;
      // @ts-ignore
      delete document.startViewTransition;
      
      const callback = jest.fn();
      await startViewTransition(callback);
      
      expect(callback).toHaveBeenCalledTimes(1);
      
      document.startViewTransition = originalStartViewTransition;
    });

    it('uses native API when supported', async () => {
      const mock = jest.fn((cb: () => Promise<void> | void) => {
        const result = cb();
        return {
          finished: Promise.resolve(result),
          ready: Promise.resolve(),
          updateCallbackDone: Promise.resolve(),
        };
      });
      // @ts-ignore
      document.startViewTransition = mock;
      __resetViewTransitionsSupportCache();
      const callback = jest.fn();
      await startViewTransition(callback);
      expect(mock).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('skips transition when skipTransition is true', async () => {
      const mockTransition = {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
      };
      
      document.startViewTransition = jest.fn(() => mockTransition);
      
      const callback = jest.fn();
      await startViewTransition(callback, { skipTransition: true });
      
      expect(document.startViewTransition).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledTimes(1);
      
      // @ts-ignore
      delete document.startViewTransition;
    });

    it('handles async callbacks', async () => {
      const mock = jest.fn((cb: () => Promise<void> | void) => {
        const result = cb();
        return {
          finished: Promise.resolve(result),
          ready: Promise.resolve(),
          updateCallbackDone: Promise.resolve(),
        };
      });
      // @ts-ignore
      document.startViewTransition = mock;
      __resetViewTransitionsSupportCache();
      const callback = jest.fn(async () => {
        await Promise.resolve();
      });
      await startViewTransition(callback);
      expect(mock).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateTransitionName', () => {
    it('generates name with id', () => {
      expect(generateTransitionName('gallery-img', 123)).toBe('gallery-img-123');
      expect(generateTransitionName('modal', 'hero')).toBe('modal-hero');
    });

    it('generates name without id', () => {
      expect(generateTransitionName('page-content')).toBe('page-content');
    });

    it('handles zero as id', () => {
      expect(generateTransitionName('item', 0)).toBe('item-0');
    });
  });

  describe('setTransitionName', () => {
    it('sets view-transition-name on element', () => {
      const element = document.createElement('div');
      const cleanup = setTransitionName(element, 'test-name');
      
      // @ts-ignore
      expect(element.style.viewTransitionName).toBe('test-name');
      
      cleanup();
    });

    it('returns cleanup function that removes name', () => {
      const element = document.createElement('div');
      const cleanup = setTransitionName(element, 'test-name');
      
      // @ts-ignore
      expect(element.style.viewTransitionName).toBe('test-name');
      
      cleanup();
      // @ts-ignore
      expect(element.style.viewTransitionName).toBe('');
    });

    it('handles null element gracefully', () => {
      const cleanup = setTransitionName(null, 'test-name');
      
      // Should not throw
      expect(() => cleanup()).not.toThrow();
    });
  });
});
