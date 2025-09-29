import { createClient, type RedisClientType } from "redis";

class PubsubClient {
  private client: RedisClientType;

  constructor(private url: string) {
    this.client = createClient({ url: url });
    this.client.on("error", (err) =>
      console.error(`Error creating clinet: ${err}`)
    );
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log("Redis connected at: ", this.url);
    }
  }

  async publish(channel: string, message: string) {
    if (this.client.isOpen) {
      await this.client.publish(channel, message);
    }
  }

  async disconnect() {
    if (this.client.isOpen) this.client.disconnect();
  }

  async subscriber(channel: string, callback: (data: any) => void) {
    if (this.client.isOpen) {
      await this.client.subscribe(channel, (message) => {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (err) {
          console.error("Failed to parse message:", err);
        }
      });
    }
  }
}

export const pubsubClient = (url: string) => new PubsubClient(url);
