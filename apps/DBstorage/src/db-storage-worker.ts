import { config, constant, redisStreams } from '@repo/config';
import { dbStorageFunction } from './features/storage/db-storage.handler.js';

export class DBStorageWorker {
  private readonly redisStreamsClient = redisStreams(config.REDIS_URL);

  async start() {
    await this.redisStreamsClient.connect();
    await this.redisStreamsClient.readRedisStream(constant.dbStorageStream, dbStorageFunction);
  }
}
