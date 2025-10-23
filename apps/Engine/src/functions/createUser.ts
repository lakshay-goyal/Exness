import { users } from "../data/users.js";
import { redisStreams, config, constant } from "@repo/config";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function createUserFunction(result: any) {
  console.log("createUserFunction called with:", result);
  
  let user = users.find(u => u.userEmail === result.userEmail);
  console.log("Existing users:", users);
  console.log("Looking for user with email:", result.userEmail);

  if (!user) {
    const newUser = {
      userId: result.userId,
      userEmail: result.userEmail,
      balance: 5000000, // Assuming a default balance for new users
    };
    
    users.push(newUser);
    console.log("Added new user to in-memory array:", newUser);
    console.log("Updated users array:", users);

    await RedisStreams.addToRedisStream(
      constant.dbStorageStream,
      { function:"createUser", message: result }
    );
    console.log("Sent message to dbStorageStream");

    await RedisStreams.addToRedisStream(
      constant.secondaryRedisStream,
      { function:"createUser", message: result.userId }
    );
    console.log("Sent response to secondaryRedisStream");
    
  } else {
    console.log("User already exists:", user);
    await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { function:"createUser", message: "user Already Exist" }
    );
  }
}