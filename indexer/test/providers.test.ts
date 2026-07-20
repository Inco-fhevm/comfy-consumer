import { describe, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { alchemy } from "../src/providers/alchemy.js";
import { quicknode } from "../src/providers/quicknode.js";

describe("alchemy provider", () => {
  const secret = "alchemy-secret";
  const body = Buffer.from(JSON.stringify({ hi: 1 }));
  const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");

  test("verify: accepts a correct signature, rejects bad/missing", () => {
    assert.equal(alchemy.verify(body, { "x-alchemy-signature": sig }, secret), true);
    assert.equal(alchemy.verify(body, { "x-alchemy-signature": "bad" }, secret), false);
    assert.equal(alchemy.verify(body, {}, secret), false);
  });

  test("extractLogs: maps the GraphQL block payload", () => {
    const [log] = alchemy.extractLogs({
      event: { data: { block: {
        number: 100, hash: "0xblockhash",
        logs: [{
          account: { address: "0xAAA0000000000000000000000000000000000001" },
          topics: ["0xtopic0", "0xtopic1"], data: "0xdead", index: 5,
          transaction: { hash: "0xtxhash" },
        }],
      } } },
    });
    assert.equal(log.address, "0xaaa0000000000000000000000000000000000001");
    assert.equal(log.topic0, "0xtopic0");
    assert.equal(log.blockNumber, 100n);
    assert.equal(log.blockHash, "0xblockhash");
    assert.equal(log.logIndex, 5);
    assert.equal(log.txHash, "0xtxhash");
  });

  test("extractLogs: [] for empty or malformed payloads", () => {
    assert.deepEqual(alchemy.extractLogs({}), []);
    assert.deepEqual(alchemy.extractLogs({ event: { data: { block: {} } } }), []);
  });
});

describe("quicknode provider", () => {
  const secret = "qn-secret";
  const body = Buffer.from(JSON.stringify([{ a: 1 }]));
  const nonce = "n1";
  const ts = "1700000000";
  const sig = crypto.createHmac("sha256", secret).update(nonce + ts + body.toString()).digest("hex");

  test("verify: accepts nonce+timestamp+body signature, rejects bad/missing", () => {
    const good = { "x-qn-nonce": nonce, "x-qn-timestamp": ts, "x-qn-signature": sig };
    assert.equal(quicknode.verify(body, good, secret), true);
    assert.equal(quicknode.verify(body, { ...good, "x-qn-signature": "bad" }, secret), false);
    assert.equal(quicknode.verify(body, { "x-qn-signature": sig }, secret), false); // missing nonce/ts
  });

  test("extractLogs: maps a flat eth_getLogs-style list", () => {
    const [log] = quicknode.extractLogs([{
      address: "0xBBB0000000000000000000000000000000000002",
      topics: ["0xt0", "0xt1"], data: "0xbeef",
      blockNumber: "0x64", blockHash: "0xbh", logIndex: "0x2", transactionHash: "0xtx",
    }]);
    assert.equal(log.address, "0xbbb0000000000000000000000000000000000002");
    assert.equal(log.topic0, "0xt0");
    assert.equal(log.blockNumber, 100n);
    assert.equal(log.logIndex, 2);
    assert.equal(log.txHash, "0xtx");
  });

  test("extractLogs: reads {logs} / {data} wrappers, [] when empty", () => {
    const one = { address: "0x1", topics: ["0x0"], data: "0x", blockNumber: "0x1", blockHash: "0xh", logIndex: "0x0", transactionHash: "0xt" };
    assert.equal(quicknode.extractLogs({ logs: [one] }).length, 1);
    assert.equal(quicknode.extractLogs({ data: [one] }).length, 1);
    assert.deepEqual(quicknode.extractLogs({}), []);
  });
});
