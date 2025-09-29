import { createClient, type RedisClientType } from "redis";

class ReadRedisStreams {
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

  async readRedisStream(
    STREAM_KEY: string,
    callbackFunction: (msg: any) => void
  ) {
    try {
      if (!this.client.isOpen) return;
      while(true){

      const startTime = Date.now();
      const timeOut = 3000;

      let lastId = "$"; // start from beginning. Use "$" to only read new ones.
      let conditions = true;
      while (conditions && Date.now() - startTime < timeOut) {
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
            //  callbackFunction(result);

            if (result.function === "createUser") {
                callbackFunction(result);
                conditions = false;
                break; // Exit the loop after processing and calling the callback
            }
          }
        }
        // Removed unreachable conditions === false block
      }

      console.log("Exited read loop");
      }
    } catch (e) {
      console.error("Error reading from Redis stream:", e);
      throw e;
    }
  }
}

export const readRedisStreams = (url: string) => new ReadRedisStreams(url);
