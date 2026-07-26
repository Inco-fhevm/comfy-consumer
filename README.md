# Comfy — confidential ERC20 wrapper app + indexer

pnpm monorepo:

```
config/       Single source of truth: ABIs, deployed addresses, event topic0 hashes,
              and the TokenInfo type — shared everywhere (@comfy/config).
indexer/      Webhook-based EVM factory indexer (GCP Cloud Run) — indexes the official
              ConfidentialERC20WrapperFactory and its child wrappers. Stores handles only,
              never decrypted amounts. See indexer/README.md and the BUILD SPEC.
client/       Next.js dApp (mint, shield/unshield, confidential send, add/deploy tokens).
packages/sdk/ @comfy/sdk — confidential-token SDK (core client + React hooks + UI widgets).
examples/     A Next.js playground and a Node script that consume the SDK.
```

## Getting started

```bash
corepack enable pnpm        # pnpm isn't required to be preinstalled
pnpm install                # links workspaces + installs everything
pnpm dev                    # runs the web app (client/)
```

> The client currently ships with its own `node_modules` (migrated from the old
> single-repo layout) so it runs without a workspace install. Run `pnpm install` at the
> root once to unify dependencies and wire the `@comfy/config` workspace link that the
> client and indexer both consume.

## SDK — `@comfy/sdk`

Shield, send, and read confidential tokens as a small typed API. Three layers: a core
client (Node + browser), React hooks, and prebuilt popup widgets.

```ts
import { ComfyClient } from "@comfy/sdk";

const comfy = ComfyClient.browser({ network: "base", walletClient });
// optional: rpcUrl, indexerUrl, confirmations, sessionTtlHours

await comfy.deposit({ token, amount });               // shield
await comfy.confidentialSend({ token, to, amount });  // private transfer
```

React — writes are mutations, reads are queries (off by default):

```tsx
const deposit = useDeposit();
deposit.mutate({ token, amount });

const { data, refetch } = useHistory({ page: 1 }, { enabled: true });
```

Hooks: `useDeposit`, `useApprove`, `useWithdraw`, `useConfidentialSend`, `useHistory`,
`useAssets`, `useBalance`, `useBalances`, `usePublicBalance`, `useDecrypt`, `useTokens`,
`useComfy`. Full reference: [`packages/sdk/README.md`](packages/sdk/README.md).

## Privacy invariant (indexer)

The indexer is **read-only on-chain, holds no keys, and never decrypts**. Confidential
transfer/approval amounts exist only as `euint256` handles (`bytes32`) and are stored as
opaque handles. The only plaintext amounts anywhere are `Wrap`/`Unwrap`/`Burn`, which are
already public (the underlying ERC20 movement is visible on-chain regardless).
