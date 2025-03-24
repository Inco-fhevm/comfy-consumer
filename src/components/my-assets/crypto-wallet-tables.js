"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import ConfidentialSendDialog from "@/components/confidential-send-dialouge";
import { Button } from "@/components/ui/button";
import TransactionDialog from "../transactions/transaction-dialouge";
import { useAccount, useBalance, useChainId } from "wagmi";
import {
  baseSepolia,
  base,
  arbitrumSepolia,
  optimismSepolia,
} from "viem/chains";
import {
  ENCRYPTED_ERC20_CONTRACT_ADDRESS,
  ERC20_CONTRACT_ADDRESS,
} from "@/utils/contracts";
import { useChainBalance } from "@/hooks/use-chain-balance";

const ethereum = { id: 1, name: "Ethereum" };
const polygon = { id: 137, name: "Polygon" };
const arbitrum = { id: 42161, name: "Arbitrum" };
const optimism = { id: 10, name: "Optimism" };

// Define chain IDs more safely to avoid undefined issues
const CHAIN_IDS = {
  BASE_SEPOLIA: baseSepolia?.id || 84532,
  BASE: base?.id || 8453,
  ARBITRUM_SEPOLIA: arbitrumSepolia?.id || 421614,
  OPTIMISM_SEPOLIA: optimismSepolia?.id || 11155420,
  ETHEREUM: 1,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
};

const TOKEN_ADDRESSES = {
  [CHAIN_IDS.BASE_SEPOLIA]: ERC20_CONTRACT_ADDRESS,
  [CHAIN_IDS.BASE]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  [CHAIN_IDS.OPTIMISM_SEPOLIA]: "0x5fd84259d66Cd46513902E18D1f99F3326590d1E",
  [CHAIN_IDS.ETHEREUM]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum Mainnet USDC
  [CHAIN_IDS.POLYGON]: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon USDC
  [CHAIN_IDS.ARBITRUM]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum USDC
  [CHAIN_IDS.OPTIMISM]: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Optimism USDC
};

const USDT_ADDRESSES = {
  [CHAIN_IDS.POLYGON]: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // Polygon USDT
  [CHAIN_IDS.ARBITRUM]: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // Arbitrum USDT
  [CHAIN_IDS.OPTIMISM]: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // Optimism USDT
};

