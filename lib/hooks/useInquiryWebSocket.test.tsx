/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useInquiryWebSocket } from './useInquiryWebSocket';

class MockWebSocket {
  url: string;
  protocol?: string[];
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  _isClosed = false;
  constructor(url: string, protocols?: string[]) {
    this.url = url;
    this.protocol = protocols;
    // Simulate async open after onopen handler assignment
    setTimeout(() => { this.onopen && this.onopen(); }, 0);
  }
  send(_data: string) {}
  close() { this._isClosed = true; this.onclose && this.onclose(); }
}

describe('useInquiryWebSocket', () => {
  let originalWS: any;
  beforeEach(() => {
    originalWS = (window as any).WebSocket;
    (window as any).WebSocket = MockWebSocket as any;
  });
  afterEach(() => {
    (window as any).WebSocket = originalWS;
  });

  it('connects and sets connected state', async () => {
    const { result } = renderHook(() => useInquiryWebSocket(123, { heartbeatMs: 0 }));
    expect(result.current.connected).toBe(false);
    await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
    expect(result.current.connected).toBe(true);
  });


});
