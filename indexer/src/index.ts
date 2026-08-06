import { ponder } from "ponder:registry";
import { zeroAddress } from "viem";
import { CTOKEN_ABI } from "@comfy/config";
import {
  child,
  confidentialEvent,
  disclosure,
  factoryState,
  holding,
  operatorApproval,
  pendingDeposit,
  publicFlow,
} from "ponder:schema";
import { cfg } from "./lib/config.js";

const FACTORY_ROW = "factory";
const low = <T extends string>(a: T) => a.toLowerCase() as T;
const at = (e: any) => `${e.block.hash}-${e.log.logIndex}`;

ponder.on("WrapperFactory:WrapperCreated", async ({ event, context }) => {
  const address = low(event.args.ctoken);
  
  // Pinned to this block, and cached.
  const [name, symbol, decimals] = await Promise.all([
    context.client.readContract({ abi: CTOKEN_ABI, address, functionName: "name" }).catch(() => null),
    context.client.readContract({ abi: CTOKEN_ABI, address, functionName: "symbol" }).catch(() => null),
    context.client.readContract({ abi: CTOKEN_ABI, address, functionName: "decimals" }).catch(() => null),
  ]);

  await context.db
    .insert(child)
    .values({
      address,
      baseErc20: low(event.args.erc20),
      name: (name as string | null) ?? null,
      symbol: (symbol as string | null) ?? null,
      decimals: decimals == null ? null : Number(decimals),
      createdTx: event.transaction.hash,
      createdBlock: event.block.number,
    })
    .onConflictDoNothing();
});

async function setFactoryState(context: any, block: bigint, patch: Record<string, unknown>) {
  await context.db
    .insert(factoryState)
    .values({
      id: FACTORY_ROW,
      paused: false,
      blocklist: null,
      blocklistEnabled: false,
      implementation: null,
      updatedBlock: block,
      ...patch,
    })
    .onConflictDoUpdate({ ...patch, updatedBlock: block });
}

ponder.on("WrapperFactory:Paused", async ({ event, context }) => {
  await setFactoryState(context, event.block.number, { paused: true });
});

ponder.on("WrapperFactory:Unpaused", async ({ event, context }) => {
  await setFactoryState(context, event.block.number, { paused: false });
});

ponder.on("WrapperFactory:BlocklistUpdated", async ({ event, context }) => {
  await setFactoryState(context, event.block.number, { blocklist: low(event.args.blocklist) });
});

ponder.on("WrapperFactory:BlocklistEnabledSet", async ({ event, context }) => {
  await setFactoryState(context, event.block.number, { blocklistEnabled: event.args.enabled });
});

ponder.on("WrapperFactory:Upgraded", async ({ event, context }) => {
  await setFactoryState(context, event.block.number, {
    implementation: low(event.args.implementation),
  });
});

// Parked until the mint confirms it.
ponder.on("Underlying:Transfer", async ({ event, context }) => {
  await context.db
    .insert(pendingDeposit)
    .values({
      id: `${event.transaction.hash}-${low(event.log.address)}`,
      amount: event.args.value,
      blockHash: event.block.hash,
      logIndex: event.log.logIndex,
    })
    .onConflictDoNothing();
});

// Balance handle, read at this block.
async function touchHolding(
  context: any,
  ctoken: `0x${string}`,
  user: `0x${string}`,
  block: bigint,
) {
  const handle = await context.client
    .readContract({
      abi: CTOKEN_ABI,
      address: ctoken,
      functionName: "confidentialBalanceOf",
      args: [user],
    })
    .catch(() => null);

  await context.db
    .insert(holding)
    .values({
      child: ctoken,
      user,
      balanceHandle: (handle as `0x${string}` | null) ?? null,
      handleBlock: handle ? block : null,
      firstSeenBlock: block,
      lastActivityBlock: block,
    })
    .onConflictDoUpdate((row: any) => ({
      lastActivityBlock: row.lastActivityBlock > block ? row.lastActivityBlock : block,
      // Only overwrite with a newer read.
      ...(handle && (row.handleBlock == null || block >= row.handleBlock)
        ? { balanceHandle: handle, handleBlock: block }
        : {}),
    }));
}

ponder.on("CToken:ConfidentialTransfer", async ({ event, context }) => {
  const ctoken = low(event.log.address);
  const from = low(event.args.from);
  const to = low(event.args.to);

  await context.db.insert(confidentialEvent).values({
    id: at(event),
    child: ctoken,
    kind: "transfer",
    fromAddr: from,
    toAddr: to,
    handle: event.args.amount,
    blockNumber: event.block.number,
    blockHash: event.block.hash,
    logIndex: event.log.logIndex,
    txHash: event.transaction.hash,
    blockTime: event.block.timestamp,
  });

  // A mint is a wrap.
  if (from === zeroAddress) {
    const row = await context.db.find(child, { address: ctoken });
    const key = row ? `${event.transaction.hash}-${row.baseErc20}` : null;
    const deposit = key ? await context.db.find(pendingDeposit, { id: key }) : null;

    await context.db.insert(publicFlow).values({
      id: at(event),
      child: ctoken,
      kind: "wrap",
      account: to,
      amount: deposit?.amount ?? null,
      successHandle: null,
      blockNumber: event.block.number,
      blockHash: event.block.hash,
      logIndex: event.log.logIndex,
      txHash: event.transaction.hash,
      blockTime: event.block.timestamp,
    }).onConflictDoNothing();

    if (key && deposit) await context.db.delete(pendingDeposit, { id: key });
  }

  for (const user of [from, to]) {
    if (user !== zeroAddress) await touchHolding(context, ctoken, user, event.block.number);
  }
});

ponder.on("CToken:Unwrapped", async ({ event, context }) => {
  await context.db.insert(publicFlow).values({
    id: at(event),
    child: low(event.log.address),
    kind: "unwrap",
    account: low(event.args.from),
    amount: event.args.amount,
    successHandle: null,
    blockNumber: event.block.number,
    blockHash: event.block.hash,
    logIndex: event.log.logIndex,
    txHash: event.transaction.hash,
    blockTime: event.block.timestamp,
  });
});

ponder.on("CToken:Burn", async ({ event, context }) => {
  // `value` is requested, not settled.
  await context.db.insert(publicFlow).values({
    id: at(event),
    child: low(event.log.address),
    kind: "burn",
    account: low(event.args.from),
    amount: event.args.value,
    successHandle: event.args.success,
    blockNumber: event.block.number,
    blockHash: event.block.hash,
    logIndex: event.log.logIndex,
    txHash: event.transaction.hash,
    blockTime: event.block.timestamp,
  });
});

ponder.on("CToken:AmountDisclosed", async ({ event, context }) => {
  await context.db.insert(disclosure).values({
    id: at(event),
    child: low(event.log.address),
    handle: event.args.encryptedAmount,
    amount: event.args.amount,
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
    blockTime: event.block.timestamp,
  });
});

ponder.on("CToken:OperatorSet", async ({ event, context }) => {
  const values = {
    child: low(event.log.address),
    holder: low(event.args.holder),
    operator: low(event.args.operator),
    until: BigInt(event.args.until),
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
    blockTime: event.block.timestamp,
  };
  await context.db.insert(operatorApproval).values(values).onConflictDoUpdate({
    until: values.until,
    blockNumber: values.blockNumber,
    txHash: values.txHash,
    blockTime: values.blockTime,
  });
});

export const VAULT = cfg.vault;
