import { createClient, type RedisClientType } from 'redis';

class RedisClient {
  private readonly client: RedisClientType;
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
    this.client = createClient({ url });
    this.client.on('error', (err: Error) => {
      console.error(`Error creating client: ${String(err)}`);
    });
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async pushData(channel: string, message: string): Promise<void> {
    if (this.client.isOpen) {
      await this.client.rPush(channel, message);
    }
  }

  async popData(channel: string): Promise<string | null> {
    if (this.client.isOpen) {
      const msg = await this.client.lPop(channel);
      return msg;
    }
    return null;
  }

  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}

export const redisClient = (url: string): RedisClient => new RedisClient(url);
