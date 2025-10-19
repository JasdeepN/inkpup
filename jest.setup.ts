import '@testing-library/jest-dom';
// Mock next/image globally for all tests (Next.js 16/React 19/Jest 30)
import React from 'react';

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
