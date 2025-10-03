import { createClient, type RedisClientType } from "redis";

class RedisStreams {
  private client: RedisClientType;

  constructor(private url: string) {
    this.client = createClient({ url: url });
    this.client.on("error", (err) =>
      console.error(`Error creating client: ${err}`)
    );
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log("Redis connected at:", this.url);
    }
  }

  async addToRedisStream(streamName: string, data: Record<string, any>) {
    try {
      const messageId = await this.client.xAdd(
        streamName,
        "*", // Let Redis assign an ID automatically
        { message: JSON.stringify(data) }
      );
      console.log(
        `Data Added: ${messageId}, ${streamName}, ${JSON.stringify(data)}`
      );
      return messageId;
    } catch (e) {
      console.error("Error adding to Redis stream:", e);
      throw e;
    }
  }

  async readRedisStream(
    STREAM_KEY: string,
    callbackFunction: (msg: any) => void
  ) {
    try {
      while (true) {
        if (!this.client.isOpen) return;

        let lastId = "$"; // start from beginning. Use "$" to only read new ones.
        const response = await this.client.xRead(
          [{ key: STREAM_KEY, id: lastId }],
          { BLOCK: 0, COUNT: 1 } // wait max 5s, read up to 10 msgs
        );

        if (response && response.length > 0 && response[0]) {
          const messages = response[0].messages;

          for (const msg of messages) {
            const { id, message } = msg;
            lastId = id; // update last seen ID

            let payload: Record<string, any> = {};
            for (const key in message) {
              payload[key] = message[key];
            }

            console.log("Received message:", id, JSON.stringify(payload));
            const jsonString = Object.values(payload).join("");
            const result = JSON.parse(jsonString);
            callbackFunction(result);
            break; // Exit the loop after processing and calling the callback
          }
        }
        // Removed unreachable conditions === false block
        console.log("Exited read loop");
      }
    } catch (e) {
      console.error("Error reading from Redis stream:", e);
      throw e;
    }
  }

  // Promise-based: read exactly one next message then resolve
  async readNextFromRedisStream(
    streamName: string,
    blockMs: number = 0 // 0 = block indefinitely for the next message
  ): Promise<any | null> {
    try {
      if (!this.client.isOpen) {
        throw new Error("Redis client is not connected");
      }

      const lastId = "$"; // only new entries after this call
      const response = await this.client.xRead(
        [{ key: streamName, id: lastId }],
        { BLOCK: blockMs, COUNT: 1 }
      );

      if (!response || response.length === 0 || !response[0]) {
        return null;
      }

      const messages = response[0].messages;
      if (!messages || messages.length === 0) {
        return null;
      }

      const msg = messages[0];
      if (!msg || typeof msg !== "object" || !("id" in msg) || !("message" in msg)) {
        return null;
      }
      const { id, message } = msg as { id: string; message: Record<string, any> };
      const payload: Record<string, any> = {};
      for (const key in message) {
        payload[key] = message[key];
      }

      console.log("Received message:", id, JSON.stringify(payload));
      const jsonString = Object.values(payload).join("");
      const result = JSON.parse(jsonString);
      return result;
    } catch (e) {
      console.error("Error reading next message from Redis stream:", e);
      throw e;
    }
  }

  async disconnect() {
    if (this.client.isOpen) {
      this.client.disconnect();
      console.log("Redis stream disconnected");
    }
  }
}

export const redisStreams = (url: string) => new RedisStreams(url);
