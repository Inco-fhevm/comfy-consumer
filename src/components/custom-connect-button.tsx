import React from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LogOut, User, Copy } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { useDisconnect } from "wagmi";
import { useNetworkSwitch } from "@/hooks/use-network-switch";

const CustomConnectButton = () => {
  const { checkAndSwitchNetwork } = useNetworkSwitch();
  const { disconnectAsync  } = useDisconnect();
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    // You can add a toast notification here
    console.log("Address copied to clipboard");
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        const handleLogout = async () => {
          await checkAndSwitchNetwork();
          await disconnectAsync();
        };

        const handleAccountDetails = async () => {
          await checkAndSwitchNetwork();
           openAccountModal();
        };

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button 
                    onClick={openConnectModal}
                    variant="ghost" 
                    className="hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
                  >
                    Connect Wallet
                  </Button>
                );
              }

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 bg-muted hover:bg-muted/80 rounded-full py-0.5 pl-0.5 pr-4 border transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gray-200">
                        <Image
                          src="/pfp/1.png"
                          className="w-full h-full"
                          width={32}
                          height={32}
                          alt="Profile_Image"
                        />
                      </div>
                      <span className="text-sm capitalize font-semibold text-muted-foreground">
                        {account.displayName}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem 
                      onClick={() => copyAddress(account.address)} 
                      className="cursor-pointer"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Address
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleAccountDetails} 
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Account Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="cursor-pointer text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;