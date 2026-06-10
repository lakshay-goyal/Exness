import { constant, redisStreams } from '@repo/config';

type RedisStreamsType = ReturnType<typeof redisStreams>;

export interface EngineResponse {
  function?: string;
  message?: unknown;
  [key: string]: unknown;
}

class EngineStreamClient {
  constructor(private readonly redisStreams: RedisStreamsType) {}

  async sendToEngine(command: Record<string, unknown>) {
    const streamResult = await this.redisStreams.addToRedisStream(constant.redisStream, command);
    const requestId = streamResult?.requestId || command.requestId || command.correlationId;

    if (!requestId || typeof requestId !== 'string') {
      throw new Error('Failed to generate request ID');
    }

    return requestId;
  }

  async readEngineResponse(requestId: string, timeoutMs = 5000) {
    return this.redisStreams.readNextFromRedisStream(constant.secondaryRedisStream, timeoutMs, {
      requestId,
    }) as Promise<EngineResponse | null>;
  }

  async request(command: Record<string, unknown>, timeoutMs = 5000) {
    const requestId = await this.sendToEngine(command);
    const response = await this.readEngineResponse(requestId, timeoutMs);
    return { requestId, response };
  }
}

interface ExpressRequestWithApp {
  app: {
    locals: {
      redisStreams?: RedisStreamsType;
    } & Record<string, unknown>;
  };
}

export function getEngineStreamClient(req: ExpressRequestWithApp) {
  const streams = req.app.locals.redisStreams;
  if (!streams) {
    throw new Error('redisStreams is not initialized on app.locals');
  }
  return new EngineStreamClient(streams);
}