export const AssetTable = ({ title, totalBalance, assets, onActionClick }) => {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [showConfidentialValues, setShowConfidentialValues] = useState(false);
  const [transmittedBalance, setTransmittedBalance] = useState(null);

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

  const { tokenBalance: usdcBalance } = useChainBalance();

  const decryptedValues = {
    cETH: { amount: encryptedBalance, dollarValue: encryptedBalance },
    cUSDT: { amount: encryptedBalance, dollarValue: encryptedBalance },
  };

  const handleRefreshEncrypted = () => fetchEncryptedBalance();

  const toggleConfidentialValues = async () => {
    await handleRefreshEncrypted();
    setShowConfidentialValues(!showConfidentialValues);
  };

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
              ? "$" + encryptedBalance
              : "$******"
            : "$" + Number(usdcBalance?.data?.formatted).toFixed(0)}
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
            let displayValue;
            if (asset.name === "cUSDC") {
              displayValue = {
                amount: encryptedBalance ? encryptedBalance : "*****",
                dollarValue: encryptedBalance ? encryptedBalance : "$******",
              };
            } else {
              displayValue = {
                amount: Number(usdcBalance?.data?.formatted).toFixed(0),
                dollarValue: Number(usdcBalance?.data?.formatted).toFixed(0),
              };
            }

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
                        onClick={() => {
                          setTransmittedBalance(displayValue.amount);
                          setDepositOpen(true);
                        }}
                        disabled={asset.chain !== "Base Sepolia"}
                        className="bg-blue-500 hover:bg-blue-600 rounded-full dark:text-white"
                      >
                        {asset.chain !== "Base Sepolia" ? "Soon" : "Encrypt"}
                      </Button>
                    )}

                    {title === "Encrypted" && (
                      <ConfidentialSendDialog balance={displayValue?.amount} />
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
          activeTab === "Encrypted"
            ? "bg-[#E7EEFE] text-primary"
            : "text-gray-700"
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
  const [transmittedBalance, setTransmittedBalance] = useState(null);
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

  // Sample decrypted values for demonstration
  const decryptedValues = {
    cETH: { amount: encryptedBalance, dollarValue: encryptedBalance },
    cUSDT: { amount: encryptedBalance, dollarValue: encryptedBalance },
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
                  <img
                    src={asset.icon}
                    alt={asset.name}
                    className="w-11 h-11"
                  />
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
                  <div className="text-base font-medium">
                    {displayValue.amount}
                  </div>
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
                    disabled={asset.chain !== "Base Sepolia"}
                    onClick={() => {
                      setTransmittedBalance(displayValue.amount);
                      setDepositOpen(true);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 shadow-none rounded-full w-full text-white"
                  >
                    {asset.chain !== "Base Sepolia" ? "Soon" : "Encrypt"}
                  </Button>
                )}

                {title === "Encrypted" && (
                  <div className="">
                    <ConfidentialSendDialog />
                  </div>
                )}

                <TransactionDialog
                  mode="shield"
                  open={depositOpen}
                  onOpenChange={setDepositOpen}
                  balance={displayValue.amount}
                />
                <TransactionDialog
                  mode="withdraw"
                  open={withdrawOpen}
                  balance={displayValue.amount}
                  onOpenChange={setWithdrawOpen}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CryptoWalletTables = ({ selectedChain }) => {
  const [activeTab, setActiveTab] = useState("Wallet");
  const [walletAssets, setWalletAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalWalletBalance, setTotalWalletBalance] = useState(0);

  const { address, isConnected } = useAccount();

  // Set up all the balance hooks
  // Native token balances
  const ethBalance = useBalance({
    address,
    chainId: CHAIN_IDS.ETHEREUM,
    enabled: isConnected,
  });

  const baseSepoliaUsdc = useBalance({
    address,
    token: TOKEN_ADDRESSES[CHAIN_IDS.BASE_SEPOLIA],
    chainId: CHAIN_IDS.BASE_SEPOLIA,
    enabled: isConnected,
  });

  // USDT balances
  const polygonUsdt = useBalance({
    address,
    token: USDT_ADDRESSES[CHAIN_IDS.POLYGON],
    chainId: CHAIN_IDS.POLYGON,
    enabled: isConnected,
  });

  const arbitrumUsdt = useBalance({
    address,
    token: USDT_ADDRESSES[CHAIN_IDS.ARBITRUM],
    chainId: CHAIN_IDS.ARBITRUM,
    enabled: isConnected,
  });

  const optimismUsdt = useBalance({
    address,
    token: USDT_ADDRESSES[CHAIN_IDS.OPTIMISM],
    chainId: CHAIN_IDS.OPTIMISM,
    enabled: isConnected,
  });

  // Get price data and convert to dollar value (for example purposes)
  const getPriceInUSD = (symbol) => {
    // These would typically come from price APIs, but for simplicity we'll use fixed values
    const prices = {
      ETH: 2000, // $2000 per ETH
      USDC: 1, // $1 per USDC
      USDT: 1, // $1 per USDT
    };
    return prices[symbol] || 0;
  };

  useEffect(() => {
    if (isConnected) {
      setIsLoading(true);

      // Format the balance data into the format required by the component
      const assets = [];
      let totalBalance = 0;

      // Helper function to safely get and format balance data
      const formatBalance = (
        balanceData,
        name,
        symbol,
        dollarMultiplier,
        icon,
        chain
      ) => {
        if (balanceData && balanceData.formatted) {
          const amount = parseFloat(balanceData.formatted);
          const dollarValue = amount * dollarMultiplier;
          totalBalance += dollarValue;

          return {
            name,
            amount: amount.toFixed(symbol === "ETH" ? 4 : 2),
            dollarValue: dollarValue,
            icon,
            chain,
          };
        }
        return null;
      };

      // Add ETH on Ethereum
      const ethAsset = formatBalance(
        ethBalance.data,
        "ETH",
        "ETH",
        getPriceInUSD("ETH"),
        "/icons/eth.svg",
        "Ethereum"
      );
      if (ethAsset) assets.push(ethAsset);

      // Add USDC on Base Sepolia
      const usdcAsset = formatBalance(
        baseSepoliaUsdc.data,
        "USDC",
        "USDC",
        getPriceInUSD("USDC"),
        "/icons/usdc-base.svg",
        "Base Sepolia"
      );
      if (usdcAsset) assets.push(usdcAsset);

      // Add USDT on Polygon
      const polygonUsdtAsset = formatBalance(
        polygonUsdt.data,
        "USDT",
        "USDT",
        getPriceInUSD("USDT"),
        "/icons/usdt-polygon.svg",
        "Polygon"
      );
      if (polygonUsdtAsset) assets.push(polygonUsdtAsset);

      // Add USDT on Arbitrum
      const arbitrumUsdtAsset = formatBalance(
        arbitrumUsdt.data,
        "USDT",
        "USDT",
        getPriceInUSD("USDT"),
        "/icons/usdt-arbitrum.svg",
        "Arbitrum"
      );
      if (arbitrumUsdtAsset) assets.push(arbitrumUsdtAsset);

      // Add USDT on Optimism
      const optimismUsdtAsset = formatBalance(
        optimismUsdt.data,
        "USDT",
        "USDT",
        getPriceInUSD("USDT"),
        "/icons/usdt-optimism.svg",
        "Optimism"
      );
      if (optimismUsdtAsset) assets.push(optimismUsdtAsset);

      // If no assets were found, add placeholders for better UX
      if (assets.length === 0) {
        assets.push({
          name: "USDC",
          amount: "0.00",
          dollarValue: 0,
          icon: "/icons/usdc-base.svg",
          chain: "Base Sepolia",
        });

        assets.push({
          name: "ETH",
          amount: "0.0000",
          dollarValue: 0,
          icon: "/icons/eth.svg",
          chain: "Ethereum",
        });
      }

      setWalletAssets(assets);
      setTotalWalletBalance(totalBalance);
      setIsLoading(false);
    } else {
      // Set some placeholder data if not connected
      setWalletAssets([
        {
          name: "USDC",
          amount: "0.00",
          dollarValue: 0,
          icon: "/icons/usdc-base.svg",
          chain: "Base Sepolia",
        },
        {
          name: "ETH",
          amount: "0.0000",
          dollarValue: 0,
          icon: "/icons/eth.svg",
          chain: "Ethereum",
        },
      ]);
      setTotalWalletBalance(0);
      setIsLoading(false);
    }
  }, [
    isConnected,
    ethBalance.data,
    baseSepoliaUsdc.data,
    polygonUsdt.data,
    arbitrumUsdt.data,
    optimismUsdt.data,
  ]);

  // Encrypted assets (unchanged)
  const encryptedAssets = [
    {
      name: "cUSDC",
      amount: "*****",
      dollarValue: "$******",
      icon: "/icons/usdc-base.svg",
      chain: "Base Sepolia",
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

  // Handle encrypt/decrypt actions
  const handleEncrypt = (asset) => {
    console.log(`Encrypting ${asset.name} on ${asset.chain}`);
  };

  const handleDecrypt = (asset) => {
    console.log(`Decrypting ${asset.name} on ${asset.chain}`);
  };

  // Calculate total for filtered assets
  const filteredTotalBalance = filteredWalletAssets.reduce(
    (sum, asset) => sum + asset.dollarValue,
    0
  );

  return (
    <div>
      {isLoading ? (
        <div className="text-center py-8">Loading balances...</div>
      ) : (
        <>
          {/* Mobile view with tabs */}
          <div className="md:hidden">
            <WalletTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === "Wallet" && (
              <MobileAssetTable
                title="Wallet"
                totalBalance={filteredTotalBalance}
                assets={filteredWalletAssets}
                onActionClick={handleEncrypt}
              />
            )}

            {activeTab === "Encrypted" && (
              <MobileAssetTable
                title="Encrypted"
                totalBalance={28000}
                assets={filteredEncryptedAssets}
                onActionClick={handleDecrypt}
              />
            )}
          </div>

          {/* Desktop view with original AssetTable components */}
          <div className="hidden md:grid md:grid-cols-2 md:gap-4">
            <AssetTable
              title="Wallet"
              totalBalance={filteredTotalBalance}
              assets={filteredWalletAssets}
              onActionClick={handleEncrypt}
            />
            <AssetTable
              title="Encrypted"
              totalBalance={28000}
              assets={filteredEncryptedAssets}
              onActionClick={handleDecrypt}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CryptoWalletTables;
