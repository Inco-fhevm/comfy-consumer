import { describe, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { encodeEventTopics, encodeAbiParameters } from "viem";
import { CTOKEN_ABI, WRAPPER_FACTORY_ABI } from "@comfy/config";
import {
  decode, classify, fromRpcLog, verifyHmac, jsonify, WATCHED_EVENTS, WATCHED_TOPIC0S, transferWallets, ZERO_ADDRESS,
} from "../src/codec.js";

// Build a real log the way the chain would: indexed args → topics, the rest → data.
function makeLog(abi: any, eventName: string, args: Record<string, any>) {
  const topics = encodeEventTopics({ abi, eventName, args });
  const event = abi.find((i: any) => i.type === "event" && i.name === eventName);
  const nonIndexed = event.inputs.filter((i: any) => !i.indexed);
  const data = nonIndexed.length
    ? encodeAbiParameters(nonIndexed, nonIndexed.map((i: any) => args[i.name]))
    : "0x";
  return { topics, data };
}

// sample actors (lowercase so checksum→lowercase round-trips cleanly)
const erc20 = "0x1111111111111111111111111111111111111111";
const ctoken = "0x2222222222222222222222222222222222222222";
const from = "0x5555555555555555555555555555555555555555";
const to = "0x6666666666666666666666666666666666666666";
const HANDLE = ("0x" + "ab".repeat(32)) as `0x${string}`; // an euint256 handle (bytes32)

// encode a real log, then run it through the pipeline
const roundtrip = (abi: any, eventName: string, args: Record<string, any>) => {
  const { topics, data } = makeLog(abi, eventName, args);
  const decoded = decode({ topics: topics as any, data: data as any });
  return { decoded, classified: classify(decoded.eventName, decoded.args) };
};

describe("WATCHED_EVENTS", () => {
  test("watches exactly the factory + ctoken events we index", () => {
    assert.deepEqual(
      WATCHED_EVENTS.map((e) => e.name).sort(),
      ["Burn", "ConfidentialTransfer", "Unwrapped", "WrapperCreated"],
    );
  });
  test("does not watch OperatorSet", () => {
    assert.ok(!WATCHED_EVENTS.some((e) => e.name === "OperatorSet"));
  });
  test("WATCHED_TOPIC0S is 4 valid topic0s (reconciler revert filter)", () => {
    assert.equal(WATCHED_TOPIC0S.length, 4);
    assert.ok(WATCHED_TOPIC0S.every((t) => /^0x[0-9a-f]{64}$/.test(t)));
  });
});

describe("decode + classify", () => {
  test("WrapperCreated → wrapper (erc20, ctoken), lowercased", () => {
    const { decoded, classified } = roundtrip(WRAPPER_FACTORY_ABI, "WrapperCreated", { erc20, ctoken });
    assert.equal(decoded.eventName, "WrapperCreated");
    assert.equal(classified.kind, "wrapper");
    if (classified.kind !== "wrapper") return;
    assert.equal(classified.ctoken, ctoken);
    assert.equal(classified.erc20, erc20);
  });

  test("Unwrapped → public unwrap with a plaintext amount", () => {
    const { classified } = roundtrip(CTOKEN_ABI, "Unwrapped", { from, to, amount: 1_000_000n });
    assert.equal(classified.kind, "public");
    if (classified.kind !== "public") return;
    assert.equal(classified.event, "unwrap");
    assert.equal(classified.account, from);
    assert.equal(classified.amount, "1000000");
  });

  test("Burn → public burn with a plaintext value", () => {
    const { classified } = roundtrip(CTOKEN_ABI, "Burn", { from, value: 42n, success: HANDLE });
    assert.equal(classified.kind, "public");
    if (classified.kind !== "public") return;
    assert.equal(classified.event, "burn");
    assert.equal(classified.account, from);
    assert.equal(classified.amount, "42");
  });

  test("ConfidentialTransfer → confidential, handle is a bytes32 (never an amount)", () => {
    const { classified } = roundtrip(CTOKEN_ABI, "ConfidentialTransfer", { from, to, amount: HANDLE });
    assert.equal(classified.kind, "confidential");
    if (classified.kind !== "confidential") return;
    assert.equal(classified.event, "transfer");
    assert.equal(classified.from, from);
    assert.equal(classified.to, to);
    assert.equal(classified.handle, HANDLE);
    assert.match(classified.handle, /^0x[0-9a-f]{64}$/); // the privacy invariant, asserted
  });

  test("OperatorSet → ignore (not misrouted)", () => {
    const { classified } = roundtrip(CTOKEN_ABI, "OperatorSet", { holder: from, operator: to, until: 0n });
    assert.equal(classified.kind, "ignore");
  });

  test("unknown topic0 → empty name → ignore (never throws)", () => {
    const bogus = "0x84c3f3cbb457e5840ed22756e9582d147401317fb96949bb6a9f208af5afbe33";
    const { eventName, args } = decode({ topics: [bogus] as any, data: "0x" });
    assert.equal(eventName, "");
    assert.equal(classify(eventName, args).kind, "ignore");
  });
});

describe("fromRpcLog", () => {
  test("lowercases the emitter and maps fields", () => {
    const n = fromRpcLog({
      address: "0xAbCdEf0000000000000000000000000000000001",
      topics: ["0xaaa", "0xbbb"] as any,
      data: "0x",
      blockNumber: 42n,
      blockHash: "0xblock",
      logIndex: 3,
      transactionHash: "0xtx",
    });
    assert.equal(n.address, "0xabcdef0000000000000000000000000000000001");
    assert.equal(n.topic0, "0xaaa");
    assert.equal(n.blockNumber, 42n);
    assert.equal(n.logIndex, 3);
    assert.equal(n.txHash, "0xtx");
  });

  test("defaults nulls (pending log) safely", () => {
    const n = fromRpcLog({
      address: "0x00", topics: ["0xaaa"] as any, data: "0x",
      blockNumber: null, blockHash: null, logIndex: null, transactionHash: null,
    });
    assert.equal(n.blockNumber, 0n);
    assert.equal(n.logIndex, 0);
  });
});

describe("transferWallets", () => {
  test("wrap (from 0x0) → recipient only", () => assert.deepEqual(transferWallets(ZERO_ADDRESS, to), [to]));
  test("unwrap/burn (to 0x0) → sender only", () => assert.deepEqual(transferWallets(from, ZERO_ADDRESS), [from]));
  test("transfer → both parties", () => assert.deepEqual(transferWallets(from, to), [from, to]));
  test("both zero → none", () => assert.deepEqual(transferWallets(ZERO_ADDRESS, ZERO_ADDRESS), []));
});

describe("verifyHmac", () => {
  const key = "topsecret";
  const body = Buffer.from(JSON.stringify({ a: 1 }));
  const sig = crypto.createHmac("sha256", key).update(body).digest("hex");

  test("accepts a correctly signed body", () => assert.equal(verifyHmac(body, sig, key), true));
  test("rejects a wrong key", () => assert.equal(verifyHmac(body, sig, "wrongkey"), false));
  test("rejects a tampered body", () => assert.equal(verifyHmac(Buffer.from("tampered"), sig, key), false));
  test("rejects empty / wrong-length signatures without throwing", () => {
    assert.equal(verifyHmac(body, "", key), false);
    assert.equal(verifyHmac(body, "deadbeef", key), false);
  });
});

describe("jsonify", () => {
  test("serializes bigints as strings", () => {
    assert.equal(jsonify({ n: 10n, s: "x", arr: [1n, 2n] }), '{"n":"10","s":"x","arr":["1","2"]}');
  });
});
