import "dotenv/config";
import { WebSocketServer } from "ws";
import { config, pubsubClient, constant } from "@repo/config";

// connect Websocket service
const wss = new WebSocketServer({ port: config.WEBSOCKET_PORT });

// connect redis pubsub
const PubsubClient = pubsubClient(config.REDIS_URL);
await PubsubClient.connect();

wss.on("connection", async (socket) => {
  console.log("Client connected");

  // subsctibe to redis pubsub and send it to frontend
  await PubsubClient.subscriber(constant.pubsubKey, (data:any) => {    
    socket.send(JSON.stringify(data));
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });
});
