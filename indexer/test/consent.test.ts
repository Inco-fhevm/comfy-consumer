import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { privateKeyToAccount } from "viem/accounts";
import { termsMessage } from "@comfy/config";
import { verifyConsent } from "../src/lib/consent.js";

const account = privateKeyToAccount(("0x" + "1".repeat(64)) as `0x${string}`);
const other = privateKeyToAccount(("0x" + "2".repeat(64)) as `0x${string}`);
const signedAt = 1700000000;

async function sign(addr: string, at: number) {
  return account.signMessage({ message: termsMessage({ address: addr, signedAt: at }) });
}

describe("verifyConsent", () => {
  test("accepts a correctly signed acceptance", async () => {
    const signature = await sign(account.address, signedAt);
    const res = await verifyConsent({ address: account.address, signedAt, signature });
    assert.equal(res.ok, true);
  });

  test("accepts regardless of address casing", async () => {
    const signature = await sign(account.address, signedAt);
    const res = await verifyConsent({ address: account.address.toUpperCase(), signedAt, signature });
    assert.equal(res.ok, true);
  });

  test("rejects a tampered timestamp", async () => {
    const signature = await sign(account.address, signedAt);
    const res = await verifyConsent({ address: account.address, signedAt: signedAt + 1, signature });
    assert.equal(res.ok, false);
  });

  test("rejects consent claimed for another address", async () => {
    const signature = await sign(account.address, signedAt);
    const res = await verifyConsent({ address: other.address, signedAt, signature });
    assert.equal(res.ok, false);
  });

  test("rejects a garbage signature without throwing", async () => {
    const res = await verifyConsent({ address: account.address, signedAt, signature: "0xdead" });
    assert.equal(res.ok, false);
  });
});
