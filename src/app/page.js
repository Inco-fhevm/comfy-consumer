"use client";
import ConfidentialERC20 from "@/components/balance";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const Page = () => {
  return (
    <div>
      {/* <ConnectButton /> */}
      <ConfidentialERC20 />
    </div>
  );
};

export default Page;
