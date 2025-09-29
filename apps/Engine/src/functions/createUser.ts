import { users } from "../data/users.js";
import { redisStreams, config, constant } from "@repo/config";
import { prisma } from "@repo/db";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

export async function createUserFunction(result: any) {
  // Check if a user with the same email already exists in the database
  let user = await prisma.user.findUnique({
    where: {
      email: result.userEmail, // Map userEmail to email
    },
  });

  if (!user) {
    // If no user exists, create a new user in the database
    user = await prisma.user.create({
      data: {
        userID: result.userId,
        email: result.userEmail, // Map userEmail to email
      },
    });

    // Append to in-memory users array
    users.push({
      userId: user.userID,
      userEmail: user.email,
      balance: 5000000, // Assuming a default balance for new users
    });

    await RedisStreams.addToRedisStream(
      constant.secondaryRedisStream,
      { function:"createUser", message: user.userID } // Use user.id as userId is autoincrementing
    );
    console.log(user, "user after creation");
    
  } else {
    await RedisStreams.addToRedisStream(
        constant.secondaryRedisStream,
        { function:"createUser", message: "user Already Exist" } // Use user.id
    );
  }
}