"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Plus, Droplets, Sun, Moon } from "lucide-react";
import AddTokenDialog from "./add-token-dialog";
import CustomConnectButton from "./custom-connect-button";
import { IS_TESTNET, USDC_FAUCET } from "@/lib/constants";

const strip = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
const TITLES: Record<string, string> = {
  "/": "Assets",
  "/transactions": "Transactions",
};

function ToolButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Plus;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.98]"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

// Mobile-only theme toggle
function MobileThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.95] lg:hidden"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export default function Navbar() {
  const [addTokenOpen, setAddTokenOpen] = useState(false);
  const title = TITLES[strip(usePathname())] ?? "Comfy";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-sm lg:px-8">
      <h1 className="hidden text-xl font-semibold tracking-apple lg:block">
        {title}
      </h1>
      <Image
        src="/icons/comfy-logo.svg"
        width={132}
        height={32}
        alt="Comfy"
        className="h-8 w-auto lg:hidden"
      />

      <div className="flex items-center gap-1 md:gap-2">
        {IS_TESTNET && USDC_FAUCET && (
          <a
            href={USDC_FAUCET}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.98]"
          >
            <Droplets className="h-4 w-4" />
            <span className="hidden md:inline">Get USDC</span>
          </a>
        )}
        <ToolButton icon={Plus} label="Add token" onClick={() => setAddTokenOpen(true)} />
        <MobileThemeToggle />
        <CustomConnectButton />
      </div>

      <AddTokenDialog open={addTokenOpen} onOpenChange={setAddTokenOpen} />
    </header>
  );
}
