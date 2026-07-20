# Comfy — confidential ERC20 wrapper app + indexer

pnpm monorepo, three folders:

```
config/     Single source of truth: ABIs, deployed addresses, event topic0 hashes,
            and the TokenInfo type — shared by client and indexer (@comfy/config).
indexer/    Webhook-based EVM factory indexer (GCP Cloud Run) — indexes the official
            ConfidentialERC20WrapperFactory and its child wrappers. Stores handles only,
            never decrypted amounts. See indexer/README.md and the BUILD SPEC.
client/     Next.js dApp (mint, shield/unshield, confidential send, add/deploy tokens).
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

## Privacy invariant (indexer)

The indexer is **read-only on-chain, holds no keys, and never decrypts**. Confidential
transfer/approval amounts exist only as `euint256` handles (`bytes32`) and are stored as
opaque handles. The only plaintext amounts anywhere are `Wrap`/`Unwrap`/`Burn`, which are
already public (the underlying ERC20 movement is visible on-chain regardless).
