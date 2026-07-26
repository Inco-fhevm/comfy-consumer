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
const comfy = ComfyClient.browser({ network: "baseSepolia", walletClient });

// node (signs with a private key)
const comfy = ComfyClient.node({ network: "base", privateKey: "0x…" });
```

`network`: `"baseSepolia"` (testnet) or `"base"` (mainnet).

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
comfy.confidentialOf({ token })               // ERC-20 → cToken
comfy.underlyingOf({ cToken })                // cToken → ERC-20
```

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

Hooks: `useDeposit`, `useWithdraw`, `useConfidentialSend`, `useHistory`, `useAssets`,
`useBalance`, `useBalances`, `usePublicBalance`, `useDecrypt`, `useTokens`, `useComfy`.

**Reads don't auto-run.** History/balance hooks need `{ enabled: true }` or `refetch()` — no
background polling by default.

## UI

```tsx
import { ConfidentialWallet } from "@comfy/sdk/ui";
import "@comfy/sdk/ui/styles.css"; // once

<ConfidentialWallet />   // uses the provider's tokens
```

- A button opens a **popup** (modal on desktop, sheet on mobile) with a token picker,
  balance, shield / unshield / send, and paginated activity. Shield shows your wallet
  balance; unshield / send show the shielded balance (reveal to decrypt). Each has Max.
- Single-action popups: `DepositWidget`, `WithdrawWidget`, `SendWidget`. Inline:
  `BalanceCard`, `HistoryList`.
- **Tokens** come from `<ComfyProvider tokens>`; icons resolve from the built-in registry
  (`getTokenMeta`) or a `TokenConfig.icon`, else a generated avatar.
- **Theming**: widgets read the host's CSS token vars, so they follow your light/dark theme.
  Override any `.comfy-*` class, or pass `trigger` / `triggerClassName`.

## Notes

- **Private RPC**: `node({ rpcUrl })`, `browser({ rpcUrl })`, or `<ComfyProvider rpcUrl>`.
  In React, if `rpcUrl` is omitted, reads use your app's wagmi RPC automatically.
- Ships compiled ESM `dist` — don't add to Next.js `transpilePackages`.
- Node scripts need a bundler or `tsx` (Inco's ESM uses extensionless imports).
- In a pnpm monorepo, dedupe `wagmi` / `@tanstack/react-query` to the app's copy
  (`config.resolve.alias.wagmi$ = require.resolve("wagmi")`).

Build: `pnpm --filter @comfy/sdk build`. Examples: `examples/playground`, `examples/node`.
