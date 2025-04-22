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
                  way.
                </p>
              </div>
            </div>

            <div>
              {openConnectModal && (
                <Button
                  onClick={openConnectModal}
                  className="mt-6 lg:mt-8 rounded-full bg-[#3673F5] text-white w-full px-6 py-3"
                >
                  Connect Wallet
                </Button>
              )}
              <div className="flex mt-4 items-center justify-center text-[#7A7A7A] font-semibold">
                <span>Enabled on</span>
                <span className="text-blue-500 inline-flex items-center ml-1">
                  <Image
                    src="/chains/base-sepolia.svg"
                    width={20}
                    height={20}
                    alt="Base Sepolia"
                    className="mx-1"
                  />
                  Base Sepolia
                </span>
              </div>
            </div>
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
                <div className="animate-cloud-right min-w-full">
                  <Image
                    src="/images/cloud-1.svg"
                    height={44}
                    width={71}
                    alt="Cloud Decoration"
                    className="w-full h-16"
                    draggable={false}
                  />
                </div>
              </div>
            </div>

            {/* Cloud Row 2 */}
            <div className="absolute top-[30%] right-0 w-full overflow-hidden">
              <div className="relative left-40">
                <div className="animate-cloud-right min-w-full">
                  <Image
                    src="/images/cloud-2.svg"
                    height={69}
                    width={110}
                    alt="Cloud Decoration"
                    className="w-full h-16"
                    draggable={false}
                  />
                </div>
              </div>
            </div>

            {/* Cloud Row 3 */}
            <div className="absolute top-[60%] right-0 w-full overflow-hidden">
              <div className="relative right-64">
                <div className="animate-cloud-right min-w-full">
                  <Image
                    src="/images/cloud-3.svg"
                    height={30}
                    width={84}
                    alt="Cloud Decoration"
                    className="w-full h-8"
                    draggable={false}
                  />
                </div>
              </div>
            </div>

            {/* Cloud Row 4 */}
            <div className="absolute top-[80%] right-0 w-full overflow-hidden">
              <div className="relative left-12">
                <div className="animate-cloud-right min-w-full">
                  <Image
                    height={49}
                    width={71}
                    src="/images/cloud-4.svg"
                    alt="Cloud Decoration"
                    className="w-full h-8"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main image layer (highest) */}
          <div className="absolute inset-0 hidden lg:flex items-center justify-center">
            <div className="relative" style={{ zIndex: 9999 }}>
              <Image
                src="/not-connected/main.svg"
                width={417}
                height={271}
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
        <div className="animate-cloud-left min-w-full">
          <Image
            src="/images/clouds.svg"
            width={1200}
            height={200}
            alt="Cloud Decoration"
            className="w-full h-32 lg:h-48"
            draggable={false}
          />
        </div>
      </div>

      <div className="absolute -bottom-24 right-0 pointer-events-none lg:w-1/2 overflow-hidden">
        <div className="animate-cloud-right min-w-full">
          <Image
            src="/images/right-cloud.svg"
            width={1200}
            height={200}
            alt="Bubbles Decoration"
            className="w-full h-32 lg:h-48"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}