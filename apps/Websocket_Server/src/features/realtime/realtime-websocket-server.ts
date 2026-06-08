import 'dotenv/config';
import type { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import { config, pubsubClient, constant } from '@repo/config';

export class RealtimeWebsocketServer {
  private readonly server = new WebSocketServer({
    port: config.WEBSOCKET_PORT,
  });
  private readonly pubsub = pubsubClient(config.REDIS_URL);

  async start(): Promise<void> {
    await this.pubsub.connect();

    this.server.on('connection', (socket: WebSocket) => {
      this.handleConnection(socket).catch((err: unknown) => {
        console.error('WebSocket connection error:', err);
      });
    });
  }

  private async handleConnection(socket: WebSocket): Promise<void> {
    await this.pubsub.subscriber(constant.pubsubKey, (data: unknown) => {
      socket.send(JSON.stringify(data));
    });

    socket.on('close', () => {
      RealtimeWebsocketServer.handleSocketClose();
    });
  }

  private static handleSocketClose(): void {
    // Socket closed, cleanup if needed
  }
}
