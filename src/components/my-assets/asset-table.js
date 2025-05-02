import { useChainBalance } from "@/hooks/use-chain-balance";
import { AlertCircle, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useWalletClient } from "wagmi";
import { Button } from "../ui/button";
import ConfidentialSendDialog from "../confidential-send-dialouge";
import TransactionDialog from "../transactions/transaction-dialouge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export const AssetTable = ({ title, totalBalance, assets, onActionClick }) => {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [showConfidentialValues, setShowConfidentialValues] = useState(false);
  const [transmittedBalance, setTransmittedBalance] = useState(null);

  const { encryptedBalance, fetchEncryptedBalance, isEncryptedLoading, encryptedError } = useChainBalance();
  const walletClient = useWalletClient();
  const { tokenBalance: usdcBalance } = useChainBalance();

  const handleRefreshEncrypted = (w0) => fetchEncryptedBalance(w0);

  const toggleConfidentialValues = async () => {
    if (!showConfidentialValues) {
      try {
        await handleRefreshEncrypted(walletClient);
      } catch (err) {
        console.error("Failed to refresh encrypted balance:", err);
        // Continue showing UI even if there's an error
      }
    }
    setShowConfidentialValues(!showConfidentialValues);
  };
  
  // Handle retry when there's an error
  const handleRetry = async () => {
    if (showConfidentialValues && encryptedError) {
      try {
        await handleRefreshEncrypted(walletClient);
      } catch (err) {
        console.error("Failed to retry loading encrypted balance:", err);
      }
    }
  };

  // Helper function to render the balance display
  const renderBalanceDisplay = () => {
    if (title === "Encrypted") {
      if (showConfidentialValues) {
        if (isEncryptedLoading) {
          return (
            <div className="flex items-center">
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              <span>Loading...</span>
            </div>
          );
        } else if (encryptedError) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center text-red-500" onClick={handleRetry}>
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>Error</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to retry</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        return encryptedBalance ? "$" + Number(encryptedBalance).toLocaleString() : "$0.00";
      }
      return "$******";
    }
    return "$" + Number(usdcBalance?.data?.formatted || 0).toLocaleString();
  };

  return (
    <div className="border rounded-3xl shadow-sm mb-4">
      <div className="flex justify-between items-center mb-4 border-b p-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="text-xl font-semibold">
          {renderBalanceDisplay()}
        </div>
        {title === "Encrypted" && (
          <button className="" onClick={toggleConfidentialValues}>
            {showConfidentialValues ? (
              <EyeOff
                className="w-6 h-6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
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
            )}
          </button>
        )}
      </div>
      <table className="w-full">
        <thead className="">
          <tr className="text-sm text-gray-500">
            <th className="text-left font-normal pb-4 pl-6">Name</th>
            <th className="text-left font-normal pb-4 pl-6">Amount</th>
            <th className="text-right font-normal pb-4 pl-6"></th>
          </tr>
        </thead>
        <tbody className="">
          {assets.map((asset, index) => {
            let displayValue;
            if (asset.name === "cUSDC") {
              if (title === "Encrypted" && !showConfidentialValues) {
                // Hidden confidential values
                displayValue = {
                  amount: "*****",
                  dollarValue: "$******",
                };
              } else if (showConfidentialValues) {
                if (isEncryptedLoading) {
                  // Loading state when values are visible
                  const loadingDisplay = (
                    <div className="flex items-center">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      <span className="text-sm">Loading</span>
                    </div>
                  );
                  displayValue = {
                    amount: loadingDisplay,
                    dollarValue: loadingDisplay,
                  };
                } else if (encryptedError) {
                  // Error state
                  const errorDisplay = (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center text-red-500" onClick={handleRetry}>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          <span className="text-sm">Error</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to retry</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                  displayValue = {
                    amount: errorDisplay,
                    dollarValue: errorDisplay,
                  };
                } else {
                  // Normal display with values
                  displayValue = {
                    amount: encryptedBalance ? Number(encryptedBalance).toLocaleString() : "0.00",
                    dollarValue: encryptedBalance ? "$" + Number(encryptedBalance).toLocaleString() : "$0.00",
                  };
                }
              } else {
                // Fallback
                displayValue = {
                  amount: "*****",
                  dollarValue: "$******",
                };
              }
            } else {
              // Non-cUSDC assets
              displayValue = {
                amount: Number(usdcBalance?.data?.formatted || 0).toLocaleString(),
                dollarValue: "$" + Number(usdcBalance?.data?.formatted || 0).toLocaleString(),
              };
            }

            return (
              <tr key={index}>
                <td className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <Image
                      src={asset.icon}
                      alt={asset.name}
                      width={44}
                      height={44}
                    />
                    <div>
                      <div className="font-medium">{asset.name}</div>
                      {asset.chain !== "Ethereum" && (
                        <div className="text-sm text-gray-500">
                          on {asset.chain}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 pl-6">
                  <div>
                    <div>{displayValue.amount}</div>
                    <div className="text-gray-500">
                      {displayValue.dollarValue}
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-6 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {title === "Encrypted" ? (
                      <>
                        <Button
                          onClick={() => setWithdrawOpen(true)}
                          className="rounded-full"
                          variant="outline"
                          // disabled={isEncryptedLoading}
                        >
                          Unshield
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => {
                          setTransmittedBalance(displayValue.amount);
                          setDepositOpen(true);
                        }}
                        disabled={asset.chain !== "Base Sepolia"}
                        className="bg-blue-500 hover:bg-blue-600 rounded-full dark:text-white"
                      >
                        {asset.chain !== "Base Sepolia" ? "Soon" : "Shield"}
                      </Button>
                    )}

                    {title === "Encrypted" && (
                      <ConfidentialSendDialog
                        balance={
                          !showConfidentialValues
                            ? "*****"
                            : isEncryptedLoading
                              ? "loading"
                              : encryptedError
                                ? "error"
                                : typeof displayValue.amount === "string"
                                  ? displayValue.amount
                                  : encryptedBalance 
                                    ? Number(encryptedBalance).toLocaleString()
                                    : "0.00"
                        }
                        disabled={isEncryptedLoading || (encryptedError && showConfidentialValues)}
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