"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Navbar from "@/components/navbar";
import ThemeToggle from "@/components/toggle-theme";
import { useAccount } from "wagmi";
import ComfyLanding from "@/components/connect-wallet";

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isConnected) {
    return <ComfyLanding />;
  }

  const sidebarLinks = [
    {
      name: "My Assets",
      basePath: "private-assets",
      path: "/",
    },
  ];

  const Sidebar = () => {
    const isDarkTheme = mounted && theme === "dark";

    return (
      <aside className="w-64 h-screen bg-gray-50 dark:bg-card p-4 border-r flex flex-col">
        <div className="text-blue-500 text-xl font-bold mb-8">
          <Link href="/">
            <Image
              src="/icons/comfy-logo.svg"
              width={300}
              height={127}
              alt="Comfy_logo"
              className="cursor-pointer"
            />
          </Link>
        </div>

        <div className="flex-1">
          {sidebarLinks.map((link) => {
            const isSelected = pathname === link.path;
            const iconPath = isSelected
              ? `/icons/${link.basePath}-selected.svg`
              : isDarkTheme
              ? `/icons/${link.basePath}-dark.svg`
              : `/icons/${link.basePath}-notselected.svg`;

            return (
              <Link key={link.name} href={link.path}>
                <div
                  className={`flex items-center gap-3 rounded-full p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer mb-2 ${
                    isSelected
                      ? "bg-[#E7EEFE] dark:bg-[#1E3A8A] hover:bg-[#E7EEFE] dark:hover:bg-[#1E3A8A]"
                      : ""
                  }`}
                >
                  <Image
                    src={iconPath}
                    alt={link.name}
                    width={20}
                    height={20}
                  />
                  <span
                    className={`${
                      isSelected
                        ? "text-blue-500 dark:text-blue-400"
                        : "dark:text-gray-300"
                    } font-semibold`}
                  >
                    {link.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="">
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </aside>
    );
  };

  const currentPage =
    sidebarLinks.find((link) => link.path === pathname)?.name ||
    "Private Assets";

  return (
    <div className="flex h-screen text-gray-900 dark:text-gray-100">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col">
        <Navbar currentPage={currentPage} />

        <main className="flex-1 md:p-6 overflow-y-auto pb-20 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default HomeLayout;
