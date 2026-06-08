import { createClient, type RedisClientType } from 'redis';

class PubsubClient {
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

  async publish(channel: string, message: string): Promise<void> {
    if (this.client.isOpen) {
      await this.client.publish(channel, message);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  async subscriber(
    channel: string,
    callback: (data: unknown) => void,
  ): Promise<void> {
    if (this.client.isOpen) {
      await this.client.subscribe(channel, (message: string) => {
        try {
          const data: unknown = JSON.parse(message);
          callback(data);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      });
    }
  }
}

export const pubsubClient = (url: string): PubsubClient => new PubsubClient(url);
