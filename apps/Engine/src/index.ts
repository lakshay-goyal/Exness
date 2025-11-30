import { config, redisStreams, constant } from "@repo/config";
import { tradeFunction } from "./functions/tradeFunction.js";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

// Configuration for parallel processing
const CONCURRENCY_LIMIT = 10; // Process up to 10 messages concurrently
const CONSUMER_GROUP = "engine-group";
const CONSUMER_NAME = `engine-${process.pid}-${Date.now()}`; // Unique consumer name

let activeTasks = 0;
const taskQueue: Array<() => Promise<void>> = [];

// Process a single message
async function processMessage(result: any) {
  try {
    await tradeFunction(result);
  } catch (error) {
    console.error("Error processing message:", error);
  }
}

// Worker function to process queued tasks
async function worker() {
  while (true) {
    if (taskQueue.length > 0 && activeTasks < CONCURRENCY_LIMIT) {
      const task = taskQueue.shift();
      if (task) {
        activeTasks++;
        task().finally(() => {
          activeTasks--;
        });
      }
    } else {
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

// Start worker threads
const WORKER_COUNT = Math.min(CONCURRENCY_LIMIT, 5); // Start with 5 workers
for (let i = 0; i < WORKER_COUNT; i++) {
  worker();
}

console.log(`Engine started with ${WORKER_COUNT} workers, max concurrency: ${CONCURRENCY_LIMIT}`);

// Continuously consume messages and queue them for processing
while (true) {
  try {
    const result = await RedisStreams.readNextFromRedisStream(
      constant.redisStream,
      0, // Block indefinitely
      {
        consumerGroup: CONSUMER_GROUP,
        consumerName: CONSUMER_NAME
      }
    );
    
    if (result) {
      // Queue the task for parallel processing
      taskQueue.push(() => processMessage(result));
      console.log(`Queued message for processing. Queue length: ${taskQueue.length}, Active tasks: ${activeTasks}`);
    }
  } catch (error) {
    console.error("Error reading from Redis stream:", error);
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}