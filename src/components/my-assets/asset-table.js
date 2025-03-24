"use client";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import ConfidentialSendDialog from "@/components/confidential-send-dialouge";
import { Button } from "@/components/ui/button";
import TransactionDialog from "../transactions/transaction-dialouge";

// Create a tabs component for mobile view
export const WalletTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex rounded-full bg-gray-100 p-1 mb-4">
      <button
        className={`flex-1 text-center py-2 px-4 rounded-full text-sm font-medium ${
          activeTab === "Wallet" ? "bg-blue-500 text-white" : "text-gray-700"
        }`}
        onClick={() => setActiveTab("Wallet")}
      >
        Wallet
      </button>
      <button
        className={`flex-1 text-center py-2 px-4 rounded-full text-sm font-medium ${
          activeTab === "Encrypted" ? "bg-blue-500 text-white" : "text-gray-700"
        }`}
        onClick={() => setActiveTab("Encrypted")}
      >
        Encrypted
      </button>
    </div>
  );
};

export const AssetTable = ({ title, totalBalance, assets, onActionClick }) => {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [showConfidentialValues, setShowConfidentialValues] = useState(false);

  // Sample decrypted values for demonstration
  const decryptedValues = {
    cETH: { amount: "1.5", dollarValue: 3000 },
    cUSDT: { amount: "25000", dollarValue: 25000 },
  };

  // Toggle showing confidential values
  const toggleConfidentialValues = () => {
    console.log("toggle");
    setShowConfidentialValues(!showConfidentialValues);
  };

  // Get displayed value based on confidentiality settings
  const getDisplayValue = (asset) => {
    if (title !== "Encrypted" || !showConfidentialValues) {
      return {
        amount: asset.amount,
        dollarValue: asset.dollarValue,
      };
    }

    // Return decrypted values if available
    const decrypted = decryptedValues[asset.name];
    if (decrypted) {
      return {
        amount: decrypted.amount,
        dollarValue: decrypted.dollarValue,
      };
    }

    return {
      amount: asset.amount,
      dollarValue: asset.dollarValue,
    };
  };

  return (
    <div className="border rounded-xl shadow-sm mb-4">
      <div className="flex justify-between items-center border-b p-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="text-lg font-semibold">
          {title === "Encrypted"
            ? showConfidentialValues
              ? "$" +
                (
                  decryptedValues["cETH"].dollarValue +
                  decryptedValues["cUSDT"].dollarValue * 2
                ).toLocaleString()
              : "$******"
            : "$" + totalBalance.toLocaleString()}
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
        <div className="flex justify-between text-sm text-gray-500 py-2">
          <div>Name</div>
          <div>Amount</div>
        </div>
        {assets.map((asset, index) => {
          const displayValue = getDisplayValue(asset);

          return (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <img src={asset.icon} alt={asset.name} className="w-8 h-8" />
                  <div>
                    <div className="font-medium">{asset.name}</div>
                    {asset.chain !== "Ethereum" && (
                      <div className="text-xs text-gray-500">
                        on {asset.chain}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div>{displayValue.amount}</div>
                  <div className="text-gray-500 text-sm">
                    {typeof displayValue.dollarValue === "number"
                      ? "$" + displayValue.dollarValue.toLocaleString()
                      : displayValue.dollarValue}
                  </div>
                </div>
              </div>
              <div className="w-full">
                {title === "Encrypted" ? (
                  <Button
                    onClick={() => setWithdrawOpen(true)}
                    className="rounded-full w-full"
                    variant="outline"
                  >
                    Decrypt
                  </Button>
                ) : (
                  <Button
                    onClick={() => setDepositOpen(true)}
                    className="bg-blue-500 hover:bg-blue-600 rounded-full w-full text-white"
                  >
                    Encrypt
                  </Button>
                )}

                {title === "Encrypted" && (
                  <div className="mt-2">
                    <ConfidentialSendDialog />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TransactionDialog
        mode="shield"
        open={depositOpen}
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
