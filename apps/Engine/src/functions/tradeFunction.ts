import { config } from "@repo/config";
import { createUserFunction } from "./createUser.js";
import { createOrderFunction } from "./createOrder.js";
import { getOpenOrderFunction } from "./getOpenOrder.js";
import { getCloseOrdersFunction } from "./getCloseOrders.js";
import { createCloseOrderFunction } from "./createCloseOrder.js";
import { pricePollerFunction } from "./pricePoller.js";


export async function tradeFunction(result: any) {
  console.log("tradeFunction received:", result);
  console.log("Function type:", result.function);

  if (result.function === "createCloseOrder") {
    console.log("Calling createCloseOrderFunction");
    await createCloseOrderFunction(result);
  }
  if (result.function === "createUser") {
    console.log("Calling createUserFunction");
    await createUserFunction(result);
  }
  if (result.function === "createOrder") {
    await createOrderFunction(result);
  }
  if (result.function === "getOpenOrder") {
    await getOpenOrderFunction(result);
  }
  if (result.function === "getCloseOrders") {
    await getCloseOrdersFunction(result);
  }
  if (result.function === "pricePoller") {
    await pricePollerFunction(result);
  }

}
