import { createClient, type RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';

interface StreamMessage {
  id: string;
  message: Record<string, string>;
}

interface StreamResponse {
  name: string;
  messages: StreamMessage[];
}

interface MessageData {
  requestId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

const parseMessageData = (message: Record<string, string>): unknown => {
  const payload: Record<string, string> = {};
  for (const key in message) {
    const value = message[key];
    if (Object.prototype.hasOwnProperty.call(message, key) && value !== undefined) {
      payload[key] = value;
    }
  }
  const jsonString = Object.values(payload).join('');
  return JSON.parse(jsonString);
};

const extractRequestId = (data: unknown): string | undefined => {
  const msgData = data as MessageData;
  return msgData.requestId ?? msgData.correlationId;
};

const parseStreamEntry = (entry: unknown): unknown => {
  const entryArray = entry as [string, string[]] | { message: Record<string, string> };
  const rawFields = Array.isArray(entryArray) ? entryArray[1] : entryArray.message;
  const payload: Record<string, string> = {};

  if (Array.isArray(rawFields)) {
    for (let index = 0; index < rawFields.length; index += 2) {
      const key = rawFields[index];
      const value = rawFields[index + 1];
      if (key !== undefined && value !== undefined) {
        payload[key] = value;
      }
    }
  } else if (rawFields !== undefined && rawFields !== null && typeof rawFields === 'object') {
    for (const key in rawFields) {
      const value = rawFields[key];
      if (Object.prototype.hasOwnProperty.call(rawFields, key) && value !== undefined) {
        payload[key] = value;
      }
    }
  }

  const jsonString = Object.values(payload).join('');
  if (jsonString === '') return null;

  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
};

class RedisStreams {
  private readonly client: RedisClientType;
  private readonly consumerGroupInitialized: Set<string>;
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
    this.client = createClient({ url });
    this.consumerGroupInitialized = new Set();
    this.client.on('error', (err: Error) => {
      console.error(`Error creating client: ${String(err)}`);
    });
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async ensureConsumerGroup(streamName: string, groupName: string): Promise<void> {
    if (this.consumerGroupInitialized.has(`${streamName}:${groupName}`)) {
      return;
    }

    try {
      await this.client.xGroupCreate(
        streamName,
        groupName,
        '0',
        { MKSTREAM: true },
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('BUSYGROUP')) {
        // Group already exists, ignore
      } else {
        console.error('Error creating consumer group:', error);
      }
    }

    this.consumerGroupInitialized.add(`${streamName}:${groupName}`);
  }

  async addToRedisStream(
    streamName: string,
    data: MessageData,
  ): Promise<{ messageId: string; requestId: string | undefined }> {
    const dataToSend = { ...data };
    
    if (dataToSend.requestId === undefined && dataToSend.correlationId === undefined) {
      dataToSend.requestId = uuidv4();
    }

    const messageId = await this.client.xAdd(
      streamName,
      '*',
      { message: JSON.stringify(dataToSend) },
    );
    
    return { messageId, requestId: dataToSend.requestId ?? dataToSend.correlationId };
  }

  async readRedisStream(
    STREAM_KEY: string,
    callbackFunction: (msg: unknown) => void,
  ): Promise<void> {
    let lastId = '$';
    
    while (true) {
      if (!this.client.isOpen) return;

      const response = await this.client.xRead(
        [{ key: STREAM_KEY, id: lastId }],
        { BLOCK: 0, COUNT: 1 },
      ) as StreamResponse[] | null;

      if (response !== null && response.length > 0 && response[0] !== undefined) {
        const { messages } = response[0];

        for (const msg of messages) {
          const { id, message } = msg;
          lastId = id;

          const result = parseMessageData(message);
          callbackFunction(result);
          break;
        }
      }
    }
  }

  private async readWithConsumerGroup(options: {
    streamName: string;
    blockMs: number;
    consumerGroup: string;
    consumerName: string;
    requestIdFilter?: string;
  }): Promise<unknown | null> {
    const { streamName, blockMs, consumerGroup, consumerName, requestIdFilter } = options;
    await this.ensureConsumerGroup(streamName, consumerGroup);

    let response = await this.client
      .xReadGroup(
        consumerGroup,
        consumerName,
        [{ key: streamName, id: '0' }],
        { BLOCK: 0, COUNT: 1 },
      )
      .catch(() => null) as StreamResponse[] | null;

    if (
      response === null ||
      response.length === 0 ||
      response[0] === undefined ||
      response[0].messages.length === 0
    ) {
      response = await this.client.xReadGroup(
        consumerGroup,
        consumerName,
        [{ key: streamName, id: '>' }],
        { BLOCK: blockMs, COUNT: 1 },
      ) as StreamResponse[] | null;
    }

    if (response === null || response.length === 0) {
      return null;
    }

    const [firstResponse] = response;
    if (firstResponse === undefined) {
      return null;
    }
    const { messages } = firstResponse;
    if (messages.length === 0) {
      return null;
    }

    const [firstMessage] = messages;
    if (firstMessage === undefined || typeof firstMessage !== 'object' || !('id' in firstMessage) || !('message' in firstMessage)) {
      return null;
    }

    const { id, message } = firstMessage;
    const result = parseMessageData(message);

    try {
      await this.client.xAck(streamName, consumerGroup, id);
    } catch (ackError) {
      console.error('Error acknowledging message:', ackError);
    }

    if (requestIdFilter !== undefined) {
      const resultRequestId = extractRequestId(result);
      if (resultRequestId !== requestIdFilter) {
        return this.readWithConsumerGroup({ streamName, blockMs, consumerGroup, consumerName, requestIdFilter });
      }
    }

    return result;
  }

  private async searchMessagesByRequestId(
    streamName: string,
    blockMs: number,
    requestId: string,
  ): Promise<unknown | null> {
    // Step 1: Try reading new messages first
    try {
      const newMsgResponse = await this.client.xRead(
        [{ key: streamName, id: '$' }],
        { BLOCK: 100, COUNT: 10 },
      ) as StreamResponse[] | null;

      if (newMsgResponse !== null && newMsgResponse.length > 0 && newMsgResponse[0] !== undefined) {
        const [firstResponse] = newMsgResponse;
        for (const msg of firstResponse?.messages ?? []) {
          const result = parseMessageData(msg.message);
          const resultRequestId = extractRequestId(result);
          if (resultRequestId === requestId) {
            return result;
          }
        }
      }
    } catch {
      // Ignore errors, continue to search existing messages
    }

    // Step 2: Search through existing messages from the beginning
    let lastId = '0';
    const maxAttempts = 200;
    let attempts = 0;
    const seenIds = new Set<string>();

    while (attempts < maxAttempts) {
      const response = await this.client.xRead(
        [{ key: streamName, id: lastId }],
        { BLOCK: blockMs > 0 ? Math.min(blockMs, 1000) : 0, COUNT: 10 },
      ) as StreamResponse[] | null;

      if (response === null || response.length === 0) {
        return null;
      }

      const [firstResponse] = response;
      if (firstResponse === undefined) {
        return null;
      }
      const { messages } = firstResponse;
      if (messages.length === 0) {
        return null;
      }

      for (const msg of messages) {
        if (seenIds.has(msg.id)) {
          continue;
        }
        seenIds.add(msg.id);

        if (typeof msg !== 'object' || !('id' in msg) || !('message' in msg)) {
          continue;
        }

        const result = parseMessageData(msg.message);
        const resultRequestId = extractRequestId(result);

        if (resultRequestId === requestId) {
          return result;
        }
      }

      if (messages.length === 0) {
        return null;
      }

      const lastMessage = messages[messages.length - 1];
      if (typeof lastMessage === 'object' && 'id' in lastMessage) {
        lastId = lastMessage.id;
      } else {
        return null;
      }
      attempts++;
    }

    return null;
  }

  private async readNextMessage(
    streamName: string,
    blockMs: number,
  ): Promise<unknown | null> {
    const response = await this.client.xRead([{ key: streamName, id: '$' }], {
      BLOCK: blockMs,
      COUNT: 1,
    }) as StreamResponse[] | null;

    if (response === null || response.length === 0) {
      return null;
    }

    const [firstResponse] = response;
    if (firstResponse === undefined) {
      return null;
    }
    const { messages } = firstResponse;
    if (messages.length === 0) {
      return null;
    }

    const [firstMessage] = messages;
    if (firstMessage === undefined || typeof firstMessage !== 'object' || !('id' in firstMessage) || !('message' in firstMessage)) {
      return null;
    }

    return parseMessageData(firstMessage.message);
  }

  async readNextFromRedisStream(
    streamName: string,
    blockMs = 0,
    options?: {
      requestId?: string;
      consumerGroup?: string;
      consumerName?: string;
    },
  ): Promise<unknown | null> {
    if (!this.client.isOpen) {
      throw new Error('Redis client is not connected');
    }

    if (options?.consumerGroup !== undefined && options?.consumerName !== undefined) {
      return this.readWithConsumerGroup({
        streamName,
        blockMs,
        consumerGroup: options.consumerGroup,
        consumerName: options.consumerName,
        requestIdFilter: options.requestId,
      });
    }

    if (options?.requestId !== undefined) {
      return this.searchMessagesByRequestId(streamName, blockMs, options.requestId);
    }

    return this.readNextMessage(streamName, blockMs);
  }

  async readLatestFromRedisStream(streamName: string, count = 1): Promise<unknown[]> {
    if (!this.client.isOpen) {
      throw new Error('Redis client is not connected');
    }

    const response = await (this.client as unknown as { sendCommand: (args: string[]) => Promise<unknown[]> }).sendCommand([
      'XREVRANGE',
      streamName,
      '+',
      '-',
      'COUNT',
      String(count),
    ]);

    if (!Array.isArray(response)) {
      return [];
    }

    return response
      .map((entry) => parseStreamEntry(entry))
      .filter((item): item is unknown => item !== null);
  }

  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      try {
        await this.client.quit();
      } catch {
        // Ignore errors during disconnect
      }
    }
  }
}

export const redisStreams = (url: string): RedisStreams => new RedisStreams(url);
