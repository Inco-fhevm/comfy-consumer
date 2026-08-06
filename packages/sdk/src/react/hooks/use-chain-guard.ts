"use client";
import { useAccount, useSwitchChain } from "wagmi";
import { useComfy } from "./use-comfy";

export interface ChainGuard {
  wrongNetwork: boolean;
  chainId: number;
  chainName: string;
  switching: boolean;
  switchNetwork: () => void;
}

export function useChainGuard(): ChainGuard {
  const comfy = useComfy();
  const { isConnected, chainId: walletChainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const target = comfy.context.chain;

  return {
    wrongNetwork: isConnected && walletChainId != null && walletChainId !== target.id,
    chainId: target.id,
    chainName: target.name,
    switching: isPending,
    switchNetwork: () => switchChain({ chainId: target.id }),
  };
}
