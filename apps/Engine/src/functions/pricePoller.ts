import { prices, type Prices } from "../data/price.js";

function updatePrices(newData: Prices[]) {
  newData.forEach((item) => {
    const index = prices.findIndex((p) => p.asset === item.asset);
    if (index !== -1) {
      prices[index] = item;
    } else {
      prices.push(item);
    }
  });
}

export function pricePollerFunction(payload: any) {

  const results: Prices[] = JSON.parse(payload.message);
  updatePrices(results);
  // console.log("Updated prices:", prices);
}
