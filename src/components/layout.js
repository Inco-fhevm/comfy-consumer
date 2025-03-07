"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes"; // Import useTheme hook if not already imported
import Navbar from "./navbar";
import ThemeToggle from "./toggle-theme";
import MobileFooter from "./mobile-footer";

const Layout = ({ children }) => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const sidebarLinks = [
    {
      name: "My Assets",
      basePath: "private-assets",
      path: "/private-assets",
    },
    { name: "Private Swap", basePath: "private-swap", path: "/private-swap" },
    {
      name: "Private Bridge",
      basePath: "private-bridge",
      path: "/private-bridge",
    },
    { name: "Games", basePath: "games", path: "/games" },
    { name: "Private Lend", basePath: "private-lend", path: "/private-lend" },
    { name: "Other Apps", basePath: "other-apps", path: "/other-apps" },
  ];

  const Sidebar = () => {
    const isDarkTheme = mounted && theme === "dark";

    return (
      <aside className="w-64 h-screen bg-gray-50 dark:bg-card p-4 border-r flex flex-col">
        <div className="text-blue-500 text-xl font-bold mb-8">
          <img src="/icons/comfy-logo.svg" className="w-full h-full" />
        </div>

        <div className="flex-1">
          {sidebarLinks.map((link) => {
            const isSelected = pathname === link.path;
            // Use different icon naming convention based on theme
            const iconPath = isSelected
              ? `/icons/${link.basePath}-selected.svg`
              : isDarkTheme
              ? `/icons/${link.basePath}-dark.svg` // New dark mode not-selected icons
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

      {/* <Sheet>
        <SheetTrigger asChild className="lg:hidden absolute top-4 left-4">
          <Button variant="ghost" size="icon">
            <Image src="/icons/menu.svg" alt="Menu" width={24} height={24} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet> */}

      <div className="flex-1 flex flex-col">
        <Navbar currentPage={currentPage} />

        <main className="flex-1 md:p-6 overflow-y-auto pb-20 lg:pb-6">
          {children}
        </main>

        {/* Mobile Footer */}
        <MobileFooter />
      </div>
    </div>
  );
};

export default Layout;
