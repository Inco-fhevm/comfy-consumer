import { useAccount, useSwitchChain } from "wagmi";
import { baseSepolia } from "viem/chains";

export const useNetworkSwitch = () => {
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const checkAndSwitchNetwork = async () => {
    if (!chainId) {
      throw new Error("No chain detected. Please connect your wallet.");
    }

    if (chainId !== baseSepolia.id) {
      try {
        await switchChainAsync({ chainId: baseSepolia.id });
      } catch (err) {
        console.error("Error switching network:", err);
        throw new Error("Failed to switch to Base Sepolia network");
      }
    }
  };

  return {
    checkAndSwitchNetwork,
    isBaseSepolia: chainId === baseSepolia.id,
    currentChain: chainId,
  };
};