import { index, onchainTable, primaryKey } from "ponder";

export const child = onchainTable("child", (t) => ({
  address: t.hex().primaryKey(),
  baseErc20: t.hex().notNull(),
  name: t.text(),
  symbol: t.text(),
  decimals: t.integer(),
  createdTx: t.hex().notNull(),
  createdBlock: t.bigint().notNull(),
}));

export const publicFlow = onchainTable(
  "public_flow",
  (t) => ({
    id: t.text().primaryKey(), // `${blockHash}-${logIndex}`
    child: t.hex().notNull(),
    kind: t.text().notNull(),
    account: t.hex().notNull(),
    // Null if deposit leg unindexed.
    amount: t.bigint(),
    // ebool handle: full amount burned?
    successHandle: t.hex(),
    blockNumber: t.bigint().notNull(),
    blockHash: t.hex().notNull(),
    logIndex: t.integer().notNull(),
    txHash: t.hex().notNull(),
    blockTime: t.bigint().notNull(),
  }),
  (table) => ({
    byChild: index().on(table.child, table.blockNumber),
    byAccount: index().on(table.account, table.blockNumber),
  }),
);

// Handles only, never amounts.
export const confidentialEvent = onchainTable(
  "confidential_event",
  (t) => ({
    id: t.text().primaryKey(), // `${blockHash}-${logIndex}`
    child: t.hex().notNull(),
    kind: t.text().notNull(),
    fromAddr: t.hex(),
    toAddr: t.hex(),
    handle: t.hex(), // euint256 handle (bytes32)
    blockNumber: t.bigint().notNull(),
    blockHash: t.hex().notNull(),
    logIndex: t.integer().notNull(),
    txHash: t.hex().notNull(),
    blockTime: t.bigint().notNull(),
  }),
  (table) => ({
    byChild: index().on(table.child, table.blockNumber),
    byFrom: index().on(table.fromAddr, table.blockNumber),
    byTo: index().on(table.toAddr, table.blockNumber),
  }),
);

export const holding = onchainTable(
  "holding",
  (t) => ({
    child: t.hex().notNull(),
    user: t.hex().notNull(),
    balanceHandle: t.hex(),
    handleBlock: t.bigint(),
    firstSeenBlock: t.bigint().notNull(),
    lastActivityBlock: t.bigint().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.child, table.user] }),
    byUser: index().on(table.user),
  }),
);

export const disclosure = onchainTable(
  "disclosure",
  (t) => ({
    id: t.text().primaryKey(), // `${blockHash}-${logIndex}`
    child: t.hex().notNull(),
    handle: t.hex().notNull(),
    amount: t.bigint().notNull(),
    blockNumber: t.bigint().notNull(),
    txHash: t.hex().notNull(),
    blockTime: t.bigint().notNull(),
  }),
  (table) => ({
    byHandle: index().on(table.handle),
    byChild: index().on(table.child, table.blockNumber),
  }),
);

export const operatorApproval = onchainTable(
  "operator_approval",
  (t) => ({
    child: t.hex().notNull(),
    holder: t.hex().notNull(),
    operator: t.hex().notNull(),
    until: t.bigint().notNull(), // unix seconds
    blockNumber: t.bigint().notNull(),
    txHash: t.hex().notNull(),
    blockTime: t.bigint().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.child, table.holder, table.operator] }),
    byHolder: index().on(table.holder),
  }),
);

// Single row; explains a failing wrap.
export const factoryState = onchainTable("factory_state", (t) => ({
  id: t.text().primaryKey(), // always "factory"
  paused: t.boolean().notNull(),
  blocklist: t.hex(),
  blocklistEnabled: t.boolean().notNull(),
  implementation: t.hex(),
  updatedBlock: t.bigint().notNull(),
}));

// Held until the mint confirms.
export const pendingDeposit = onchainTable("pending_deposit", (t) => ({
  id: t.text().primaryKey(), // `${txHash}-${erc20}-${from}`
  amount: t.bigint().notNull(),
  blockHash: t.hex().notNull(),
  logIndex: t.integer().notNull(),
}));
