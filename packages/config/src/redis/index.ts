import { createClient, type RedisClientType } from "redis";

class RedisClient {
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

  async pushData(channel: string, message: string) {
    if (this.client.isOpen) {
      await this.client.rPush(channel, message);
    }
  }

  async popData(channel: string) {
    if (this.client.isOpen) {
      const msg = await this.client.lPop(channel);
      console.log(JSON.stringify(msg))
      return msg;
    }
    return null;
  }

  async disconnect() {
    if (this.client.isOpen) this.client.disconnect();
  }
}

export const redisClient = (url: string) => new RedisClient(url);
