import { constant } from '@repo/config';

class EngineStreamClient {
  constructor(private readonly redisStreams: any) {}

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
    });
  }

  async request(command: Record<string, unknown>, timeoutMs = 5000) {
    const requestId = await this.sendToEngine(command);
    const response = await this.readEngineResponse(requestId, timeoutMs);
    return { requestId, response };
  }
}

export function getEngineStreamClient(req: { app: { locals: Record<string, any> } }) {
  return new EngineStreamClient(req.app.locals.redisStreams);
}
