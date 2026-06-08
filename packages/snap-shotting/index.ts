import { MongoClient, type Db, type Collection } from 'mongodb';
import { config } from '@repo/config';
import { openOrders, users } from '@repo/trading-core/state';

let client: MongoClient | null = null;
let db: Db | null = null;

const USERS_COLLECTION = 'users';
const ORDERS_COLLECTION = 'orders';

const connectToMongoDB = async (): Promise<void> => {
  try {
    if (client === null) {
      client = new MongoClient(config.MONGODB_URL);
      await client.connect();
      db = client.db('exness_snapshots');
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

interface CollectionsResult {
  usersCollection: Collection;
  ordersCollection: Collection;
}

const getCollections = (): CollectionsResult => {
  if (db === null) {
    throw new Error('Database not connected. Call connectToMongoDB() first.');
  }
  return {
    usersCollection: db.collection(USERS_COLLECTION),
    ordersCollection: db.collection(ORDERS_COLLECTION),
  };
};

const clearMongoDBData = async (): Promise<void> => {
  try {
    const { usersCollection, ordersCollection } = getCollections();

    await Promise.all([usersCollection.deleteMany({}), ordersCollection.deleteMany({})]);
  } catch (error) {
    console.error('Error clearing MongoDB data:', error);
    throw error;
  }
};

const dumpDataToMongoDB = async (): Promise<void> => {
  try {
    const { usersCollection, ordersCollection } = getCollections();

    const usersData = users.map((user) => ({
      userId: user.userId,
      userEmail: user.userEmail,
      balance: user.balance,
      snapshotTime: new Date(),
    }));

    const ordersData = openOrders.map((order) => ({
      userId: order.userId,
      orderId: order.orderId,
      symbol: order.symbol,
      type: order.type,
      quantity: order.quantity,
      leverage: order.leverage,
      takeProfit: order.takeProfit ?? null,
      stopLoss: order.stopLoss ?? null,
      stippage: order.stippage ?? null,
      openPrice: order.openPrice,
      openTime: order.openTime,
      snapshotTime: new Date(),
    }));

    if (usersData.length > 0) {
      await usersCollection.insertMany(usersData);
    }

    if (ordersData.length > 0) {
      await ordersCollection.insertMany(ordersData);
    }
  } catch (error) {
    console.error('Error dumping data to MongoDB:', error);
    throw error;
  }
};

const performSnapshot = async (): Promise<void> => {
  try {
    await clearMongoDBData();

    await dumpDataToMongoDB();
  } catch (error) {
    console.error('Error performing snapshot:', error);
  }
};

const main = async (): Promise<void> => {
  try {
    await connectToMongoDB();

    await performSnapshot();

    const SNAPSHOT_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

    setInterval(() => {
      performSnapshot().catch((error: unknown) => {
        console.error('Error performing snapshot:', error);
      });
    }, SNAPSHOT_INTERVAL_MS);

    process.on('SIGINT', () => {
      (async (): Promise<void> => {
        if (client !== null) {
          await client.close();
        }
        process.exit(0);
      })().catch((error: unknown) => {
        console.error('Error handling SIGINT:', error);
        process.exit(1);
      });
    });

    process.on('SIGTERM', () => {
      (async (): Promise<void> => {
        if (client !== null) {
          await client.close();
        }
        process.exit(0);
      })().catch((error: unknown) => {
        console.error('Error handling SIGTERM:', error);
        process.exit(1);
      });
    });
  } catch (error) {
    console.error('Fatal error in snapshotting service:', error);
    process.exit(1);
  }
};

main().catch((error: unknown) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
