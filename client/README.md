# @comfy/web

Next.js dApp for confidential ERC-20s on Base — shield (wrap), unshield (unwrap),
and confidential send, with balances that stay encrypted on-chain and are decrypted
client-side via Inco session keys.

Part of the [comfy monorepo](../README.md). Data comes from `@comfy/indexer`; addresses,
ABIs and default tokens come from `@comfy/config`.

## Develop

```bash
pnpm install          # from the repo root (links workspaces)
pnpm dev              # runs this app → http://localhost:3000
```

Or from here: `cd client && pnpm dev`.

## Build

```bash
pnpm --filter @comfy/web build
```

`output: standalone` is used for Docker; Vercel uses its native output.

## Configuration

One build serves **both networks** (Base Sepolia / Base) — config is read at runtime,
not baked into the bundle:

- **`APP_*`** — read on the server per request and served via `/env`; change them at
  container start to switch testnet ↔ mainnet. Preferred for deployments.
- **`NEXT_PUBLIC_*`** — inlined at build; a convenient fallback for local dev.

All values are **public** (chain, browser-facing indexer URL, on-chain addresses). Never
put secrets (private/keyed RPC, API keys) in either — proxy a keyed RPC through a server
route instead. See [.env.sample](./.env.sample) for the full list.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- wagmi + RainbowKit (injected wallets only) · viem
- `@inco/lightning-js` for encrypt / attested-decrypt / session keys
- TanStack Query · Tailwind + Radix (shadcn/ui) · Motion
- zod for indexer-boundary + form validation
