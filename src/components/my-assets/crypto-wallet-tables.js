"use client";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import ConfidentialSendDialog from "@/components/confidential-send-dialouge";
import { Button } from "@/components/ui/button";
import TransactionDialog from "../transactions/transaction-dialouge";

// Keep the original AssetTable component untouched for desktop use
// This is exactly as provided in your paste.txt file
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
    <div className="border rounded-3xl shadow-sm mb-4">
      <div className="flex justify-between items-center mb-4 border-b p-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="text-xl font-semibold">
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
          <button className="p-2" onClick={toggleConfidentialValues}>
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
            const displayValue = getDisplayValue(asset);

            return (
              <tr key={index}>
                <td className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={asset.icon}
                      alt={asset.name}
                      className="w-11 h-11"
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
                      {typeof displayValue.dollarValue === "number"
                        ? "$" + displayValue.dollarValue.toLocaleString()
                        : displayValue.dollarValue}
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-6 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {title === "Encrypted" ? (
                      <Button
                        onClick={() => setWithdrawOpen(true)}
                        className="rounded-full"
                        variant="outline"
                      >
                        Decrypt
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setDepositOpen(true)}
                        className="bg-blue-500 hover:bg-blue-600 rounded-full dark:text-white"
                      >
                        Encrypt
                      </Button>
                    )}

                    {title === "Encrypted" && <ConfidentialSendDialog />}
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

// Create a tabs component for mobile view
const WalletTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex rounded-full border mb-4">
      <button
        className={`flex-1 text-center py-2 px-4 rounded-full text-sm font-semibold ${
          activeTab === "Wallet" ? "bg-[#E7EEFE] text-primary" : "text-gray-700"
        }`}
        onClick={() => setActiveTab("Wallet")}
      >
        Wallet
      </button>
      <button
        className={`flex-1 text-center py-2 px-4 rounded-full text-sm font-semibold ${
          activeTab === "Encrypted" ? "bg-[#E7EEFE] text-primary" : "text-gray-700"
        }`}
        onClick={() => setActiveTab("Encrypted")}
      >
        Encrypted
      </button>
    </div>
  );
};

// Create a mobile-optimized version of the AssetTable
const MobileAssetTable = ({ title, totalBalance, assets, onActionClick }) => {
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
        <h2 className="md:text-lg text-xl font-semibold">{title}</h2>
        <div className="md:text-lg text-xl font-semibold">
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
                  <img src={asset.icon} alt={asset.name} className="w-11 h-11" />
                  <div>
                    <div className="font-medium text-base">{asset.name}</div>
                    {asset.chain !== "Ethereum" && (
                      <div className="text-xs text-gray-500">
                        on {asset.chain}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-medium">{displayValue.amount}</div>
                  <div className="text-gray-500 text-sm font-medium">
                    {typeof displayValue.dollarValue === "number"
                      ? "$" + displayValue.dollarValue.toLocaleString()
                      : displayValue.dollarValue}
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
                    onClick={() => setDepositOpen(true)}
                    className="bg-blue-500 hover:bg-blue-600 shadow-none rounded-full w-full text-white"
                  >
                    Encrypt
                  </Button>
                )}

                {title === "Encrypted" && (
                  <div className="">
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

const CryptoWalletTables = ({ selectedChain }) => {
  const [activeTab, setActiveTab] = useState("Wallet");

  // Regular wallet assets
  const walletAssets = [
    {
      name: "ETH",
      amount: "2",
      dollarValue: 4000,
      icon: "/icons/eth.svg",
      chain: "Ethereum",
    },
    {
      name: "USDT",
      amount: "4,000",
      dollarValue: 4000,
      icon: "/icons/usdt-polygon.svg",
      chain: "Polygon",
    },
    {
      name: "USDT",
      amount: "4,000",
      dollarValue: 4000,
      icon: "/icons/usdt-arbitrum.svg",
      chain: "Arbitrum",
    },
    {
      name: "USDT",
      amount: "4,000",
      dollarValue: 4000,
      icon: "/icons/usdt-optimism.svg",
      chain: "Optimism",
    },
  ];

  // Encrypted assets
  const encryptedAssets = [
    {
      name: "cETH",
      amount: "*****",
      dollarValue: "$******",
      icon: "/tokens/confidential/c-eth.png",
      chain: "Ethereum",
    },
    {
      name: "cUSDT",
      amount: "*****",
      dollarValue: "$******",
      icon: "/tokens/confidential/usdt-polygon.png",
      chain: "Polygon",
    },
    {
      name: "cUSDT",
      amount: "*****",
      dollarValue: "$******",
      icon: "/tokens/confidential/usdt-arbitrum.png",
      chain: "Arbitrum",
    },
  ];

  // Filter assets based on selected chain
  const filteredWalletAssets =
    selectedChain === "All Chains"
      ? walletAssets
      : walletAssets.filter((asset) => asset.chain === selectedChain);

  const filteredEncryptedAssets =
    selectedChain === "All Chains"
      ? encryptedAssets
      : encryptedAssets.filter((asset) => asset.chain === selectedChain);

  // Calculate total balances
  const walletTotalBalance = filteredWalletAssets.reduce(
    (sum, asset) => sum + asset.dollarValue,
    0
  );

  const encryptedTotalBalance = 28000;

  // Handle encrypt/decrypt actions
  const handleEncrypt = (asset) => {
    console.log(`Encrypting ${asset.name} on ${asset.chain}`);
  };

  const handleDecrypt = (asset) => {
    console.log(`Decrypting ${asset.name} on ${asset.chain}`);
  };

  return (
    <div>
      {/* Mobile view with tabs */}
      <div className="md:hidden">
        <WalletTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "Wallet" && (
          <MobileAssetTable
            title="Wallet"
            totalBalance={walletTotalBalance}
            assets={filteredWalletAssets}
            onActionClick={handleEncrypt}
          />
        )}

        {activeTab === "Encrypted" && (
          <MobileAssetTable
            title="Encrypted"
            totalBalance={encryptedTotalBalance}
            assets={filteredEncryptedAssets}
            onActionClick={handleDecrypt}
          />
        )}
      </div>

      {/* Desktop view with original AssetTable components */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-4">
        <AssetTable
          title="Wallet"
          totalBalance={walletTotalBalance}
          assets={filteredWalletAssets}
          onActionClick={handleEncrypt}
        />
        <AssetTable
          title="Encrypted"
          totalBalance={encryptedTotalBalance}
          assets={filteredEncryptedAssets}
          onActionClick={handleDecrypt}
        />
      </div>
    </div>
  );
};

export default CryptoWalletTables;
