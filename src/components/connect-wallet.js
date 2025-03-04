"use client";

import Image from "next/image";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ComfyNotConnectedLogo, WaveIcon } from "./icons";
import { Button } from "./ui/button";

export default function ComfyLanding() {
  const { openConnectModal } = useConnectModal();

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Wave SVG at the bottom - fully responsive approach */}
      <div className="absolute bottom-0 left-0 right-0 w-full z-0 overflow-hidden">
        <WaveIcon />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 relative z-10">
        {/* Left Content Section - Added flex items-center justify-center */}
        <div className="w-1/2 p-12 flex flex-col justify-center items-center pb-32">
          {/* Logo and Header - Centered with text-center */}
          <div className="space-y-10 max-w-[27rem]">
            <ComfyNotConnectedLogo />

            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-extrabold">
                  Your net worth doesn&apos;t have to be public
                </h2>

                <p className="text-[#7A7A7A] font-semibold">
                  Use Comfy to encrypt your balance onchain do DeFi in a private
                  way.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 grid place-items-center bg-[#E7EEFE] rounded-full">
                    <Image
                      width={24}
                      height={24}
                      src={"/not-connected/features/private-assets.svg"}
                      alt="Private Assets"
                    />
                  </div>
                  <span className="text-gray-900 font-semibold">
                    Private Assets
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 grid place-items-center bg-[#E7EEFE] rounded-full">
                    <Image
                      width={24}
                      height={24}
                      src={"/not-connected/features/private-swap.svg"}
                      alt="Private Swap"
                    />
                  </div>
                  <span className="text-gray-900 font-semibold">
                    Private Swap
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 grid place-items-center bg-[#E7EEFE] rounded-full">
                    <Image
                      width={24}
                      height={24}
                      src={"/not-connected/features/private-bridge.svg"}
                      alt="Private Bridge"
                    />
                  </div>
                  <span className="text-gray-900 font-semibold">
                    Private Bridge
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 grid place-items-center bg-[#E7EEFE] rounded-full">
                    <Image
                      width={24}
                      height={24}
                      src={"/not-connected/features/private-lend.svg"}
                      alt="Private Lend"
                    />
                  </div>
                  <span className="text-gray-900 font-semibold">
                    Private Lend
                  </span>
                </div>
              </div>
            </div>

            {/* Connect Button - Add it here if needed */}
            {openConnectModal && (
              <Button
                onClick={openConnectModal}
                className="mt-8 rounded-full bg-[#3673F5] text-white w-full px-6 py-3"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>

        {/* Right Image Section */}
        <div className="w-1/2 relative">
          <img
            src="/not-connected/coin.svg"
            alt="Comfy DeFi Privacy"
            className="absolute inset-0 h-screen w-full object-cover"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
