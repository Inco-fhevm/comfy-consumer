"use client";
import ConfidentialERC20 from "@/components/balance";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  router.push("/private-assets");
  return <div></div>;
};

export default Page;
