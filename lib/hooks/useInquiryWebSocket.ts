'use client';

import { useEffect, useRef, useState } from 'react';

export type InquiryUpdateMessage =
  | { type: 'email_received'; inquiryId: string; emailId: string; timestamp: string }
  | { type: 'email_sent'; inquiryId: string; emailId: string; timestamp: string }
  | { type: 'status_changed'; inquiryId: string; newStatus: string; timestamp: string }
  | { type: 'connected'; timestamp: string }
  | { type: 'ping' }
  | { type: 'pong' };

interface Options {
  onMessage?: (msg: InquiryUpdateMessage) => void;
  reconnect?: boolean;
  heartbeatMs?: number;
}

/**
 * WebSocket hook for realtime inquiry updates via DO service.
 * Connects to /realtime/inquiry/:id/ws with subprotocol 'inquiry-watcher'.
 */
export function useInquiryWebSocket(inquiryId: number | string, opts: Options = {}) {
  const { onMessage, reconnect = true, heartbeatMs = 25000 } = opts;
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<InquiryUpdateMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<number>(0);
  const heartbeatRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      // Non-browser (SSR/tests) or environment without WebSocket
      return;
    }

    const url = new URL(`/realtime/inquiry/${String(inquiryId)}/ws`, window.location.origin);
    // Use wss for https origins
    url.protocol = url.protocol.replace('http', 'ws');

    let closed = false;

    const clearHeartbeat = () => {
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };

    const connect = () => {
      if (closed) return;
      try {
        const ws = new WebSocket(url.toString(), ['inquiry-watcher']);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          setError(null);
          retryRef.current = 0;
          // Start heartbeat ping (optional)
          clearHeartbeat();
          if (heartbeatMs > 0) {
            heartbeatRef.current = window.setInterval(() => {
              try { ws.send(JSON.stringify({ type: 'ping' })); } catch {}
            }, heartbeatMs);
          }
        };

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data as string) as InquiryUpdateMessage;
            setLastMessage(msg);
            onMessage?.(msg);
          } catch {
            // ignore parsing errors
          }
        };

        ws.onerror = () => {
          setError('WebSocket error');
        };

        ws.onclose = () => {
          setConnected(false);
          clearHeartbeat();
          if (closed) return;
          if (!reconnect) return;
          const delay = Math.min(10000, 500 * (retryRef.current + 1));
          retryRef.current += 1;
          window.setTimeout(connect, delay);
        };
      } catch (err) {
        setError('WebSocket connect failed');
      }
    };

    connect();

    return () => {
      closed = true;
      clearHeartbeat();
      try { wsRef.current?.close(); } catch {}
      wsRef.current = null;
    };
  }, [inquiryId, reconnect, heartbeatMs, onMessage]);

  return { connected, lastMessage, error };
}
