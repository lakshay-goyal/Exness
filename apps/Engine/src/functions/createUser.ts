import { users } from "../data/users.js";
import { redisStreams, config, constant } from "@repo/config";

const INITIAL_USER_BALANCE = 500000;

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function createUserFunction(result: any) {
  console.log("createUserFunction called with:", result);
  
  let user = users.find(u => u.userId === result.userId || u.userEmail === result.userEmail);
  console.log("Existing users:", users);
  console.log("Looking for user with userId:", result.userId, "email:", result.userEmail);

  if (!user) {
    const newUser = {
      userId: result.userId,
      userEmail: result.userEmail,
      balance: INITIAL_USER_BALANCE,
    };
    
    users.push(newUser);
    console.log("Added new user to in-memory array:", newUser);
    console.log("Updated users array:", users);
  } else {
    if (user.userId !== result.userId) {
      user.userId = result.userId;
      console.log("Updated user userId in memory:", user);
    }
    if (user.userEmail !== result.userEmail) {
      user.userEmail = result.userEmail;
      console.log("Updated user email in memory:", user);
    }
    console.log("User already exists in memory:", user);
  }

  await RedisStreams.addToRedisStream(
    constant.dbStorageStream,
    { function:"createUser", message: result }
  );
  console.log("Sent message to dbStorageStream for user:", result.userId);

  await RedisStreams.addToRedisStream(
    constant.secondaryRedisStream,
    { 
      function:"createUser", 
      message: result.userId,
      requestId: result.requestId || result.correlationId, // Pass through correlation ID
      correlationId: result.requestId || result.correlationId
    }
  );
  console.log("Sent response to secondaryRedisStream");
}
