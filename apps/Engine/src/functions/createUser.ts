import { users } from "../data/users.js";
import { redisStreams, config, constant } from "@repo/config";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function createUserFunction(result: any) {
  let user = users.find(u => u.userEmail === result.userEmail);

  if (!user) {
    users.push({
      userId: result.userId,
      userEmail: result.userEmail,
      balance: 5000000, // Assuming a default balance for new users
    });

    await RedisStreams.addToRedisStream(
      constant.dbStorageStream,
      { function:"createUser", message: result }
    );

    await RedisStreams.addToRedisStream(
      constant.secondaryRedisStream,
      { function:"createUser", message: result.userId }
    );
    console.log(user, "user after creation");
    
  } else {
    await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { function:"createUser", message: "user Already Exist" }
    );
  }
}