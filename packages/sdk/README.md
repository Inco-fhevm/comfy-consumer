# @comfy/sdk

Shield, send, and read **confidential tokens** on Inco (Base / Base Sepolia).
One package, three layers:

| Import | What |
| --- | --- |
| `@comfy/sdk` | Core client (Node + browser) |
| `@comfy/sdk/react` | Hooks + `<ComfyProvider>` |
| `@comfy/sdk/ui` | Prebuilt popup widgets |

Only `zod` is bundled; `viem`, `@inco/lightning-js`, `react`, `wagmi`, `@tanstack/react-query`,
and `motion` are peer deps.

## Core

```ts
import { ComfyClient } from "@comfy/sdk";

// browser (popup-free decrypts via a session key)
const comfy = ComfyClient.browser({
  network: "baseSepolia", // "base" | "baseSepolia"
  walletClient,           // viem WalletClient (signer)
  // optional:
  rpcUrl,                 // private RPC, else public
  indexerUrl,             // activity / holdings source
  confirmations: 5,       // blocks writes wait for
  sessionTtlHours: 24,    // session-key lifetime
  publicClient,           // reuse a viem client
});

// node (signs with a private key)
const comfy = ComfyClient.node({
  network: "base",
  privateKey: "0x…",      // or account: viem Account
  // optional: rpcUrl, indexerUrl, confirmations, publicClient
});
```

`network`: `"baseSepolia"` (testnet) or `"base"` (mainnet). Only `network` + a signer are
required; everything else has sane defaults.

```ts
comfy.deposit({ token, amount })              // shield
comfy.withdraw({ token, amount })             // unshield
comfy.confidentialSend({ token, to, amount }) // private transfer
comfy.balanceOf({ token })                    // shielded balance (decrypt)
comfy.balances({ tokens })                    // batch decrypt
comfy.publicBalanceOf({ token })              // wallet ERC-20 balance
comfy.decrypt({ handle, decimals })           // decrypt one handle
comfy.decryptHandles({ handles })             // batch, one call
comfy.history({ address, page, limit })       // activity (indexer)
comfy.assets({ address })                     // holdings
comfy.confidentialOf({ token })               // ERC-20 → cToken (deployed or predicted)
comfy.wrapperOf({ token })                    // ERC-20 → deployed cToken, else null
comfy.ensureWrapper({ token })                // deploy this token's wrapper if it has none
comfy.underlyingOf({ cToken })                // cToken → ERC-20
comfy.networkFee()                            // Inco ciphertext fee (wei) a send pays
```

**Shielding is on the cToken.** `deposit` deploys the wrapper via `factory.createWrapper`
if the token has none, approves the **cToken** (not the factory), then calls `cToken.wrap`.
`onStep` reports `"creating"` → `"approving"` → `"wrapping"`, skipping any step not needed.

`token` = the underlying ERC-20 (the SDK finds its cToken). `amount` = `"100"` (human) or a
`bigint` (base units). Writes resolve after confirmation; errors are typed `ComfyError`s.

## React

```tsx
import { ComfyProvider } from "@comfy/sdk/react";

// under WagmiProvider + QueryClientProvider
<ComfyProvider
  network="baseSepolia"
  indexerUrl={INDEXER_URL}
  tokens={[{ erc20: "0x036CbD…", symbol: "USDC" }]}
>
  <App />
</ComfyProvider>
```

Hooks: `useDeposit`, `useApprove`, `useWithdraw`, `useConfidentialSend`, `useHistory`,
`useAssets`, `useBalance`, `useBalances`, `usePublicBalance`, `usePublicBalances`,
`useDecrypt`, `useTokens`, `useChainGuard`, `useComfy`.

Reads are scoped to the connected chain, so switching networks refetches rather than
serving the previous chain's cache. Balance reads decrypt, which needs a signature, so
they never retry — a declined signature surfaces immediately instead of re-prompting.

### Wrong network

Writes are never auto-switched. `ensureChain` throws `WRONG_NETWORK` and the UI offers
the switch; `useChainGuard` drives it:

```tsx
const chain = useChainGuard();
if (chain.wrongNetwork) {
  return <button onClick={chain.switchNetwork}>Switch to {chain.chainName}</button>;
}
```

