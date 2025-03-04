"use client";

import Image from "next/image";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ComfyNotConnectedLogo, WaveIcon } from "./icons";
import { Button } from "./ui/button";

export default function ComfyLanding() {
  const { openConnectModal } = useConnectModal();

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row lg:flex-1 relative z-10 h-screen">
        {/* Left Content Section - Full width on mobile, unchanged on desktop */}
        <div className="w-full lg:w-1/2 p-6 lg:p-12 flex flex-col justify-center items-center pb-16 lg:pb-32 lg:min-h-screen h-[75vh]">
          {/* Logo and Header - Centered with text-center */}
          <div className="space-y-6 lg:space-y-10 max-w-[27rem]">
            <ComfyNotConnectedLogo />

            <div className="space-y-6 lg:space-y-8">
              <div className="space-y-3 lg:space-y-4">
                <h2 className="text-3xl lg:text-4xl font-extrabold">
                  Your net worth doesn&apos;t have to be public
                </h2>

                <p className="text-[#7A7A7A] font-semibold">
                  Use Comfy to encrypt your balance onchain do DeFi in a private
                  way.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
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

            {/* Connect Button */}
            {openConnectModal && (
              <Button
                onClick={openConnectModal}
                className="mt-6 lg:mt-8 rounded-full bg-[#3673F5] text-white w-full px-6 py-3"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>

        {/* Right Image Section - 25% height on mobile, unchanged on desktop */}
        <div className="w-full h-[25vh] lg:h-auto lg:min-h-screen lg:w-1/2 relative mt-auto bg-[#3673F5]">
          {/* Background image - desktop only */}
          <div className="lg:block absolute inset-0">
            <img
              src="/not-connected/coin.svg"
              alt="Comfy DeFi Privacy Background"
              className="h-screen w-full object-cover"
              draggable={false}
            />
          </div>
          {/* Centered foreground image - hidden on mobile */}
          <div className="absolute inset-0 hidden lg:flex items-center justify-center">
            <img
              src="/not-connected/main.svg"
              alt="Comfy DeFi Privacy"
              className="max-h-screen max-w-full object-contain z-10"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
