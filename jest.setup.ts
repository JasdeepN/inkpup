import '@testing-library/jest-dom';
import { ReadableStream, TransformStream, WritableStream } from 'stream/web';
import { MessageChannel, MessagePort } from 'worker_threads';
import { TextDecoder, TextEncoder } from 'util';
import { act as domAct } from 'react-dom/test-utils';

type ReactModule = typeof import('react');

let reactNamespace: ReactModule & { default?: ReactModule };

const globalScope = globalThis as typeof globalThis & {
  TextDecoder?: typeof TextDecoder;
  TextEncoder?: typeof TextEncoder;
  Headers?: typeof import('undici').Headers;
  Request?: typeof import('undici').Request;
  Response?: typeof import('undici').Response;
  fetch?: typeof import('undici').fetch;
  ReadableStream?: typeof ReadableStream;
  WritableStream?: typeof WritableStream;
  TransformStream?: typeof TransformStream;
  MessageChannel?: typeof MessageChannel;
  MessagePort?: typeof MessagePort;
};

if (typeof globalScope.TextEncoder === 'undefined') {
  // @ts-expect-error - Type incompatibility between Node util and global TextEncoder
  globalScope.TextEncoder = TextEncoder;
}

if (typeof globalScope.TextDecoder === 'undefined') {
  // @ts-expect-error - Type incompatibility between Node util and global TextDecoder
  globalScope.TextDecoder = TextDecoder;
}

if (typeof globalScope.ReadableStream === 'undefined') {
  // @ts-expect-error - Type incompatibility between Node stream/web and global ReadableStream
  globalScope.ReadableStream = ReadableStream;
}

if (typeof globalScope.WritableStream === 'undefined') {
  globalScope.WritableStream = WritableStream;
}

if (typeof globalScope.TransformStream === 'undefined') {
  // @ts-expect-error - Type incompatibility between Node stream/web and global TransformStream
  globalScope.TransformStream = TransformStream;
}

if (typeof globalScope.MessageChannel === 'undefined') {
  // @ts-expect-error - Type incompatibility between Node worker_threads and global MessageChannel
  globalScope.MessageChannel = MessageChannel;
}

if (typeof globalScope.MessagePort === 'undefined') {
  globalScope.MessagePort = MessagePort as unknown as typeof globalScope.MessagePort;
}

if (typeof globalScope.MessageChannel === 'function') {
  globalScope.MessageChannel = undefined as unknown as typeof globalScope.MessageChannel;
}

if (typeof globalScope.MessagePort === 'function') {
  globalScope.MessagePort = undefined as unknown as typeof globalScope.MessagePort;
}

const React = require('react') as ReactModule & { default?: ReactModule };
reactNamespace = React;

const { Headers, Request, Response, fetch: undiciFetch } = require('undici') as typeof import('undici');

if (typeof globalScope.fetch === 'undefined') {
  // @ts-expect-error - Type incompatibility between undici fetch and global fetch
  globalScope.fetch = undiciFetch;
}

if (typeof globalScope.Headers === 'undefined') {
  // @ts-expect-error - Type incompatibility between undici Headers and global Headers
  globalScope.Headers = Headers;
}

if (typeof globalScope.Request === 'undefined') {
  // @ts-expect-error - Type incompatibility between undici Request and global Request
  globalScope.Request = Request;
}

if (typeof globalScope.Response === 'undefined') {
  // @ts-expect-error - Type incompatibility between undici Response and global Response
  globalScope.Response = Response;
}

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
