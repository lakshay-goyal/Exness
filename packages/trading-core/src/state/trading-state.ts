import type { ClosedOrder, OpenOrder, PriceUpdate, TradingUser } from '@repo/types';

const initialUsers: TradingUser[] = [
  {
    userId: '5a2b9cb1-35cc-4b8b-ab93-44102f06c458',
    userEmail: 'lakshaygoyal201@gmail.com',
    balance: 500000,
  },
];

const initialOpenOrders: OpenOrder[] = [
  {
    userId: '5a2b9cb1-35cc-4b8b-ab93-44102f06c458',
    orderId: 'order_98766',
    symbol: 'btc',
    type: 'buy',
    quantity: 0.8,
    leverage: 10,
    openPrice: 60000,
    openTime: new Date(),
  },
  {
    userId: 'ab5c1292-530d-41ac-bfbf-e49faf01ac4d',
    orderId: 'order_98767',
    symbol: 'btc',
    type: 'buy',
    quantity: 0.4,
    leverage: 10,
    openPrice: 60000,
    openTime: new Date(),
  },
];

export class TradingStateStore {
  readonly users: TradingUser[];
  readonly openOrders: OpenOrder[];
  readonly closeOrders: ClosedOrder[];
  readonly prices: PriceUpdate[];

  constructor(state?: {
    users?: TradingUser[];
    openOrders?: OpenOrder[];
    closeOrders?: ClosedOrder[];
    prices?: PriceUpdate[];
  }) {
    const {
      users: usersParam,
      openOrders: openOrdersParam,
      closeOrders: closeOrdersParam,
      prices: pricesParam,
    } = state ?? {};
    this.users = usersParam ?? [...initialUsers];
    this.openOrders = openOrdersParam ?? [...initialOpenOrders];
    this.closeOrders = closeOrdersParam ?? [];
    this.prices = pricesParam ?? [];
  }

  findUser(userId: string): TradingUser | undefined {
    return this.users.find((user) => user.userId === userId);
  }

  hasUser(userId: string): boolean {
    return this.users.some((user) => user.userId === userId);
  }
}

const tradingState = new TradingStateStore();

export const {users} = tradingState;
export const {openOrders} = tradingState;
export const {closeOrders} = tradingState;
export const {prices} = tradingState;
