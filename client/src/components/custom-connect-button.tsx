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
import { toast } from "sonner";
import { useDisconnect } from "wagmi";
import { useNetworkSwitch } from "@/hooks/use-network-switch";

const CustomConnectButton = () => {
  const { checkAndSwitchNetwork } = useNetworkSwitch();
  const { disconnectAsync } = useDisconnect();
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied");
  };

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        const handleLogout = async () => {
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
              style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
            })}
          >
            {!connected ? (
              <Button
                onClick={openConnectModal}
                className="rounded-full px-5 font-semibold"
              >
                Connect
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2 text-sm font-medium transition-colors hover:bg-secondary active:scale-[0.98] md:pr-3">
                    <Image
                      src="/pfp/1.png"
                      width={28}
                      height={28}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded-full"
                    />
                    <span className="hidden md:inline">{account.displayName}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuItem
                    onClick={() => copyAddress(account.address)}
                    className="cursor-pointer"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy address
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleAccountDetails}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Account details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;
