import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWalletClient } from "wagmi";
import { 
  Shield, LockKeyhole, ArrowRightLeft, Share2, 
  Home, History, Settings, Repeat, Compass 
} from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PinInput } from "@/components/ui/pin-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ConfidentialWallet = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [userBalance, setUserBalance] = useState("Hidden");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [activeSheet, setActiveSheet] = useState("");
  const [pin, setPin] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [shareAddress, setShareAddress] = useState("");
  const [wrapAmount, setWrapAmount] = useState("");

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const chains = [
    { id: "ethereum", name: "Ethereum", totalBalance: "Hidden" },
    { id: "polygon", name: "Polygon", totalBalance: "Hidden" },
  ];

  const assets = [
    { chain: "Ethereum", symbol: "USDC", balance: "Hidden", wrapped: true },
    { chain: "Polygon", symbol: "USDT", balance: "Hidden", wrapped: false },
  ];

  const transactions = [
    { type: "Transfer", amount: "500 USDC", date: "2024-02-04", status: "Hidden" },
    { type: "Wrap", token: "ETH", amount: "1.5", date: "2024-02-04", status: "Hidden" },
    { type: "Share", with: "0x1234...5678", date: "2024-02-03", status: "Hidden" },
  ];

  const handleShare = async () => {
    // Implementation for sharing
    setActiveSheet("");
  };

  const handleWrap = async () => {
    // Implementation for wrapping
    setActiveSheet("");
  };

  const handleDecrypt = async () => {
    setIsDecrypting(true);
    try {
      // Simulated decryption
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUserBalance("1,000");
      setActiveSheet("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsDecrypting(false);
      setPin("");
    }
  };

  const handleSetupPin = async () => {
    try {
      // Here you would implement the actual PIN update logic
      await new Promise(resolve => setTimeout(resolve, 500));
      // Reset states
      setActiveSheet("");
      setSetupPin("");
      setConfirmPin("");
    } catch (error) {
      console.error("Error setting up PIN:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen grid place-items-center bg-black">
        <ConnectButton />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="space-y-4 pb-20">
            <div className="bg-zinc-900 rounded-2xl p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#3673F5]" />
                  <span className="text-zinc-400">Total Balance</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSheet("pin")}
                  disabled={isDecrypting}
                  className="hover:bg-zinc-800 text-white"
                >
                  <LockKeyhole className="h-4 w-4 mr-2" />
                  {isDecrypting ? "Decrypting..." : "Decrypt"}
                </Button>
              </div>
              <div className="text-4xl font-bold text-white">{userBalance}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button 
                className="bg-[#3673F5] hover:bg-[#2861E0] h-12 rounded-xl"
                onClick={() => setActiveSheet("wrap")}
              >
                <Repeat className="h-4 w-4 mr-2" />
                Wrap
              </Button>
              <Button 
                variant="outline"
                className="border-zinc-700 bg-transparent text-white hover:bg-zinc-800 h-12 rounded-xl"
                onClick={() => setActiveSheet("share")}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {chains.map((chain) => (
              <div key={chain.id} className="bg-zinc-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4 text-white">{chain.name}</h2>
                <div className="space-y-3">
                  {assets
                    .filter((asset) => asset.chain === chain.name)
                    .map((asset, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl"
                      >
                        <div>
                          <div className="font-medium text-white">{asset.symbol}</div>
                          <div className="text-sm text-zinc-400">{asset.balance}</div>
                          <Badge 
                            variant={asset.wrapped ? "default" : "outline"}
                            className={`${asset.wrapped ? "bg-[#3673F5]" : "border-zinc-700"} text-xs mt-1 text-white`}
                          >
                            {asset.wrapped ? "Wrapped" : "Unwrapped"}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="hover:bg-zinc-700"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        );
      
      case "history":
        return (
          <div className="pb-20">
            <div className="bg-zinc-900 rounded-2xl p-6">
              <div className="space-y-4">
                {transactions.map((tx, i) => (
                  <div
                    key={i}
                    className="p-3 border-b border-zinc-800 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{tx.type}</div>
                        <div className="text-sm text-zinc-400">
                          {tx.amount || tx.token}
                          {tx.with && <div>To: {tx.with}</div>}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {tx.date}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-zinc-700 text-white">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case "explore":
        return (
          <div className="pb-20 text-center pt-20 text-zinc-400">
            Coming soon...
          </div>
        );
      
      case "settings":
        return (
          <div className="pb-20">
            <div className="bg-zinc-900 rounded-2xl p-6">
              <Button
                variant="outline"
                className="w-full border-zinc-700 bg-transparent text-white hover:bg-zinc-800 h-12 rounded-xl"
                onClick={() => setActiveSheet("setup")}
              >
                Reset PIN
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Confidential</h1>
          <ConnectButton />
        </div>
      </div>

      <div className="p-4">
        {renderContent()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-zinc-800">
        <div className="grid grid-cols-4 h-16">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "history", icon: History, label: "History" },
            { id: "explore", icon: Compass, label: "Explore" },
            { id: "settings", icon: Settings, label: "Settings" }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`flex flex-col items-center justify-center ${
                activeTab === id ? "text-[#3673F5]" : "text-zinc-500"
              }`}
              onClick={() => setActiveTab(id)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Sheets */}
      <Sheet open={activeSheet === "pin"} onOpenChange={() => setActiveSheet("")}>
        <SheetContent side="bottom" className="bg-zinc-900 border-t border-zinc-800">
          <SheetHeader>
            <SheetTitle className="text-white">Enter PIN</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <PinInput
              value={pin}
              onChange={setPin}
              length={6}
              onComplete={handleDecrypt}
              className="gap-2"
            />
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700 bg-transparent hover:bg-zinc-800"
                onClick={() => setActiveSheet("")}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#3673F5] hover:bg-[#2861E0] text-white"
                onClick={handleDecrypt}
                disabled={pin.length !== 6}
              >
                Decrypt
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activeSheet === "setup"} onOpenChange={() => setActiveSheet("")}>
        <SheetContent side="bottom" className="bg-zinc-900 border-t border-zinc-800">
          <SheetHeader>
            <SheetTitle className="text-white">Setup New PIN</SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-6">
            <div>
              <div className="text-sm text-zinc-400 mb-2">Enter New PIN</div>
              <PinInput
                value={setupPin}
                onChange={setSetupPin}
                length={6}
                className="gap-2"
              />
            </div>
            <div>
              <div className="text-sm text-zinc-400 mb-2">Confirm PIN</div>
              <PinInput
                value={confirmPin}
                onChange={setConfirmPin}
                length={6}
                className="gap-2"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700 bg-transparent hover:bg-zinc-800 text-white"
                onClick={() => {
                  setActiveSheet("");
                  setSetupPin("");
                  setConfirmPin("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#3673F5] hover:bg-[#2861E0]"
                disabled={setupPin.length !== 6 || confirmPin.length !== 6 || setupPin !== confirmPin}
                onClick={handleSetupPin}
              >
                Set PIN
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activeSheet === "share"} onOpenChange={() => setActiveSheet("")}>
        <SheetContent side="bottom" className="bg-zinc-900 border-t border-zinc-800">
          <SheetHeader>
            <SheetTitle className="text-white">Share Access</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <input
              type="text"
              placeholder="Enter wallet address"
              value={shareAddress}
              className="w-full bg-transparent text-white focus:outline-none border py-2 px-4 rounded-lg border-zinc-700"
              onChange={(e) => setShareAddress(e.target.value)}
            />
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700 bg-transparent hover:bg-zinc-800 text-white"
                onClick={() => setActiveSheet("")}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#3673F5] hover:bg-[#2861E0]"
                onClick={handleShare}
              >
                Share
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activeSheet === "wrap"} onOpenChange={() => setActiveSheet("")}>
        <SheetContent side="bottom" className="bg-zinc-900 border-t border-zinc-800">
          <SheetHeader>
            <SheetTitle className="text-white">Wrap Token</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <input
              type="number"
              placeholder="Enter amount"
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#3673F5] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={wrapAmount}
              onChange={(e) => setWrapAmount(e.target.value)}
            />
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700 bg-transparent hover:bg-zinc-800"
                onClick={() => setActiveSheet("")}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#3673F5] hover:bg-[#2861E0]"
                onClick={handleWrap}
              >
                Wrap
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ConfidentialWallet;