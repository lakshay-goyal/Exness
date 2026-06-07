import { createClient, type RedisClientType } from "redis";
import { v4 as uuidv4 } from "uuid";

class RedisStreams {
  private client: RedisClientType;
  private consumerGroupInitialized: Set<string> = new Set();

  constructor(private url: string) {
    this.client = createClient({ url: url });
    this.client.on("error", (err) =>
      console.error(`Error creating client: ${err}`)
    );
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  // Initialize consumer group for a stream
  async ensureConsumerGroup(streamName: string, groupName: string) {
    if (this.consumerGroupInitialized.has(`${streamName}:${groupName}`)) {
      return;
    }

    try {
      await this.client.xGroupCreate(
        streamName,
        groupName,
        "0", // Start from beginning
        { MKSTREAM: true } // Create stream if it doesn't exist
      );
    } catch (error: any) {
      // Group might already exist, which is fine
      if (error?.message?.includes("BUSYGROUP")) {
      } else {
        console.error(`Error creating consumer group:`, error);
      }
    }
    
    this.consumerGroupInitialized.add(`${streamName}:${groupName}`);
  }

  async addToRedisStream(streamName: string, data: Record<string, any>) {
    try {
      // Add correlation ID if not present (for request tracking)
      if (!data.requestId && !data.correlationId) {
        data.requestId = uuidv4();
      }
      
      const messageId = await this.client.xAdd(
        streamName,
        "*", // Let Redis assign an ID automatically
        { message: JSON.stringify(data) }
      );
      return { messageId, requestId: data.requestId || data.correlationId };
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

            const jsonString = Object.values(payload).join("");
            const result = JSON.parse(jsonString);
            callbackFunction(result);
            break; // Exit the loop after processing and calling the callback
          }
        }
        // Removed unreachable conditions === false block
      }
    } catch (e) {
      console.error("Error reading from Redis stream:", e);
      throw e;
    }
  }

  // Promise-based: read exactly one next message then resolve
  async readNextFromRedisStream(
    streamName: string,
    blockMs: number = 0, // 0 = block indefinitely for the next message
    options?: {
      requestId?: string; // Filter by correlation ID
      consumerGroup?: string; // Use consumer group
      consumerName?: string; // Consumer name for consumer group
    }
  ): Promise<any | null> {
    try {
      if (!this.client.isOpen) {
        throw new Error("Redis client is not connected");
      }

      // If using consumer group
      if (options?.consumerGroup && options?.consumerName) {
        await this.ensureConsumerGroup(streamName, options.consumerGroup);
        
        // First try to read pending messages (messages that were sent before consumer joined)
        // "0" means read from the beginning of pending messages for this consumer
        let response = await this.client.xReadGroup(
          options.consumerGroup,
          options.consumerName,
          [{ key: streamName, id: "0" }], // "0" means read pending messages from beginning
          { BLOCK: 0, COUNT: 1 }
        ).catch(() => null);

        // If no pending messages, read new messages
        // ">" means: deliver messages that were never delivered to any consumer in this group
        if (!response || response.length === 0 || !response[0] || response[0].messages.length === 0) {
          response = await this.client.xReadGroup(
            options.consumerGroup,
            options.consumerName,
            [{ key: streamName, id: ">" }], // ">" means new messages for this consumer
            { BLOCK: blockMs, COUNT: 1 }
          );
        }

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

        const jsonString = Object.values(payload).join("");
        const result = JSON.parse(jsonString);
        
        // Acknowledge the message
        try {
          await this.client.xAck(streamName, options.consumerGroup, id);
        } catch (ackError) {
          console.error("Error acknowledging message:", ackError);
        }
        
        // Filter by requestId if provided
        if (options.requestId) {
          const resultRequestId = result.requestId || result.correlationId;
          if (resultRequestId !== options.requestId) {
            // This message doesn't match, read next one
            return this.readNextFromRedisStream(streamName, blockMs, options);
          }
        }
        
        return result;
      }

      // Regular read (non-consumer group mode)
      if (options?.requestId) {
        // When filtering by requestId, we need to search through existing messages
        // First, try to read new messages (in case response arrives after we start)
        // Then search through existing messages from the beginning
        
        // Step 1: Try reading new messages first (non-blocking quick check)
        try {
          const newMsgResponse = await this.client.xRead(
            [{ key: streamName, id: "$" }],
            { BLOCK: 100, COUNT: 10 } // Quick check for new messages
          );
          
          if (newMsgResponse && newMsgResponse.length > 0 && newMsgResponse[0]) {
            for (const msg of newMsgResponse[0].messages) {
              const payload: Record<string, any> = {};
              for (const key in msg.message) {
                payload[key] = msg.message[key];
              }
              const jsonString = Object.values(payload).join("");
              const result = JSON.parse(jsonString);
              const resultRequestId = result.requestId || result.correlationId;
              if (resultRequestId === options.requestId) {
                return result;
              }
            }
          }
        } catch (e) {
          // Ignore errors, continue to search existing messages
        }

        // Step 2: Search through existing messages from the beginning
        let lastId = "0"; // Start from beginning
        const maxAttempts = 200; // Search through up to 200 messages
        let attempts = 0;
        const seenIds = new Set<string>();

        while (attempts < maxAttempts) {
          const response = await this.client.xRead(
            [{ key: streamName, id: lastId }],
            { BLOCK: blockMs > 0 ? Math.min(blockMs, 1000) : 0, COUNT: 10 } // Read up to 10 at a time for efficiency
          );

          if (!response || response.length === 0 || !response[0]) {
            return null; // No more messages
          }

          const messages = response[0].messages;
          if (!messages || messages.length === 0) {
            return null; // No more messages
          }

          // Check all messages in this batch
          for (const msg of messages) {
            if (seenIds.has(msg.id)) {
              continue; // Skip already seen messages
            }
            seenIds.add(msg.id);

            if (!msg || typeof msg !== "object" || !("id" in msg) || !("message" in msg)) {
              continue;
            }

            const payload: Record<string, any> = {};
            for (const key in msg.message) {
              payload[key] = msg.message[key];
            }

            const jsonString = Object.values(payload).join("");
            const result = JSON.parse(jsonString);
            const resultRequestId = result.requestId || result.correlationId;

            if (resultRequestId === options.requestId) {
              return result; // Found the matching message!
            }
          }

          // Update lastId to continue from the last message we saw
          // Safety check: ensure messages array is not empty before accessing
          if (messages.length === 0) {
            return null; // No more messages to read
          }
          
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && typeof lastMessage === 'object' && 'id' in lastMessage) {
            lastId = lastMessage.id as string;
          } else {
            return null; // Invalid message structure
          }
          attempts++;
        }

        return null; // Searched through messages but didn't find a match
      } else {
        // No requestId filtering - just read next new message
        const response = await this.client.xRead(
          [{ key: streamName, id: "$" }],
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

        const payload: Record<string, any> = {};
        for (const key in msg.message) {
          payload[key] = msg.message[key];
        }

        const jsonString = Object.values(payload).join("");
        const result = JSON.parse(jsonString);
        return result;
      }
    } catch (e) {
      console.error("Error reading next message from Redis stream:", e);
      throw e;
    }
  }

  async readLatestFromRedisStream(
    streamName: string,
    count: number = 1,
  ): Promise<any[]> {
    try {
      if (!this.client.isOpen) {
        throw new Error("Redis client is not connected");
      }

      const response = await (this.client as any).sendCommand([
        "XREVRANGE",
        streamName,
        "+",
        "-",
        "COUNT",
        String(count),
      ]);

      if (!Array.isArray(response)) {
        return [];
      }

      return response
        .map((entry) => {
          const rawFields = Array.isArray(entry) ? entry[1] : entry?.message;
          const payload: Record<string, any> = {};

          if (Array.isArray(rawFields)) {
            for (let index = 0; index < rawFields.length; index += 2) {
              const key = rawFields[index];
              const value = rawFields[index + 1];
              if (key !== undefined && value !== undefined) {
                payload[String(key)] = String(value);
              }
            }
          } else if (rawFields && typeof rawFields === "object") {
            for (const key in rawFields) {
              payload[key] = rawFields[key];
            }
          }

          const jsonString = Object.values(payload).join("");
          if (!jsonString) return null;

          try {
            return JSON.parse(jsonString);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch (e) {
      console.error("Error reading latest messages from Redis stream:", e);
      throw e;
    }
  }

  async disconnect() {
    if (this.client.isOpen) {
      try {
        await this.client.quit(); // Use quit() instead of disconnect() for graceful shutdown
      } catch (e) {
        // Ignore errors during disconnect
      }
    }
  }
}

export const redisStreams = (url: string) => new RedisStreams(url);
