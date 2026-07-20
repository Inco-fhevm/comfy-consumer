"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { Wallet, ArrowLeftRight, Loader2, type LucideIcon } from "lucide-react";
import Navbar from "@/components/navbar";
import ThemeToggle from "@/components/toggle-theme";
import ComfyLanding from "@/components/connect-wallet";

// trailingSlash on: paths end with slash
const strip = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);

const NAV: { name: string; path: string; icon: LucideIcon }[] = [
  { name: "Assets", path: "/", icon: Wallet },
  { name: "Transactions", path: "/transactions", icon: ArrowLeftRight },
];

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = strip(usePathname());
  const [mounted, setMounted] = useState(false);
  const { isConnected, isConnecting, isReconnecting } = useAccount();

  useEffect(() => setMounted(true), []);

  if (!mounted || isConnecting || isReconnecting) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected) return <ComfyLanding />;

  return (
    <div className="flex h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border lg:flex">
        <div className="px-5 pb-3 pt-6">
          <Link href="/">
            <Image
              src="/icons/comfy-logo.svg"
              width={168}
              height={42}
              alt="Comfy"
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map(({ name, path, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link
                key={name}
                href={path}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
                {name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-3 py-3">
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-5 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>

      <nav className="surface fixed inset-x-4 bottom-3 z-40 flex items-center gap-1 rounded-2xl p-1 lg:hidden">
        {NAV.map(({ name, path, icon: Icon }) => {
          const active = pathname === path;
          return (
            <Link
              key={name}
              href={path}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-[13px] font-medium transition-colors ${
                active ? "bg-secondary text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
              {name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default HomeLayout;
