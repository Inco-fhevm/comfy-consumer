# @comfy/sdk examples

Two ways to test the SDK against Base Sepolia.

## Browser playground (`playground/`)

A minimal Next.js app that mounts the widgets + hooks with a wagmi injected wallet.

```bash
pnpm --filter @comfy/sdk build          # SDK must be built first (ships dist)
pnpm --filter @comfy/playground dev     # http://localhost:3000
```

Connect a browser wallet on Base Sepolia, then shield / send / reveal / withdraw.
Set `NEXT_PUBLIC_INDEXER_URL` for history (defaults to `http://localhost:8080`).

## Headless node (`node/`)

Runs `ComfyClient.node(...)` — no browser, no build step (imports SDK source).

```bash
pnpm --filter @comfy/node-example start
# writes too:
PRIVATE_KEY=0x… INDEXER_URL=https://… pnpm --filter @comfy/node-example start
```

Without `PRIVATE_KEY` it exercises the read-only resolvers; with one it runs
`balanceOf` → `deposit` → `balanceOf`. It's a CommonJS package on purpose, so
`@inco/lightning-js` resolves to its CJS build (its ESM has Node-incompatible imports).
