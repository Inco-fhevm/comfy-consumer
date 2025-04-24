import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { parseEther } from "ethers";
import { Loader2 } from "lucide-react";
import {
  ENCRYPTED_ERC20_CONTRACT_ADDRESS,
  ENCRYPTEDERC20ABI,
  ERC20_CONTRACT_ADDRESS,
  ERC20ABI,
} from "@/utils/contracts";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { useChainBalance } from "@/hooks/use-chain-balance";

const MintDialog = ({ open, onOpenChange, onSubmit }) => {
  const [amount, setAmount] = React.useState("");
  const [selectedToken, setSelectedToken] = React.useState("usdc");
  const [isLoading, setIsLoading] = React.useState(false);
  const { address } = useAccount();
  const [error, setError] = React.useState("");
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const {
    nativeBalance,
    tokenBalance,
    encryptedBalance,
    isEncryptedLoading,
    encryptedError,
    refreshBalances,
    fetchEncryptedBalance,
    isConnected,
  } = useChainBalance();
  const walletClient = useWalletClient();

  const handleUSDCRefresh = () => refreshBalances(["token"]);

  const mintcUSDC = async () => {
    try {
      const amountWithDecimals = parseEther(amount.toString());

      const cUSDCMintTxHash = await writeContractAsync({
        address: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
        abi: ENCRYPTEDERC20ABI,
        functionName: "mint",
        args: [address, amountWithDecimals],
      });

      const transaction = await publicClient.waitForTransactionReceipt({
        hash: cUSDCMintTxHash,
      });

      if (transaction.status === "reverted") {
        throw new Error("Contract Execution Reverted!");
      }

      await refreshBalances(["encrypted"], walletClient);
    } catch (err) {
      console.error("Error minting cUSDC:", err);
      throw new Error("Failed to mint cUSDC");
    }
  };

  const mintUSDC = async () => {
    try {
      const amountWithDecimals = parseEther(amount.toString());

      const uSDCMintTxHash = await writeContractAsync({
        address: ERC20_CONTRACT_ADDRESS,
        abi: ERC20ABI,
        functionName: "mint",
        args: [address, amountWithDecimals],
      });

      const transaction = await publicClient.waitForTransactionReceipt({
        hash: uSDCMintTxHash,
      });

      if (transaction.status === "reverted") {
        throw new Error("Contract Execution Reverted!");
      }

      await handleUSDCRefresh(["token"]);
    } catch (err) {
      console.error("Error minting USDC:", err);
      throw new Error("Failed to mint USDC");
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (selectedToken === "usdc") {
        await mintUSDC();
      } else {
        await mintcUSDC();
      }

      setAmount("");
      setSelectedToken("usdc");
      onOpenChange(false);
    } catch (err) {
      console.error("Minting error:", err);
      setError(`Failed to mint ${selectedToken.toUpperCase()}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-medium">
            Mint Tokens
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            Select token and enter amount
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6">
          <RadioGroup
            value={selectedToken}
            onValueChange={setSelectedToken}
            className="grid grid-cols-2 gap-3"
            disabled={isLoading}
          >
            {[
              {
                value: "usdc",
                label: "USDC",
                color: "bg-blue-500",
                symbol: "$",
              },
              {
                value: "cusdc",
                label: "cUSDC",
                color: "bg-green-500",
                symbol: "C",
              },
            ].map(({ value, label, color, symbol }) => (
              <div key={value} className="relative">
                <RadioGroupItem
                  value={value}
                  id={value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={value}
                  className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer peer-data-[state=checked]:border-black/20 peer-data-[state=checked]:bg-muted ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div
                    className={`w-5 h-5 ${color} rounded-full grid place-items-center`}
                  >
                    <span className="text-white text-xs">{symbol}</span>
                  </div>
                  <span>{label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Input
            type="number"
            placeholder="Enter Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg p-6 px-4 rounded-xl shadow-none"
            disabled={isLoading}
          />

          {error && (
            <div className="text-sm text-red-500 text-center">{error}</div>
          )}
        </div>

        <div className="mt-2 -mb-6 -mx-6">
          <Separator className="" />
          <div className="bg-muted/15 p-6">
            <AlertDialogFooter className="flex gap-2 sm:gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 "
                onClick={handleSubmit}
                disabled={!amount || Number(amount) <= 0 || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Minting...
                  </div>
                ) : (
                  "Mint"
                )}
              </Button>
            </AlertDialogFooter>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MintDialog;
