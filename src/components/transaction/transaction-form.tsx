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
import { pad, bytesToHex, toHex, parseEther } from "viem";
import { ERC20ABI, ENCRYPTEDERC20ABI } from "@/lib/constants";
import loadingAnimation from "@/lib/transaction-animation.json";
import { useChainBalance } from "@/context/chain-balance-provider";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format-number";
import { useNetworkSwitch } from "@/hooks/use-network-switch";
import IconBuilder from "../icon-builder";
import { useContracts } from "@/context/contract-provider";
import clientLogger from "@/lib/logging/client-logger";
import { getConfig } from "@/lib/inco-lite";
import { AttestedComputeSupportedOps } from "@inco/js/lite";

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
      clientLogger.transaction.start("shield");

      await checkAndSwitchNetwork();
      const amountWithDecimals = parseEther(amount.toString());

      clientLogger.info("Starting shield operation", {
        erc20Contract: ERC20_CONTRACT_ADDRESS,
        encryptedContract: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
        // Note: Not logging amount for security
      });

      // Approve transaction
      clientLogger.info("Executing ERC20 approve for shield", {
        contractAddress: ERC20_CONTRACT_ADDRESS,
        spender: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
        // Note: Not logging amount for security
      });

      const approveHash = await writeContractAsync({
        address: ERC20_CONTRACT_ADDRESS as `0x${string}`,
        abi: ERC20ABI,
        functionName: "approve",
        args: [ENCRYPTED_ERC20_CONTRACT_ADDRESS, amountWithDecimals],
      });

      clientLogger.info("ERC20 approve transaction submitted", {
        txHash: approveHash,
        contractAddress: ERC20_CONTRACT_ADDRESS,
      });

      const approveTransaction = await publicClient!.waitForTransactionReceipt({
        hash: approveHash,
      });

      if (approveTransaction.status !== "success") {
        clientLogger.transaction.error("Approval transaction failed", "shield");
        throw new Error("Approval transaction failed");
      }

      clientLogger.info("ERC20 approve transaction confirmed", {
        txHash: approveHash,
        status: approveTransaction.status,
      });

      // Wrap transaction
      clientLogger.info("Executing wrap for shield", {
        contractAddress: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
        functionName: "wrap",
        // Note: Not logging amount for security
      });

      const wrapTxHash = await writeContractAsync({
        address: ENCRYPTED_ERC20_CONTRACT_ADDRESS as `0x${string}`,
        abi: ENCRYPTEDERC20ABI,
        functionName: "wrap",
        args: [amountWithDecimals],
      });

      clientLogger.info("Wrap transaction submitted", {
        txHash: wrapTxHash,
        contractAddress: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
      });

      const wrapTransaction = await publicClient!.waitForTransactionReceipt({
        hash: wrapTxHash,
      });

      if (wrapTransaction.status !== "success") {
        clientLogger.transaction.error("Wrap transaction failed", "shield");
        throw new Error("Wrap transaction failed");
      }

      clientLogger.transaction.success(wrapTxHash, "shield");
      clientLogger.info("Shield operation completed successfully", {
        approveTxHash: approveHash,
        wrapTxHash: wrapTxHash,
        // Note: Not logging amount for security
      });

      toast.success("Wrap Complete");
      handleClose(mode);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      clientLogger.transaction.error(errorMessage, "shield");
      clientLogger.error("Shield operation failed", {
        error: errorMessage,
        erc20Contract: ERC20_CONTRACT_ADDRESS,
        encryptedContract: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
        // Note: Not logging amount for security
      });
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
      clientLogger.transaction.start("unshield");

      await checkAndSwitchNetwork();

      if (!decryptAmount) {
        clientLogger.error("No encrypted balance available for unshield");
        setError("No encrypted balance available.");
        return;
      }

      const amountWithDecimals = parseEther(decryptAmount.toString());

      clientLogger.info("Starting unshield operation", {
        contractAddress: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
        functionName: "unwrap",
        // Note: Not logging amount for security in shielded operations
      });

      // Estimate gas for unwrap
      // clientLogger.info("Estimating gas for unwrap operation", {
      //   contractAddress: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
      //   functionName: "unwrap",
      // });

      // const estimatedGas = await publicClient!.estimateContractGas({
      //   address: ENCRYPTED_ERC20_CONTRACT_ADDRESS as `0x${string}`,
      //   abi: ENCRYPTEDERC20ABI,
      //   functionName: "unwrap",
      //   args: [amountWithDecimals],
      //   account: address,
      // });

      // clientLogger.info("Gas estimated for unwrap", {
      //   estimatedGas: estimatedGas.toString(),
      //   contractAddress: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
      // });

      // clientLogger.info("Executing unwrap contract call", {
      //   contractAddress: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
      //   functionName: "unwrap",
      //   gas: estimatedGas.toString(),
      // });

      const balance = await publicClient!.readContract({
        address: ENCRYPTED_ERC20_CONTRACT_ADDRESS as `0x${string}`,
        abi: ENCRYPTEDERC20ABI,
        functionName: "balanceOf",
        args: [address],
      });
      const op = AttestedComputeSupportedOps.Ge;

      const incoConfig = await getConfig();
      const attestedCompute = await incoConfig.attestedCompute(
        // @ts-expect-error - walletClient is not typed
        walletClient,
        balance,
        op,
        amountWithDecimals
      );

      const plaintext = attestedCompute.plaintext.value;

      const covalidatorSignature = attestedCompute.covalidatorSignatures;

      const formattedPlaintext = (
        typeof plaintext === "boolean"
          ? plaintext
            ? "0x" + "0".repeat(63) + "1"
            : "0x" + "0".repeat(64)
          : pad(toHex(plaintext as bigint), { size: 32 })
      ) as `0x${string}`;

      const signatures = covalidatorSignature.map((sig: Uint8Array) =>
        bytesToHex(sig)
      );

      const quorumAttestation = {
        handle: attestedCompute.handle as `0x${string}`,
        value: formattedPlaintext,
      } as const;

      const estimatedGas = await publicClient!.estimateContractGas({
        address: ENCRYPTED_ERC20_CONTRACT_ADDRESS as `0x${string}`,
        abi: ENCRYPTEDERC20ABI,
        functionName: "unwrap",
        args: [amountWithDecimals, quorumAttestation, signatures],
        account: address,
      });

      const hash = await writeContractAsync({
        address: ENCRYPTED_ERC20_CONTRACT_ADDRESS as `0x${string}`,
        abi: ENCRYPTEDERC20ABI,
        functionName: "unwrap",
        args: [amountWithDecimals, quorumAttestation, signatures],
        gas: estimatedGas,
        // value: fees,
      });

      clientLogger.info("Unwrap transaction submitted", {
        txHash: hash,
        contractAddress: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
      });

      const transaction = await publicClient!.waitForTransactionReceipt({
        hash,
      });

      if (transaction.status !== "success") {
        clientLogger.transaction.error("Unwrap transaction failed", "unshield");
        setError("Transaction failed");
        return;
      }

      clientLogger.info("Unwrap transaction confirmed", {
        txHash: hash,
        status: transaction.status,
        contractAddress: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
      });

      // Listen for unwrap event via API
      clientLogger.info("Listening for unwrap events via API", {
        apiEndpoint: "/api/listen-unshield",
      });

      // const res = await fetch("/api/listen-unshield", { method: "POST" });
      // const data = await res.json();
      // if (data.logs) {
      //   clientLogger.info("Unwrap event detected via API", {
      //     eventCount: data.logs.length,
      //     txHash: hash,
      //   });
      // }

      // clientLogger.transaction.success(hash, "unshield");
      // clientLogger.info("Unshield operation completed successfully", {
      //   txHash: hash,
      //   contractAddress: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
      // });

      toast.success("Unwrap Complete");
      handleClose(mode);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      clientLogger.transaction.error(errorMessage, "unshield");
      clientLogger.error("Unshield operation failed", {
        error: errorMessage,
        contractAddress: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
      });
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
