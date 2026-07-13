"use client";
import React, { useState } from "react";
import { AssetTable } from "./asset-tables";
import WalletTabs from "./wallet-tabs";
import MobileAssetTable from "./mobile-asset-table";
import { useTokenRegistry } from "@/context/token-registry-provider";

const CryptoWalletTables: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("Wallet");
  const { tokens } = useTokenRegistry();

  return (
    <div>
      {/* Mobile view with tabs */}
      <div className="md:hidden">
        <WalletTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "Wallet" && (
          <MobileAssetTable title="Wallet" variant="wallet" tokens={tokens} />
        )}

        {activeTab === "Encrypted" && (
          <MobileAssetTable
            title="Encrypted"
            variant="encrypted"
            tokens={tokens}
          />
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-4">
        <AssetTable title="Wallet" variant="wallet" tokens={tokens} />
        <AssetTable title="Encrypted" variant="encrypted" tokens={tokens} />
      </div>
    </div>
  );
};

export default CryptoWalletTables;
