import React from "react";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { parseEther } from "viem";
import { Loader2, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  ENCRYPTED_ERC20_CONTRACT_ADDRESS,
  ENCRYPTEDERC20ABI,
  ERC20_CONTRACT_ADDRESS,
  ERC20ABI,
} from "@/lib/constants";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { useChainBalance } from "@/context/chain-balance-provider";
import { useNetworkSwitch } from "@/hooks/use-network-switch";
import IconBuilder from "./icon-builder";

const MintDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [amount, setAmount] = React.useState("");
  const [selectedToken, setSelectedToken] = React.useState("usdc");
  const [isLoading, setIsLoading] = React.useState(false);
  const { address } = useAccount();
  const [error, setError] = React.useState("");
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { checkAndSwitchNetwork } = useNetworkSwitch();
  const isMobile = useMediaQuery("(max-width: 640px)");

  const { refreshBalances, fetchEncryptedBalance } = useChainBalance();
  const { data: walletClient } = useWalletClient();

  const handleUSDCRefresh = async () => await refreshBalances(["token"]);

  const handleClose = (): void => {
    setAmount("");
    setSelectedToken("usdc");
    setError("");
    onOpenChange(false);
  };

  const mintcUSDC = async () => {
    try {
      await checkAndSwitchNetwork();
      const amountWithDecimals = parseEther(amount.toString());

      const cUSDCMintTxHash = await writeContractAsync({
        address: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
        abi: ENCRYPTEDERC20ABI,
        functionName: "mint",
        args: [address, amountWithDecimals],
      });

      const transaction = await publicClient?.waitForTransactionReceipt({
        hash: cUSDCMintTxHash,
      });

      if (transaction?.status === "reverted") {
        throw new Error("Contract Execution Reverted!");
      }

      await fetchEncryptedBalance(walletClient);
    } catch (err) {
      console.error("Error minting cUSDC:", err);
      throw new Error("Failed to mint cUSDC");
    }
  };

  const mintUSDC = async () => {
    try {
      await checkAndSwitchNetwork();
      const amountWithDecimals = parseEther(amount.toString());

      const uSDCMintTxHash = await writeContractAsync({
        address: ERC20_CONTRACT_ADDRESS,
        abi: ERC20ABI,
        functionName: "mint",
        args: [address, amountWithDecimals],
      });

      const transaction = await publicClient?.waitForTransactionReceipt({
        hash: uSDCMintTxHash,
      });

      if (transaction?.status === "reverted") {
        throw new Error("Contract Execution Reverted!");
      }

      await handleUSDCRefresh();
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

      handleClose();
    } catch (err) {
      console.error("Minting error:", err);
      setError(`Failed to mint ${selectedToken.toUpperCase()}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic component selection based on device type
  const DialogComponent = isMobile ? Sheet : AlertDialog;
  const DialogContentComponent = isMobile ? SheetContent : AlertDialogContent;
  const DialogHeaderComponent = isMobile ? SheetHeader : "div";
  const DialogTitleComponent = isMobile ? SheetTitle : "div";

  const renderDialogHeader = (): React.ReactNode => (
    <DialogHeaderComponent className="px-8 py-6 pb-2 flex flex-row items-center justify-between">
      <div className="flex items-center gap-4">
        <DialogTitleComponent className="text-xl font-semibold">
          Mint Tokens
        </DialogTitleComponent>
      </div>
      <Button
        variant="ghost"
        className="h-8 w-8 p-0 rounded-xl"
        onClick={() => onOpenChange(false)}
        disabled={isLoading}
      >
        <X className="h-4 w-4" />
      </Button>
    </DialogHeaderComponent>
  );

  const renderContent = (): React.ReactNode => (
    <div className="transition-opacity duration-200">
      <div className="px-8 pb-8 space-y-6">
        <div className="text-sm text-gray-600 mb-4">
          Select token and enter amount
        </div>

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
              isEncrypted: false,
            },
            {
              value: "cusdc",
              label: "cUSDC",
              isEncrypted: true,
            },
          ].map(({ value, label, isEncrypted }) => (
            <div key={value} className="relative">
              <RadioGroupItem
                value={value}
                id={value}
                className="peer sr-only"
              />
              <Label
                htmlFor={value}
                className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer peer-data-[state=checked]:border-black/20 peer-data-[state=checked]:bg-muted transition-all ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="w-8 h-8">
                  <IconBuilder
                    isEncrypted={isEncrypted}
                    usdcImage={"/tokens/usdc-token.svg"}
                    incoImage={"/tokens/inco-token.svg"}
                    networkImage={"/chains/base-sepolia.svg"}
                  />
                </div>
                <span className="font-medium">{label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <Input
          type="number"
          placeholder="Enter Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-lg p-6 px-4 rounded-xl shadow-none border-gray-200"
          disabled={isLoading}
        />

        {error && (
          <div className="text-sm text-red-500 text-center bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-3">
          <Button
            className="w-full h-12 rounded-xl dark:bg-[#3673F5] dark:text-white dark:hover:bg-[#3673F5]/80"
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
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <DialogComponent open={open} onOpenChange={onOpenChange}>
      <DialogContentComponent
        className={`overflow-hidden ${
          isMobile ? "w-full" : "w-[448px]"
        } p-0 ${isMobile ? "rounded-t-2xl" : ""}`}
        side={isMobile ? "bottom" : undefined}
      >
        {renderDialogHeader()}
        {renderContent()}
      </DialogContentComponent>
    </DialogComponent>
  );
};

export default MintDialog;
