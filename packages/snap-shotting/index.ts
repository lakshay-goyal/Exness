import { MongoClient, Db, Collection } from "mongodb";
import { config } from "@repo/config";
import { users } from "../../apps/Engine/src/data/users.js";
import { openOrders } from "../../apps/Engine/src/data/orders.js";

let client: MongoClient | null = null;
let db: Db | null = null;

const USERS_COLLECTION = "users";
const ORDERS_COLLECTION = "orders";

async function connectToMongoDB(): Promise<void> {
  try {
    if (!client) {
      client = new MongoClient(config.MONGODB_URL);
      await client.connect();
      db = client.db("exness_snapshots");
      console.log("Connected to MongoDB");
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

function getCollections(): { usersCollection: Collection; ordersCollection: Collection } {
  if (!db) {
    throw new Error("Database not connected. Call connectToMongoDB() first.");
  }
  return {
    usersCollection: db.collection(USERS_COLLECTION),
    ordersCollection: db.collection(ORDERS_COLLECTION),
  };
}

async function clearMongoDBData(): Promise<void> {
  try {
    const { usersCollection, ordersCollection } = getCollections();
    
    await Promise.all([
      usersCollection.deleteMany({}),
      ordersCollection.deleteMany({}),
    ]);
    
    console.log("Cleared all data from MongoDB collections");
  } catch (error) {
    console.error("Error clearing MongoDB data:", error);
    throw error;
  }
}

async function dumpDataToMongoDB(): Promise<void> {
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
      console.log(`Inserted ${usersData.length} users into MongoDB`);
    } else {
      console.log("No users to insert");
    }
    
    if (ordersData.length > 0) {
      await ordersCollection.insertMany(ordersData);
      console.log(`Inserted ${ordersData.length} orders into MongoDB`);
    } else {
      console.log("No orders to insert");
    }
    
    console.log(`Snapshot completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("Error dumping data to MongoDB:", error);
    throw error;
  }
}

async function performSnapshot(): Promise<void> {
  try {
    console.log(`\nStarting snapshot at ${new Date().toISOString()}`);
    
    await clearMongoDBData();
    
    await dumpDataToMongoDB();
    
    console.log("Snapshot completed successfully\n");
  } catch (error) {
    console.error("Error performing snapshot:", error);
  }
}

async function main() {
  try {
    await connectToMongoDB();
    
    console.log("Starting snapshotting service...");
    await performSnapshot();
    
    const SNAPSHOT_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
    
    setInterval(async () => {
      await performSnapshot();
    }, SNAPSHOT_INTERVAL_MS);
    
    console.log(`Snapshotting service running. Next snapshot in 10 minutes...`);
    
    process.on("SIGINT", async () => {
      console.log("\nShutting down snapshotting service...");
      if (client) {
        await client.close();
        console.log("MongoDB connection closed");
      }
      process.exit(0);
    });
    
    process.on("SIGTERM", async () => {
      console.log("\nShutting down snapshotting service...");
      if (client) {
        await client.close();
        console.log("MongoDB connection closed");
      }
      process.exit(0);
    });
  } catch (error) {
    console.error("Fatal error in snapshotting service:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