The bundled widgets already do this on their triggers, the action row and each form.

Writes are mutations; reads are queries:

```tsx
// write
const deposit = useDeposit();
deposit.mutate({ token, amount });   // or await deposit.mutateAsync(...)

// read (off by default)
const { data, isLoading, refetch } = useHistory(
  { page: 1, limit: 10 },
  { enabled: true, keepPreviousData: true },
);

// escape hatch to the core client
const comfy = useComfy();
```

**Reads don't auto-run.** History/balance hooks need `{ enabled: true }` or `refetch()` — no
background polling by default.

## UI

```tsx
import { ConfidentialWallet } from "@comfy/sdk/ui";
import "@comfy/sdk/ui/styles.css"; // once

<ConfidentialWallet />   // uses the provider's tokens
```

- A button opens a **popup** (modal on desktop, sheet on mobile). Home is a **portfolio**:
  every configured token with its shielded balance, plus shield / unshield / send and
  paginated activity. One **Reveal** decrypts every balance in a *single* attested call, so
  the whole portfolio costs one signature. Tap a row to choose what the actions operate on.
- Each action view carries the token and its balance in one strip — wallet balance for
  shield, shielded balance (reveal to decrypt) for unshield / send. Each has Max.
- **Your list is the priority set**: `TokenConfig.priority` sorts it (higher first; ties keep
  your array order) and those rows are always visible.
- **"Show all tokens"** navigates to the **Select token** screen, which lists everything —
  including holdings you *didn't* configure, discovered from the indexer (`assets()`) — each
  with its shielded balance behind the same Reveal. Needs `indexerUrl`; without one the
  control never appears. Disable with `discoverTokens={false}`. Cap the portfolio rows with
  `maxVisibleTokens={n}` if your configured list is long.
- **Reveal is shared** across the portfolio and the select screen: both decrypt the same
  merged token set, so it is one signature for the whole session, not one per screen.
- Single-action popups: `DepositWidget`, `WithdrawWidget`, `SendWidget`. Inline:
  `BalanceCard`, `HistoryList`.
- **Tokens** come from `<ComfyProvider tokens>`; icons resolve from the built-in registry
  (`getTokenMeta`) or a `TokenConfig.icon`, else a generated avatar.
- Single-action popups keep their own token step, since they have no portfolio to pick from.
- **Theming**: widgets read the host's CSS token vars, so they follow your light/dark theme.
  Override any `.comfy-*` class, or pass `trigger` / `triggerClassName`.

## Notes

- **Private RPC**: `node({ rpcUrl })`, `browser({ rpcUrl })`, or `<ComfyProvider rpcUrl>`.
  In React, if `rpcUrl` is omitted, reads use your app's wagmi RPC automatically.
- **Confirmations**: writes wait for 5 blocks by default; override with `confirmations` on
  the client / `<ComfyProvider>`. `approve` and `createWrapper` wait 1 — they only need
  inclusion, and the dependent tx lands in a later block anyway.
- **Errors**: `humanizeError(err)` turns a viem/wallet error into one plain sentence
  (rejected signature, wrong network, insufficient gas…). The widgets use it already.
- **Unwrapped tokens**: a token whose wrapper was never deployed reads as a balance of 0
  rather than throwing, so one such token can't blank a whole portfolio.
- **Smooth pagination**: pass `{ keepPreviousData: true }` to `useHistory` / `useAssets`.
- Ships compiled **ESM + CJS** `dist` (dual `import`/`require`, own types) — don't add to
  Next.js `transpilePackages`.
- Node scripts: `require("@comfy/sdk")` (CJS) runs directly; ESM `import` needs a bundler or
  `tsx` — `@inco/lightning-js@1.0.2` ships extensionless imports in its ESM build, which
  Node's ESM resolver rejects. Requires Node ≥ 20.
- In a pnpm monorepo, dedupe `wagmi` / `@tanstack/react-query` to the app's copy
  (`config.resolve.alias.wagmi$ = require.resolve("wagmi")`).

Build: `pnpm --filter @comfy/sdk build`. Examples: `examples/playground`, `examples/node`.
