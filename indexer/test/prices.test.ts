import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  chunk,
  coinKeys,
  buildUrl,
  parsePriceResponse,
  fetchPrices,
  type FetchLike,
} from "../src/prices/defillama.js";

describe("chunk", () => {
  test("splits into fixed-size groups, last group short", () => {
    assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  });
  test("exact multiple, single group, empty", () => {
    assert.deepEqual(chunk([1, 2, 3, 4], 2), [[1, 2], [3, 4]]);
    assert.deepEqual(chunk([1, 2], 5), [[1, 2]]);
    assert.deepEqual(chunk([], 10), []);
  });
  test("throws on non-positive size", () => {
    assert.throws(() => chunk([1], 0));
  });
});

describe("coinKeys", () => {
  test("lowercases, dedupes (case-insensitive), preserves order, prefixes slug", () => {
    assert.deepEqual(
      coinKeys(["0xAB", "0xab", "0xCD"], "base"),
      ["base:0xab", "base:0xcd"],
    );
  });
  test("drops empty entries", () => {
    assert.deepEqual(coinKeys(["", "0x01"], "base"), ["base:0x01"]);
  });
});

describe("buildUrl", () => {
  test("joins coin keys onto the current-prices path", () => {
    assert.equal(
      buildUrl(["base:0x1", "base:0x2"]),
      "https://coins.llama.fi/prices/current/base:0x1,base:0x2",
    );
  });
});

describe("parsePriceResponse", () => {
  const slug = "base";
  const sample = {
    coins: {
      "base:0x833589FCD6EDB6E08F4C7C32D4F71B54BDA02913": {
        decimals: 6, symbol: "USDC", price: 0.999949, timestamp: 1784884666, confidence: 0.99,
      },
      "base:0x4200000000000000000000000000000000000006": {
        decimals: 18, symbol: "WETH", price: 1881.6, timestamp: 1784884684, confidence: 0.99,
      },
    },
  };

  test("extracts, lowercases the address, keeps usd/confidence/symbol/decimals", () => {
    const quotes = parsePriceResponse(sample, slug);
    assert.equal(quotes.length, 2);
    const usdc = quotes.find((q) => q.symbol === "USDC")!;
    assert.equal(usdc.token, "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"); // lowercased
    assert.equal(usdc.usd, 0.999949);
    assert.equal(usdc.confidence, 0.99);
    assert.equal(usdc.decimals, 6);
    assert.equal(usdc.observedAt, 1784884666);
  });

  test("ignores wrong-chain keys", () => {
    const quotes = parsePriceResponse(
      { coins: { "ethereum:0xabc": { price: 5 }, "base:0xdef": { price: 7 } } },
      slug,
    );
    assert.equal(quotes.length, 1);
    assert.equal(quotes[0].token, "0xdef");
  });

  test("skips entries with a missing / non-numeric price", () => {
    const quotes = parsePriceResponse(
      { coins: { "base:0x1": {}, "base:0x2": { price: "not-a-number" }, "base:0x3": { price: 3 } } },
      slug,
    );
    assert.deepEqual(quotes.map((q) => q.token), ["0x3"]);
  });

  test("null confidence/decimals when absent", () => {
    const [q] = parsePriceResponse({ coins: { "base:0x9": { price: 1 } } }, slug);
    assert.equal(q.confidence, null);
    assert.equal(q.decimals, null);
    assert.equal(q.observedAt, null);
  });

  test("[] for malformed payloads", () => {
    assert.deepEqual(parsePriceResponse({}, slug), []);
    assert.deepEqual(parsePriceResponse(null, slug), []);
    assert.deepEqual(parsePriceResponse({ coins: "nope" }, slug), []);
  });
});

// Fake fetch: answers from a { address -> price } map, records the URLs hit.
function fakeFetch(priceByAddr: Record<string, number>) {
  const calls: string[] = [];
  const impl: FetchLike = async (url) => {
    calls.push(url);
    const coinsPart = url.split("/current/")[1] ?? "";
    const coins: Record<string, unknown> = {};
    for (const key of coinsPart.split(",")) {
      const addr = key.split(":")[1];
      if (addr && priceByAddr[addr] != null) {
        coins[key] = { price: priceByAddr[addr], confidence: 0.99, symbol: "TKN", decimals: 6, timestamp: 1 };
      }
    }
    return { ok: true, status: 200, json: async () => ({ coins }) };
  };
  return { impl, calls };
}

describe("fetchPrices", () => {
  test("no upstream call for empty address list", async () => {
    const { impl, calls } = fakeFetch({});
    const quotes = await fetchPrices([], { fetchImpl: impl });
    assert.deepEqual(quotes, []);
    assert.equal(calls.length, 0);
  });

  test("defaults to the base-mainnet slug", async () => {
    const { impl, calls } = fakeFetch({ "0xaaa": 1 });
    await fetchPrices(["0xaaa"], { fetchImpl: impl });
    assert.equal(calls.length, 1);
    assert.match(calls[0], /current\/base:0xaaa$/);
  });

  test("batches by chunkSize and merges results", async () => {
    const { impl, calls } = fakeFetch({ "0xaaa": 1.0, "0xbbb": 2500 });
    const quotes = await fetchPrices(["0xAAA", "0xBBB"], { fetchImpl: impl, chunkSize: 1 });
    assert.equal(calls.length, 2); // one request per address
    assert.equal(quotes.length, 2);
    const byToken = Object.fromEntries(quotes.map((q) => [q.token, q.usd]));
    assert.equal(byToken["0xaaa"], 1.0);
    assert.equal(byToken["0xbbb"], 2500);
  });

  test("one batch in a single request when it fits", async () => {
    const { impl, calls } = fakeFetch({ "0xaaa": 1, "0xbbb": 2 });
    const quotes = await fetchPrices(["0xaaa", "0xbbb"], { fetchImpl: impl });
    assert.equal(calls.length, 1);
    assert.equal(quotes.length, 2);
  });

  test("partial failure: a bad batch never wipes the good ones", async () => {
    const impl: FetchLike = async (url) => {
      if (url.includes("0xbad")) return { ok: false, status: 500, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ coins: { "base:0xgood": { price: 5 } } }) };
    };
    const quotes = await fetchPrices(["0xgood", "0xbad"], { fetchImpl: impl, chunkSize: 1 });
    assert.equal(quotes.length, 1);
    assert.equal(quotes[0].token, "0xgood");
    assert.equal(quotes[0].usd, 5);
  });

  test("a throwing fetch is contained (returns [])", async () => {
    const impl: FetchLike = async () => { throw new Error("network down"); };
    const quotes = await fetchPrices(["0xaaa"], { fetchImpl: impl });
    assert.deepEqual(quotes, []);
  });
});
