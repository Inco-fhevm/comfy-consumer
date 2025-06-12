import React, { useState } from "react";
import { useChainBalance } from "@/context/chain-balance-provider";
import { AlertCircle, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { useWalletClient } from "wagmi";
import { Button } from "../ui/button";
import ConfidentialSendDialog from "../confidential-send-dialouge";
import TransactionDialog from "../transaction/transaction-dialouge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatNumber, formatCurrency } from "@/lib/format-number";
import { AssetTableProps, Asset, DisplayValue } from "@/types/asset-table";
import IconBuilder from "../icon-builder";

// Reusable components
const LoadingDisplay = ({ size = "w-4 h-4" }: { size?: string }) => (
  <div className="flex items-center">
    <Loader2 className={`${size} mr-1 animate-spin`} />
  </div>
);

const ErrorDisplay = ({
  onClick,
  size = "w-4 h-4",
}: {
  onClick: () => void;
  size?: string;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger
        className="flex items-center text-red-500"
        onClick={onClick}
      >
        <AlertCircle className={`${size} mr-1`} />
        <span className={size === "w-3 h-3" ? "text-sm" : ""}>Error</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Click to retry</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const AssetTable: React.FC<AssetTableProps> = ({ title, assets }) => {
  const [depositOpen, setDepositOpen] = useState<boolean>(false);
  const [withdrawOpen, setWithdrawOpen] = useState<boolean>(false);
  const [showConfidentialValues, setShowConfidentialValues] =
    useState<boolean>(false);
  const [transmittedBalance, setTransmittedBalance] = useState<string | null>(
    null
  );

  const {
    encryptedBalance,
    fetchEncryptedBalance,
    isEncryptedLoading,
    encryptedError,
    tokenBalance: usdcBalance,
  } = useChainBalance();

  const walletClient = useWalletClient();
  const isEncrypted = title === "Encrypted";

  // Helper functions
  const handleRefreshEncrypted = () => fetchEncryptedBalance(walletClient);

  const handleRetry = async (): Promise<void> => {
    if (showConfidentialValues && encryptedError) {
      try {
        await handleRefreshEncrypted();
      } catch (err) {
        console.error("Failed to retry loading encrypted balance:", err);
      }
    }
  };

  const toggleConfidentialValues = async (): Promise<void> => {
    if (!showConfidentialValues) {
      try {
        await handleRefreshEncrypted();
      } catch (err) {
        console.error("Failed to refresh encrypted balance:", err);
      }
    }
    setShowConfidentialValues(!showConfidentialValues);
  };

  const getEncryptedDisplayValue = (): string | React.ReactNode => {
    if (!showConfidentialValues) return "$******";
    if (isEncryptedLoading) return <LoadingDisplay />;
    if (encryptedError) return <ErrorDisplay onClick={handleRetry} />;
    return encryptedBalance ? formatCurrency(encryptedBalance) : "$0.00";
  };

  const getWalletDisplayValue = (): string => {
    const balance = Number(usdcBalance?.data?.formatted) || 0;
    return formatCurrency(balance);
  };

  const renderBalanceDisplay = (): string | React.ReactNode => {
    return isEncrypted ? getEncryptedDisplayValue() : getWalletDisplayValue();
  };

  const getAssetDisplayValue = (asset: Asset): DisplayValue => {
    const isConfidentialAsset = asset.name === "cUSDC";

    if (!isConfidentialAsset) {
      // Regular assets
      if (
        typeof asset.amount === "number" &&
        typeof asset.dollarValue === "number"
      ) {
        return {
          amount: formatNumber(asset.amount),
          dollarValue: formatCurrency(asset.dollarValue),
        };
      }
      const balance = Number(usdcBalance?.data?.formatted) || 0;
      return {
        amount: formatNumber(balance),
        dollarValue: formatCurrency(balance),
      };
    }

    // Confidential assets (cUSDC)
    if (!showConfidentialValues) {
      return {
        amount: "*****",
        dollarValue: "$******",
      };
    }

    if (isEncryptedLoading) {
      const loadingDisplay = <LoadingDisplay size="w-3 h-3" />;
      return {
        amount: loadingDisplay,
        dollarValue: loadingDisplay,
      };
    }

    if (encryptedError) {
      const errorDisplay = (
        <ErrorDisplay onClick={handleRetry} size="w-3 h-3" />
      );
      return {
        amount: errorDisplay,
        dollarValue: errorDisplay,
      };
    }

    return {
      amount: encryptedBalance ? formatNumber(encryptedBalance) : "0.00",
      dollarValue: encryptedBalance
        ? formatCurrency(encryptedBalance)
        : "$0.00",
    };
  };

  const getConfidentialSendBalance = (displayValue: DisplayValue): string => {
    if (!showConfidentialValues) return "*****";
    if (isEncryptedLoading) return "loading";
    if (encryptedError) return "error";

    return typeof displayValue.amount === "string"
      ? displayValue.amount
      : encryptedBalance
        ? formatNumber(encryptedBalance)
        : "0.00";
  };

  return (
    <div className="border rounded-3xl shadow-sm mb-4">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 mb-4 border-b p-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="text-xl font-semibold break-all leading-tight max-w-full md:max-w-xs overflow-wrap-anywhere">
          {renderBalanceDisplay()}
        </div>
        {isEncrypted && (
          <button onClick={toggleConfidentialValues}>
            {showConfidentialValues ? (
              <EyeOff
                className="w-6 h-6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <EyeIcon />
            )}
          </button>
        )}
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="text-sm text-gray-500">
            <th className="text-left font-normal pb-4 pl-6">Name</th>
            <th className="text-left font-normal pb-4 pl-6">Amount</th>
            <th className="text-right font-normal pb-4 pl-6"></th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset, index) => {
            const displayValue = getAssetDisplayValue(asset);

            return (
              <tr key={index}>
                <td className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    {/* <Image src={asset.icon} alt={asset.name} width={44} height={44} /> */}
                    <div className="w-11 h-11">
                      <IconBuilder
                        isEncrypted={asset.isEncrypted}
                        usdcImage={"/tokens/usdc-token.svg"}
                        incoImage={"/tokens/inco-token.svg"}
                        networkImage={"/chains/base-sepolia.svg"}
                      />
                    </div>

                    <div>
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-sm text-gray-500">
                        on {asset.chain}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 pl-6 md:pr-6">
                  <div>
                    <div className="break-all leading-tight max-w-full overflow-wrap-anywhere">
                      {displayValue.amount}
                    </div>
                    <div className="text-gray-500 break-all leading-tight max-w-full overflow-wrap-anywhere">
                      {displayValue.dollarValue}
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-6 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {isEncrypted ? (
                      <Button
                        onClick={() => setWithdrawOpen(true)}
                        className="rounded-full"
                        variant="outline"
                      >
                        Unshield
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setTransmittedBalance(
                            displayValue.amount?.toString() || "0"
                          );
                          setDepositOpen(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 rounded-full dark:text-white"
                      >
                        Shield
                      </Button>
                    )}

                    {isEncrypted && (
                      <ConfidentialSendDialog
                        balance={getConfidentialSendBalance(displayValue)}
                        disabled={
                          isEncryptedLoading ||
                          (encryptedError && showConfidentialValues)
                        }
                        error={encryptedError && showConfidentialValues}
                      />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Dialogs */}
      <TransactionDialog
        mode="shield"
        open={depositOpen}
        balance={transmittedBalance}
        onOpenChange={setDepositOpen}
      />
      <TransactionDialog
        mode="withdraw"
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
      />
    </div>
  );
};
