import { existsSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const ROOT = path.resolve(import.meta.dir, '..');
const ROOT_ENV = path.join(ROOT, '.env');
const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

if (!existsSync(ROOT_ENV)) {
  console.error('Root .env not found');
  process.exit(1);
}

const env = dotenv.parse(await Bun.file(ROOT_ENV).text());
const JWT_SECRET = env.JWT_SECRET?.trim();
if (!JWT_SECRET) {
  console.error('JWT_SECRET missing in root .env');
  process.exit(1);
}

type TestResult = { name: string; ok: boolean; status?: number; detail?: string };

const results: TestResult[] = [];

async function test(
  name: string,
  fn: () => Promise<{ ok: boolean; status?: number; detail?: string }>,
): Promise<void> {
  try {
    const result = await fn();
    results.push({ name, ...result });
    const icon = result.ok ? 'PASS' : 'FAIL';
    console.log(`[${icon}] ${name}${result.detail ? ` — ${result.detail}` : ''}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    results.push({ name, ok: false, detail });
    console.log(`[FAIL] ${name} — ${detail}`);
  }
}

async function request(
  method: string,
  path: string,
  options: {
    body?: unknown;
    token?: string;
    redirect?: RequestRedirect;
  } = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  return fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    redirect: options.redirect ?? 'manual',
  });
}

function jsonOk(status: number, body: unknown): { ok: boolean; status: number; detail?: string } {
  const ok = status >= 200 && status < 300;
  return {
    ok,
    status,
    detail: ok ? undefined : `HTTP ${status}: ${JSON.stringify(body).slice(0, 120)}`,
  };
}

const testEmail = `api-test-${Date.now()}@example.com`;
const testUserId = uuidv4();
let authToken = '';
let createdOrderId = '';

console.log(`\nAPI smoke tests → ${BASE_URL}\n`);

await test('GET / health', async () => {
  const res = await request('GET', '/');
  const body = await res.json();
  return jsonOk(res.status, body);
});

await test('GET /api/v1/supportedAssets', async () => {
  const res = await request('GET', '/api/v1/supportedAssets');
  const body = await res.json();
  const ok = res.ok && Array.isArray(body?.data);
  return { ok, status: res.status, detail: ok ? `${body.data.length} assets` : undefined };
});

await test('GET /api/v1/prices/latest', async () => {
  const res = await request('GET', '/api/v1/prices/latest');
  const body = await res.json();
  return jsonOk(res.status, body);
});

await test('GET /api/v1/candles', async () => {
  const res = await request('GET', '/api/v1/candles?symbol=BTCUSDT&interval=1m&limit=10');
  const body = await res.json();
  return jsonOk(res.status, body);
});

await test('GET /api/v1/candles/diagnostics', async () => {
  const res = await request('GET', '/api/v1/candles/diagnostics');
  const body = await res.json();
  return jsonOk(res.status, body);
});

await test('GET /api/v1/trade', async () => {
  const res = await request('GET', '/api/v1/trade');
  const body = await res.json();
  return jsonOk(res.status, body);
});

await test('POST /api/v1/auth/login', async () => {
  const res = await request('POST', '/api/v1/auth/login', {
    body: { email: testEmail },
  });
  const body = await res.json();
  return jsonOk(res.status, body);
});

authToken = jwt.sign({ userId: testUserId, email: testEmail }, JWT_SECRET);

await test('GET /api/v1/auth/verify', async () => {
  const res = await request('GET', `/api/v1/auth/verify?token=${encodeURIComponent(authToken)}`, {
    redirect: 'manual',
  });
  const ok = res.status === 302 || res.status === 200;
  return {
    ok,
    status: res.status,
    detail: ok ? `redirect=${res.headers.get('location') ?? 'text ok'}` : await res.text(),
  };
});

await test('POST /api/v1/auth/verify-user', async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await request('POST', '/api/v1/auth/verify-user', { token: authToken });
    const body = await res.json();
    if (res.ok) {
      return jsonOk(res.status, body);
    }
    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, 1000));
    } else {
      return jsonOk(res.status, body);
    }
  }
  return { ok: false, detail: 'unreachable' };
});

await test('POST /api/v1/auth/ensure-user', async () => {
  const res = await request('POST', '/api/v1/auth/ensure-user', { token: authToken });
  const body = await res.json();
  return jsonOk(res.status, body);
});

await test('GET /api/auth/get-session', async () => {
  const res = await request('GET', '/api/auth/get-session');
  const ok = res.status === 200;
  return { ok, status: res.status };
});

await test('GET /api/v1/balance', async () => {
  const res = await request('GET', '/api/v1/balance', { token: authToken });
  const body = await res.json();
  return jsonOk(res.status, body);
});

await test('POST /api/v1/trade/create', async () => {
  const res = await request('POST', '/api/v1/trade/create', {
    token: authToken,
    body: {
      symbol: 'BTC',
      type: 'buy',
      quantity: 0.001,
      leverage: 1,
    },
  });
  const body = await res.json();
  if (res.ok && body?.data?.orderId) {
    createdOrderId = body.data.orderId;
  } else if (res.ok && body?.data?.id) {
    createdOrderId = body.data.id;
  } else if (res.ok && typeof body?.data === 'object') {
    const data = body.data as Record<string, unknown>;
    createdOrderId = String(data.orderId ?? data.id ?? '');
  }
  return jsonOk(res.status, body);
});

await test('GET /api/v1/trade/open', async () => {
  const res = await request('GET', '/api/v1/trade/open', { token: authToken });
  const body = await res.json();
  return jsonOk(res.status, body);
});

if (createdOrderId) {
  await test('POST /api/v1/trade/close', async () => {
    const res = await request('POST', '/api/v1/trade/close', {
      token: authToken,
      body: { orderId: createdOrderId },
    });
    const body = await res.json();
    return jsonOk(res.status, body);
  });
} else {
  results.push({
    name: 'POST /api/v1/trade/close',
    ok: false,
    detail: 'skipped — no orderId from create',
  });
  console.log('[SKIP] POST /api/v1/trade/close — no orderId from create');
}

await test('GET /api/v1/trade/close', async () => {
  const res = await request('GET', '/api/v1/trade/close', { token: authToken });
  const body = await res.json();
  return jsonOk(res.status, body);
});

const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).length;

console.log(`\n${passed}/${results.length} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
