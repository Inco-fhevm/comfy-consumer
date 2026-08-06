import { createConfig, factory } from "ponder";
import { cfg, rpcUrls } from "./src/lib/config.js";
import { getAbiItem } from "viem";
import { CTOKEN_ABI, ERC20_ABI, WRAPPER_FACTORY_ABI } from "@comfy/config";

const WrapperCreated = getAbiItem({ abi: WRAPPER_FACTORY_ABI, name: "WrapperCreated" });

export default createConfig({
  database: cfg.databaseUrl
    ? { kind: "postgres", connectionString: cfg.databaseUrl }
    : { kind: "pglite", directory: "./.ponder/pglite" },
  chains: {
    comfy: { id: cfg.chainId, rpc: rpcUrls, pollingInterval: cfg.pollingInterval },
  },
  contracts: {
    WrapperFactory: {
      abi: WRAPPER_FACTORY_ABI,
      chain: "comfy",
      address: cfg.factory,
      startBlock: cfg.startBlock,
    },

    // Address-scoped; impostors never fetched.
    CToken: {
      abi: CTOKEN_ABI,
      chain: "comfy",
      address: factory({
        address: cfg.factory,
        event: WrapperCreated,
        parameter: "ctoken",
        startBlock: cfg.startBlock,
      }),
      startBlock: cfg.startBlock,
    },

    // Wrap's deposit leg; filtered to vault.
    Underlying: {
      abi: ERC20_ABI,
      chain: "comfy",
      address: factory({
        address: cfg.factory,
        event: WrapperCreated,
        parameter: "erc20",
        startBlock: cfg.startBlock,
      }),
      filter: { event: "Transfer", args: { to: cfg.vault } },
      startBlock: cfg.startBlock,
    },
  },
});
