"use client";
import React, { useState, useMemo } from "react";
import { useAccount, useBalance } from "wagmi";
import { baseSepolia } from "viem/chains";
import { AssetTable } from "./asset-tables";
import WalletTabs from "./wallet-tabs";
import MobileAssetTable from "./mobile-asset-table";
import { Asset, CryptoWalletTablesProps } from "@/types/wallet";
import { useContracts } from "@/context/contract-provider";

const BASE_SEPOLIA_CHAIN_ID = baseSepolia?.id || 84532;
const USDC_PRICE = 1;

const CryptoWalletTables: React.FC<CryptoWalletTablesProps> = () => {
  const [activeTab, setActiveTab] = useState<string>("Wallet");
  const { address, isConnected } = useAccount();
  const { contracts } = useContracts();
  const ERC20_CONTRACT_ADDRESS = contracts?.erc20?.address;

  const baseSepoliaUsdc = useBalance({
    address,
    token: ERC20_CONTRACT_ADDRESS as `0x${string}`,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    query: {
      enabled: !!address && !!ERC20_CONTRACT_ADDRESS,
      refetchInterval: 3000,
    },
  });

  const walletAssets = useMemo((): Asset[] => {
    if (!isConnected || !baseSepoliaUsdc.data?.formatted) {
      return [{
        name: "USDC",
        amount: 0,
        dollarValue: 0,
        icon: "/icons/usdc-base.svg",
        chain: "Base Sepolia",
        isEncrypted: false,
      }];
    }

    const amount = parseFloat(baseSepoliaUsdc.data.formatted);
    return [{
      name: "USDC",
      amount,
      dollarValue: amount * USDC_PRICE,
      icon: "/icons/usdc-base.svg",
      chain: "Base Sepolia",
      isEncrypted: false,
    }];
  }, [isConnected, baseSepoliaUsdc.data?.formatted]);

  const totalWalletBalance = useMemo(() => 
    walletAssets.reduce((sum, asset) => sum + (typeof asset.dollarValue === 'number' ? asset.dollarValue : 0), 0),
    [walletAssets]
  );

  const encryptedAssets: Asset[] = [{
    name: "cUSDC",
    amount: "*****",
    dollarValue: "$******",
    icon: "/tokens/confidential/usdc-base.png",
    chain: "Base Sepolia",
    isEncrypted: true,
  }];

  const handleEncrypt = (asset: Asset): void => {
    console.log(`Encrypting ${asset.name} on ${asset.chain}`);
  };

  const handleDecrypt = (asset: Asset): void => {
    console.log(`Decrypting ${asset.name} on ${asset.chain}`);
  };

  const isLoading = baseSepoliaUsdc.isLoading;

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
                totalBalance={totalWalletBalance}
                assets={walletAssets}
                onActionClick={handleEncrypt}
              />
            )}

            {activeTab === "Encrypted" && (
              <MobileAssetTable
                title="Encrypted"
                totalBalance={28000}
                assets={encryptedAssets}
                onActionClick={handleDecrypt}
              />
            )}
          </div>

          {/* Desktop view with original AssetTable components */}
          <div className={`hidden md:grid md:grid-cols-2 md:gap-4`}>
            <AssetTable
              title="Wallet"
              totalBalance={totalWalletBalance}
              assets={walletAssets}
              onActionClick={handleEncrypt}
            />

            <AssetTable
              title="Encrypted"
              totalBalance={28000}
              assets={encryptedAssets}
              onActionClick={handleDecrypt}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CryptoWalletTables;