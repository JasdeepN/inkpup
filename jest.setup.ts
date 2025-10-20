import '@testing-library/jest-dom';
import React from 'react';
import { act as domAct } from 'react-dom/test-utils';

type ReactModule = typeof import('react');

const reactNamespace = React as ReactModule & { default?: ReactModule };

if (process.env.JEST_WORKER_ID !== undefined) {
  const actImpl = typeof reactNamespace.act === 'function' ? reactNamespace.act : domAct;

  if (typeof reactNamespace.act !== 'function') {
    Object.defineProperty(reactNamespace, 'act', {
      value: actImpl,
      configurable: true,
      writable: true,
    });
  }

  if (reactNamespace.default && typeof reactNamespace.default.act !== 'function') {
    Object.defineProperty(reactNamespace.default, 'act', {
      value: actImpl,
      configurable: true,
      writable: true,
    });
  }

  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
}

jest.mock('next/image', () => {
  const ImageMock = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement> & {
    priority?: boolean;
    fill?: boolean;
    onLoadingComplete?: (img: HTMLImageElement) => void;
  }>(({ priority: _priority, fill: _fill, onLoadingComplete, onLoad, style, ...rest }, ref) => {
    const composedStyle = style ? { ...style } : undefined;

    return React.createElement('img', {
      ...rest,
      ref,
      style: composedStyle,
      onLoad: (event) => {
        onLoad?.(event);
        onLoadingComplete?.(event.currentTarget as HTMLImageElement);
      },
    });
  });

  ImageMock.displayName = 'NextImageMock';

  return {
    __esModule: true,
    default: ImageMock,
  };
});
