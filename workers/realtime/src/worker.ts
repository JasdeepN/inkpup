// Durable Object and Worker for real-time inquiry updates via WebSockets
import { DurableObject } from 'cloudflare:workers';

export type InquiryUpdateMessage =
  | { type: 'email_received'; inquiryId: string; emailId: string; timestamp: string }
  | { type: 'email_sent'; inquiryId: string; emailId: string; timestamp: string }
  | { type: 'status_changed'; inquiryId: string; newStatus: string; timestamp: string }
  | { type: 'ping' }
  | { type: 'pong' };

export class InquiryUpdatesDO extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade: /inquiry/:id/ws
    const wsMatch = url.pathname.match(/^\/inquiry\/([^/]+)\/ws$/);
    if (wsMatch && request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocketUpgrade(request);
    }

    // Notify endpoint: POST /notify/:id
    const notifyMatch = url.pathname.match(/^\/notify\/([^/]+)$/);
    if (notifyMatch && request.method === 'POST') {
      return this.handleNotify(request);
    }

    // Health check
    if (url.pathname === '/health') {
      const sockets = this.ctx.getWebSockets();
      return Response.json({ ok: true, connections: sockets.length, timestamp: new Date().toISOString() });
    }

    return new Response('Not Found', { status: 404 });
  }

  private handleWebSocketUpgrade(_request: Request): Response {
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server, ['inquiry-watcher']);
    try { server.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })); } catch {}
    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleNotify(request: Request): Promise<Response> {
    try {
      const message = (await request.json()) as InquiryUpdateMessage;
      const sockets = this.ctx.getWebSockets();
      const payload = JSON.stringify(message);
      let delivered = 0;
      for (const socket of sockets) {
        try { socket.send(payload); delivered++; } catch {}
      }
      return Response.json({ ok: true, delivered, total: sockets.length });
    } catch (error) {
      return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;
    try {
      const data = JSON.parse(message) as InquiryUpdateMessage;
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch {}
  }

  async webSocketClose(_ws: WebSocket): Promise<void> { /* no-op */ }
  async webSocketError(_ws: WebSocket, _error: unknown): Promise<void> { /* no-op */ }
}

export interface Env {
  INQUIRY_UPDATES: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Route WebSocket upgrades to DO instance based on inquiry id
    const wsMatch = url.pathname.match(/^\/inquiry\/([^/]+)\/ws$/);
    if (wsMatch && request.headers.get('Upgrade') === 'websocket') {
      const id = env.INQUIRY_UPDATES.idFromName(wsMatch[1]);
      const stub = env.INQUIRY_UPDATES.get(id);
      return stub.fetch(request);
    }

    // Route notify and health to a DO instance (by id for notify, or any for health)
    const notifyMatch = url.pathname.match(/^\/notify\/([^/]+)$/);
    if (notifyMatch) {
      const id = env.INQUIRY_UPDATES.idFromName(notifyMatch[1]);
      const stub = env.INQUIRY_UPDATES.get(id);
      return stub.fetch(request);
    }

    if (url.pathname === '/health') {
      // Health can be handled by a "global" stub; use a deterministic id
      const id = env.INQUIRY_UPDATES.idFromName('health');
      const stub = env.INQUIRY_UPDATES.get(id);
      return stub.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
} satisfies ExportedHandler<Env>;
