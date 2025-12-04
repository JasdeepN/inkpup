/**
 * InquiryUpdatesDO - Durable Object for real-time inquiry updates via WebSocket
 *
 * Uses Cloudflare's Hibernatable WebSocket API for efficient connection management.
 * Broadcasts email updates to all connected clients watching a specific inquiry.
 *
 * @see https://developers.cloudflare.com/durable-objects/api/hibernatable-websockets-api/
 */
import { DurableObject } from 'cloudflare:workers';

/** Message types for WebSocket communication */
export type InquiryUpdateMessage =
  | { type: 'email_received'; inquiryId: string; emailId: string; timestamp: string }
  | { type: 'email_sent'; inquiryId: string; emailId: string; timestamp: string }
  | { type: 'status_changed'; inquiryId: string; newStatus: string; timestamp: string }
  | { type: 'ping' }
  | { type: 'pong' };

/**
 * Durable Object for managing WebSocket connections for inquiry updates.
 * Each inquiry ID maps to a separate DO instance for isolation.
 */
export class InquiryUpdatesDO extends DurableObject<CloudflareEnv> {
  /**
   * Handle incoming HTTP requests - primarily WebSocket upgrade requests
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocketUpgrade(request);
    }

    // Handle notification endpoint (called by webhook)
    if (url.pathname === '/notify' && request.method === 'POST') {
      return this.handleNotify(request);
    }

    // Health check
    if (url.pathname === '/health') {
      const sockets = this.ctx.getWebSockets();
      return Response.json({
        ok: true,
        connections: sockets.length,
        timestamp: new Date().toISOString(),
      });
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Upgrade HTTP connection to WebSocket using hibernatable API
   */
  private handleWebSocketUpgrade(_request: Request): Response {
    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    // Accept the WebSocket with hibernation support
    // Tags can be used to identify connections (e.g., by user ID)
    this.ctx.acceptWebSocket(server, ['inquiry-watcher']);

    // Send initial connection confirmation
    server.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Handle notification from webhook - broadcast to all connected clients
   */
  private async handleNotify(request: Request): Promise<Response> {
    try {
      const message = (await request.json()) as InquiryUpdateMessage;

      // Broadcast to all connected WebSockets
      const sockets = this.ctx.getWebSockets();
      const payload = JSON.stringify(message);

      let delivered = 0;
      for (const socket of sockets) {
        try {
          socket.send(payload);
          delivered++;
        } catch {
          // Socket may be closed, hibernation will clean it up
        }
      }

      return Response.json({
        ok: true,
        delivered,
        total: sockets.length,
      });
    } catch (error) {
      return Response.json(
        { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400 }
      );
    }
  }

  /**
   * Hibernatable WebSocket message handler
   * Called when a message is received from a connected client
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') {
      return; // Ignore binary messages
    }

    try {
      const data = JSON.parse(message) as InquiryUpdateMessage;

      // Respond to ping with pong
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch {
      // Invalid JSON, ignore
    }
  }

  /**
   * Hibernatable WebSocket close handler
   * Called when a client disconnects
   */
  async webSocketClose(
    _ws: WebSocket,
    _code: number,
    _reason: string,
    _wasClean: boolean
  ): Promise<void> {
    // No-op - Cloudflare automatically removes closed sockets from getWebSockets()
    // Logging here would wake the DO unnecessarily
  }

  /**
   * Hibernatable WebSocket error handler
   */
  async webSocketError(_ws: WebSocket, _error: unknown): Promise<void> {
    // No-op - errors are typically followed by close events
  }
}
