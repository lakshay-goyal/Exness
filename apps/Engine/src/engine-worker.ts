import { config, redisStreams, constant } from "@repo/config";
import { tradeFunction } from "./features/dispatcher/trade-dispatcher.js";

export class EngineWorker {
  private readonly redisStreamsClient = redisStreams(config.REDIS_URL);
  private readonly concurrencyLimit = 10;
  private readonly workerCount = Math.min(this.concurrencyLimit, 5);
  private readonly consumerGroup = "engine-group";
  private readonly consumerName = `engine-${process.pid}-${Date.now()}`;
  private activeTasks = 0;
  private readonly taskQueue: Array<() => Promise<void>> = [];

  async start() {
    await this.redisStreamsClient.connect();

    for (let index = 0; index < this.workerCount; index++) {
      void this.worker();
    }


    await this.consume();
  }

  private async processMessage(result: any) {
    try {
      await tradeFunction(result);
    } catch (error) {
      console.error("Error processing message:", error);
    }
  }

  private async worker() {
    while (true) {
      if (this.taskQueue.length > 0 && this.activeTasks < this.concurrencyLimit) {
        const task = this.taskQueue.shift();
        if (task) {
          this.activeTasks++;
          task().finally(() => {
            this.activeTasks--;
          });
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
  }

  private async consume() {
    while (true) {
      try {
        const result = await this.redisStreamsClient.readNextFromRedisStream(
          constant.redisStream,
          0,
          {
            consumerGroup: this.consumerGroup,
            consumerName: this.consumerName,
          },
        );

        if (result) {
          this.taskQueue.push(() => this.processMessage(result));
        }
      } catch (error) {
        console.error("Error reading from Redis stream:", error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}
