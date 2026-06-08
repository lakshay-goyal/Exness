import "dotenv/config";
import { WebSocketServer } from "ws";
import { config, pubsubClient, constant } from "@repo/config";

export class RealtimeWebsocketServer {
  private readonly server = new WebSocketServer({
    port: config.WEBSOCKET_PORT,
  });
  private readonly pubsub = pubsubClient(config.REDIS_URL);

  async start() {
    await this.pubsub.connect();

    this.server.on("connection", async (socket) => {
      await this.pubsub.subscriber(constant.pubsubKey, (data: any) => {
        socket.send(JSON.stringify(data));
      });

      socket.on("close", () => {});
    });
  }
}
