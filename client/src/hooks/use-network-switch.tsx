import { useAccount, useSwitchChain } from "wagmi";
import { ACTIVE_CHAIN, CHAIN_ID, CHAIN_LABEL } from "@/lib/constants";

export const useNetworkSwitch = () => {
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const checkAndSwitchNetwork = async () => {
    if (!chainId) {
      throw new Error("No chain detected. Please connect your wallet.");
    }

    if (chainId !== CHAIN_ID) {
      try {
        await switchChainAsync({ chainId: ACTIVE_CHAIN.id });
      } catch (err) {
        console.error("Error switching network:", err);
        throw new Error(`Failed to switch to ${CHAIN_LABEL} network`);
      }
    }
  };

  return {
    checkAndSwitchNetwork,
    isCorrectChain: chainId === CHAIN_ID,
    currentChain: chainId,
  };
};
