// components/MobileAssetTable.tsx
"use client";
import React, { useState } from "react";
import {  EyeOff } from "lucide-react";
import Image from "next/image";
import { useWalletClient } from "wagmi";
// import ConfidentialSendDialog from "@/components/confidential-send-dialouge";
import { Button } from "@/components/ui/button";
// import TransactionDialog from "../transactions/transaction-dialouge";
import { useChainBalance } from "@/context/chain-balance-provider";
import { formatNumber, formatCurrency } from "@/lib/format-number";
import { MobileAssetTableProps, Asset } from "@/types/wallet";

const MobileAssetTable: React.FC<MobileAssetTableProps> = ({ 
  title, 
  totalBalance, 
  assets, 
  onActionClick 
}) => {
  const [depositOpen, setDepositOpen] = useState<boolean>(false);
  const [withdrawOpen, setWithdrawOpen] = useState<boolean>(false);
  const [showConfidentialValues, setShowConfidentialValues] = useState<boolean>(false);
  const [transmittedBalance, setTransmittedBalance] = useState<string | null>(null);
  
  const walletClient = useWalletClient();

  const {
    encryptedBalance,
    isEncryptedLoading,
    encryptedError,
    fetchEncryptedBalance,
  } = useChainBalance();

  const handleRefreshEncrypted = (w0: any) => fetchEncryptedBalance(w0);

  const toggleConfidentialValues = async (): Promise<void> => {
    if (!showConfidentialValues) {
      await handleRefreshEncrypted(walletClient);
    }
    setShowConfidentialValues(!showConfidentialValues);
  };

  const getDisplayValue = (asset: Asset) => {
    if (title === "Encrypted" && asset.name === "cUSDC") {
      if (!showConfidentialValues) {
        return {
          amount: "*****",
          dollarValue: "$******",
        };
      } else {
        const formattedBalance = encryptedBalance ? formatNumber(encryptedBalance) : "*****";
        const formattedDollarValue = encryptedBalance ? formatCurrency(encryptedBalance) : "$******";
        return {
          amount: formattedBalance,
          dollarValue: formattedDollarValue,
        };
      }
    } else {
      const formattedAmount = typeof asset.amount === "number" ? formatNumber(asset.amount) : asset.amount;
      const formattedDollarValue = typeof asset.dollarValue === "number" ? formatCurrency(asset.dollarValue) : asset.dollarValue;
      
      return {
        amount: formattedAmount,
        dollarValue: formattedDollarValue,
      };
    }
  };

  const getFormattedTotalBalance = (): string => {
    if (title === "Encrypted") {
      return showConfidentialValues 
        ? formatCurrency(encryptedBalance || 0)
        : "$******";
    } else {
      return formatCurrency(totalBalance);
    }
  };

  return (
    <div className="border rounded-xl shadow-sm mb-4">
      <div className="flex justify-between items-center border-b p-4">
        <h2 className="md:text-lg text-xl font-semibold">{title}</h2>
        <div className="text-xl font-semibold break-all leading-tight max-w-xs overflow-wrap-anywhere">
          {getFormattedTotalBalance()}
        </div>
        {title === "Encrypted" && (
          <button className="p-1" onClick={toggleConfidentialValues}>
            {showConfidentialValues ? (
              <EyeOff
                className="w-5 h-5"
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
                className="w-5 h-5"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      <div className="px-4">
        <div className="flex justify-between text-sm text-gray-500 md:py-2 py-6">
          <div>Name</div>
          <div>Amount</div>
        </div>
        {assets.map((asset, index) => {
          const displayValue = getDisplayValue(asset);

          return (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Image
                    src={asset.icon}
                    alt={asset.name}
                    width={44}
                    height={44}
                  />
                  <div>
                    <div className="font-medium text-base">{asset.name}</div>
                    <div className="text-xs text-gray-500">
                      on {asset.chain}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-medium break-all leading-tight max-w-full overflow-wrap-anywhere">
                    {displayValue.amount}
                  </div>
                  <div className="text-gray-500 text-sm font-medium break-all leading-tight max-w-full overflow-wrap-anywhere">
                    {displayValue.dollarValue}
                  </div>
                </div>
              </div>
              <div className="w-full flex gap-2 items-center mt-4">
                {title === "Encrypted" ? (
                  <Button
                    onClick={() => setWithdrawOpen(true)}
                    className="rounded-full w-full shadow-none"
                    variant="outline"
                  >
                    Decrypt
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setTransmittedBalance(displayValue.amount.toString());
                      setDepositOpen(true);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 shadow-none rounded-full w-full text-white"
                  >
                    Encrypt
                  </Button>
                )}

                {/* {title === "Encrypted" && (
                  <div className="">
                    <ConfidentialSendDialog
                      balance={
                        !showConfidentialValues ? "*****" : displayValue.amount.toString()
                      }
                    />
                  </div>
                )} */}

                {/* <TransactionDialog
                  mode="shield"
                  open={depositOpen}
                  onOpenChange={setDepositOpen}
                  balance={displayValue.amount.toString()}
                />
                <TransactionDialog
                  mode="withdraw"
                  open={withdrawOpen}
                  balance={
                    showConfidentialValues ? displayValue.amount.toString() : "*****"
                  }
                  onOpenChange={setWithdrawOpen}
                /> */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileAssetTable;