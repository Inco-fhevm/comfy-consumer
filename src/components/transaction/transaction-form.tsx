import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState, ChangeEvent } from "react";
import dynamic from "next/dynamic";
import {
  useAccount,
  useWriteContract,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { createPublicClient, http, parseAbiItem, parseEther } from "viem";
import { ERC20ABI, ENCRYPTEDERC20ABI } from "@/lib/constants";
import loadingAnimation from "@/lib/transaction-animation.json";
import { useChainBalance } from "@/context/chain-balance-provider";
import { toast } from "sonner";
import { baseSepolia } from "viem/chains";
import { formatCurrency } from "@/lib/format-number";
import { useNetworkSwitch } from "@/hooks/use-network-switch";
import IconBuilder from "../icon-builder";
import { useContracts } from "@/context/contract-provider";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface TransactionFormProps {
  mode: "shield" | "withdraw";
  handleClose: (mode: string) => void;
  currentBalance: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  mode,
  handleClose,
  currentBalance,
}) => {
  const { contracts } = useContracts();
  const ENCRYPTED_ERC20_CONTRACT_ADDRESS = contracts?.encryptedERC20?.address;
  const ERC20_CONTRACT_ADDRESS = contracts?.erc20?.address;

  const [amount, setAmount] = useState<string>("");
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [decryptAmount, setDecryptAmount] = useState<string>("");

  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { checkAndSwitchNetwork } = useNetworkSwitch();
  const { tokenBalance, refreshBalances, fetchEncryptedBalance } =
    useChainBalance();

  const handleRefreshEncrypted = () => fetchEncryptedBalance(walletClient);

  const handleShield = async (): Promise<void> => {
    if (!amount || !address) return;

    setError("");
    setIsProcessing(true);
    setIsApproving(true);

    try {
      await checkAndSwitchNetwork();
      const amountWithDecimals = parseEther(amount.toString());

      // Approve transaction
      const approveHash = await writeContractAsync({
        address: ERC20_CONTRACT_ADDRESS as `0x${string}`,
        abi: ERC20ABI,
        functionName: "approve",
        args: [ENCRYPTED_ERC20_CONTRACT_ADDRESS, amountWithDecimals],
      });

      const approveTransaction = await publicClient!.waitForTransactionReceipt({
        hash: approveHash,
      });

      if (approveTransaction.status !== "success") {
        throw new Error("Approval transaction failed");
      }

      // Wrap transaction
      const wrapTxHash = await writeContractAsync({
        address: ENCRYPTED_ERC20_CONTRACT_ADDRESS as `0x${string}`,
        abi: ENCRYPTEDERC20ABI,
        functionName: "wrap",
        args: [amountWithDecimals],
      });

      const wrapTransaction = await publicClient!.waitForTransactionReceipt({
        hash: wrapTxHash,
      });

      if (wrapTransaction.status !== "success") {
        throw new Error("Wrap transaction failed");
      }

      toast.success("Wrap Complete");
      handleClose(mode);
    } catch (error) {
      console.error("Transaction failed:", error);
      setError("Transaction failed. Please try again.");
    } finally {
      setIsApproving(false);
      setIsProcessing(false);
      await refreshBalances(["token"]);
      await handleRefreshEncrypted();
    }
  };

  const handleUnshield = async (): Promise<void> => {
    setIsApproving(true);
    setIsProcessing(true);
    setError("");

    try {
      await checkAndSwitchNetwork();

      if (!decryptAmount) {
        setError("No encrypted balance available.");
        return;
      }

      const amountWithDecimals = parseEther(decryptAmount.toString());

      // Estimate gas for unwrap
      const estimatedGas = await publicClient!.estimateContractGas({
        address: ENCRYPTED_ERC20_CONTRACT_ADDRESS as `0x${string}`,
        abi: ENCRYPTEDERC20ABI,
        functionName: "unwrap",
        args: [amountWithDecimals],
        account: address,
      });

      const hash = await writeContractAsync({
        address: ENCRYPTED_ERC20_CONTRACT_ADDRESS as `0x${string}`,
        abi: ENCRYPTEDERC20ABI,
        functionName: "unwrap",
        args: [amountWithDecimals],
        gas: estimatedGas,
      });

      const transaction = await publicClient!.waitForTransactionReceipt({
        hash,
      });

      if (transaction.status !== "success") {
        setError("Transaction failed");
        return;
      }

      // Listen for unwrap event via API
      const res = await fetch("/api/listen-unshield", { method: "POST" });
      const data = await res.json();
      if (data.logs) {
        console.log("🎉 Unwrap Event (API):", data.logs);
      }

      toast.success("Unwrap Complete");
      handleClose(mode);
    } catch (error) {
      console.error("Transaction failed:", error);
      setError("Transaction failed. Please try again.");
    } finally {
      await refreshBalances(["token"]);
      await handleRefreshEncrypted();
      setIsApproving(false);
      setIsProcessing(false);
    }
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    if (value.split(".").length > 2) return;

    setAmount(value);

    if (Number(value) > Number(currentBalance)) {
      setError(`Insufficient balance.`);
    } else {
      setError("");
    }
  };

  const handleDecryptAmountChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    if (value.split(".").length > 2) return;
    setDecryptAmount(value);
  };

  const handleMaxClick = (): void => {
    setAmount(tokenBalance?.data?.formatted || "");
    setError("");
  };

  const isAmountValid =
    Number(amount) > 0 &&
    Number(amount) <= Number(tokenBalance?.data?.formatted);
  const isDecryptAmountValid = Number(decryptAmount) > 0;

  // Loading state
  if (isApproving && isProcessing) {
    return (
      <div className="relative pb-8">
        <div className="rounded-xl md:h-48 p-6 mb-6 text-center grid place-items-center">
          <div className="flex flex-col items-center">
            <div className="w-56 h-56 mb-2 pb-12">
              <Lottie
                animationData={loadingAnimation}
                loop={true}
                autoplay={true}
              />
              <p className="font-medium text-[#AFAFAF] dark:text-gray-400">
                {isApproving ? "Approving transaction..." : "Processing..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pb-8">
      {/* Withdraw Mode */}
      {mode === "withdraw" && (
        <div className="w-full border rounded-xl overflow-y-auto md:h-64 p-6 mb-6 text-center grid place-items-center">
          <div>
            <div className="grid place-items-center gap-6">
              <div className="w-11 h-11">
                <IconBuilder
                  isEncrypted={true}
                  usdcImage={"/tokens/usdc-token.svg"}
                  incoImage={"/tokens/inco-token.svg"}
                  networkImage={"/chains/base-sepolia.svg"}
                />
              </div>
              <div className="text-3xl flex gap-2 items-center font-semibold mb-1 bg-transparent text-center w-full text-black dark:text-white disabled:opacity-50">
                <input
                  type="text"
                  placeholder="0"
                  value={decryptAmount}
                  onChange={handleDecryptAmountChange}
                  className="w-full max-w-full bg-transparent focus:outline-none text-center"
                />
              </div>
            </div>
            <div className="text-[#AFAFAF] dark:text-gray-400 break-all leading-tight max-w-full overflow-wrap-anywhere">
              {decryptAmount || "0"} cUSDC
            </div>
            {error && (
              <div className="text-red-500 dark:text-red-400 text-sm mt-2">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shield Mode */}
      {mode === "shield" && (
        <>
          {/* Token Selection */}
          <div className="p-4 border rounded-xl mb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-11 h-11">
                  <IconBuilder
                    isEncrypted={true}
                    usdcImage={"/tokens/usdc-token.svg"}
                    incoImage={"/tokens/inco-token.svg"}
                    networkImage={"/chains/base-sepolia.svg"}
                  />
                </div>
                <div>
                  <p className="dark:text-white">USDC</p>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Balance:{" "}
                    {formatCurrency(Number(tokenBalance?.data?.formatted))} USDC
                  </div>
                </div>
              </div>
              <div
                onClick={handleMaxClick}
                className="h-8 px-3 text-sm text-blue-500 dark:text-blue-400 cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-900 bg-[#E7EEFE] dark:bg-[#1E293B] rounded-full inline-flex items-center justify-center"
              >
                Max
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="border overflow-y-auto rounded-xl md:h-48 p-6 mb-6 text-center grid place-items-center">
            <div>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className="text-3xl font-semibold mb-1 bg-transparent text-center w-full focus:outline-none text-black dark:text-white disabled:opacity-50"
                placeholder="0"
                disabled={isProcessing}
              />
              <div className="text-[#AFAFAF] dark:text-gray-400 break-all leading-tight max-w-full overflow-wrap-anywhere">
                {amount || "0"} USDC
              </div>
              {error && (
                <div className="text-red-500 dark:text-red-400 text-sm mt-2">
                  {error}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="grid gap-4">
        {mode === "shield" ? (
          <Button
            className="w-full rounded-full dark:bg-[#3673F5] dark:text-white dark:hover:bg-[#3673F5]/80"
            disabled={!isAmountValid || isProcessing}
            onClick={handleShield}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isApproving ? "Approving..." : "Processing..."}
              </>
            ) : (
              "Shield"
            )}
          </Button>
        ) : (
          <Button
            className="w-full rounded-full dark:bg-[#3673F5] dark:text-white dark:hover:bg-[#3673F5]/80"
            disabled={!isDecryptAmountValid || isProcessing}
            onClick={handleUnshield}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isApproving ? "Approving..." : "Processing..."}
              </>
            ) : (
              "Unshield"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TransactionForm;
