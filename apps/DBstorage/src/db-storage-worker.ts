import { config, constant, redisStreams } from '@repo/config';
import { dbStorageFunction, type StreamData } from './features/storage/db-storage.handler.js';

export class DBStorageWorker {
  private readonly redisStreamsClient = redisStreams(config.REDIS_URL);

  async start(): Promise<void> {
    await this.redisStreamsClient.connect();
    await this.redisStreamsClient.readRedisStream(constant.dbStorageStream, (data: unknown) => {
      dbStorageFunction(data as StreamData).catch((error: unknown) => {
        console.error('Error in dbStorageFunction:', error);
      });
    });
  }
}
