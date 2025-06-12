
import React from "react";
import { WalletTabsProps } from "@/types/wallet";

const WalletTabs: React.FC<WalletTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex rounded-full border mb-4">
      <button
        className={`flex-1 text-center py-2 px-4 rounded-full text-sm font-semibold ${
          activeTab === "Wallet" ? "bg-[#E7EEFE] dark:bg-muted text-primary" : "text-gray-700 dark:text-muted-foreground"
        }`}
        onClick={() => setActiveTab("Wallet")}
      >
        Wallet
      </button>
      <button
        className={`flex-1 text-center py-2 px-4 rounded-full text-sm font-semibold ${
          activeTab === "Encrypted"
            ? "bg-[#E7EEFE] dark:bg-muted text-primary"
            : "text-gray-700"
        }`}
        onClick={() => setActiveTab("Encrypted")}
      >
        Encrypted
      </button>
    </div>
  );
};

export default WalletTabs;