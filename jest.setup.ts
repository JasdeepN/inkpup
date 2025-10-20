process.env.NODE_ENV = process.env.NODE_ENV === 'production' ? 'test' : process.env.NODE_ENV ?? 'test';

import '@testing-library/jest-dom';

type ReactModule = typeof import('react');
type ReactDomTestUtilsModule = typeof import('react-dom/test-utils');

const React = require('react') as ReactModule;

// React 19 exposes act from the development build; ensure the property exists on both ESM/CJS entrypoints.
const reactNamespace = React as ReactModule & { default?: ReactModule };
if (typeof reactNamespace.act !== 'function') {
  const { act: domAct } = require('react-dom/test-utils') as ReactDomTestUtilsModule;
  if (typeof domAct === 'function') {
    Object.defineProperty(reactNamespace, 'act', {
      value: domAct,
      configurable: true,
      writable: true,
    });
    if (reactNamespace.default && typeof reactNamespace.default.act !== 'function') {
      Object.defineProperty(reactNamespace.default, 'act', {
        value: domAct,
        configurable: true,
        writable: true,
      });
    }
  }
}

// Let React know we are running inside an act-enabled environment to silence testing warnings.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
