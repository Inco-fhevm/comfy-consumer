"use client";

import Image from "next/image";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ComfyNotConnectedLogo, WaveIcon } from "./icons";
import { Button } from "./ui/button";

export default function ComfyLanding() {
  const { openConnectModal } = useConnectModal();

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Cloud Animations - Multiple Rows */}
      <style jsx>{`
        @keyframes cloudMoveLeft {
          0% {
            transform: translateX(0%);
          }
          50% {
            transform: translateX(-100%);
          }
          50.01% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        @keyframes cloudMoveRight {
          0% {
            transform: translateX(0%);
          }
          50% {
            transform: translateX(-100%);
          }
          50.01% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        .cloud-animation-left {
          animation: cloudMoveLeft 10s linear infinite;
          min-width: 100%;
        }
        .cloud-animation-right {
          animation: cloudMoveRight 12s linear infinite;
          min-width: 100%;
        }
      `}</style>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row lg:flex-1 relative h-screen">
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
                  way. Enabled on <span className="text-blue-500">Base Sepolia.</span>
                </p>
              </div>

              {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
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
              </div> */}
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

        {/* Layered Right Side Section */}
        <div className="relative w-full h-[7.5rem] lg:h-auto lg:min-h-screen lg:w-1/2 mt-auto">
          {/* Background color layer */}
          <div className="absolute inset-0 bg-[#B0DBFF]"></div>

          {/* Clouds layer */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Cloud Row 1 */}
            <div className="absolute top-[10%] right-0 w-full overflow-hidden">
              <div className="relative right-24">
                <img
                  src="/images/cloud-1.svg"
                  alt="Cloud Decoration"
                  className="w-full cloud-animation-right h-11"
                  draggable={false}
                />
              </div>
            </div>

            {/* Cloud Row 2 */}
            <div className="absolute top-[30%] right-0 w-full overflow-hidden">
              <div className="relative left-40">
                <img
                  src="/images/cloud-2.svg"
                  alt="Cloud Decoration"
                  className="w-full cloud-animation-right h-16"
                  draggable={false}
                />
              </div>
            </div>

            {/* Cloud Row 3 */}
            <div className="absolute top-[60%] right-0 w-full overflow-hidden">
              <div className="relative right-64">
                <img
                  src="/images/cloud-3.svg"
                  alt="Cloud Decoration"
                  className="w-full cloud-animation-right h-8"
                  draggable={false}
                />
              </div>
            </div>

            {/* Cloud Row 4 */}
            <div className="absolute top-[80%] right-0 w-full overflow-hidden">
              <div className="relative left-12">
                <img
                  src="/images/cloud-4.svg"
                  alt="Cloud Decoration"
                  className="w-full h-8 cloud-animation-right"
                  draggable={false}
                />
              </div>
            </div>
          </div>

          {/* Main image layer (highest) */}
          <div className="absolute inset-0 hidden lg:flex items-center justify-center">
            <div className="relative" style={{ zIndex: 9999 }}>
              <img
                src="/not-connected/main.svg"
                alt="Comfy DeFi Privacy"
                className="max-h-screen max-w-full object-contain"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom clouds layer */}
      <div className="absolute -bottom-24 left-0 pointer-events-none lg:w-1/2 overflow-hidden">
        <img
          src="/images/clouds.svg"
          alt="Cloud Decoration"
          className="w-full h-32 lg:h-48 cloud-animation-left"
          draggable={false}
        />
      </div>

      <div className="absolute -bottom-24 right-0 pointer-events-none lg:w-1/2 overflow-hidden">
        <img
          src="/images/right-cloud.svg"
          alt="Bubbles Decoration"
          className="w-full h-32 lg:h-48 cloud-animation-right"
          draggable={false}
        />
      </div>
    </div>
  );
}
