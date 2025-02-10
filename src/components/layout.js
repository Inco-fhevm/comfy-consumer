"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CustomConnectButton from "./custom-connect-button";
import Navbar from "./navbar";

const Layout = ({ children }) => {
  const pathname = usePathname();

  const sidebarLinks = [
    {
      name: "Private Assets",
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

  const Sidebar = () => (
    <aside className="w-64 h-screen bg-gray-50 p-4 border-r">
      <div className="text-blue-500 text-xl font-bold mb-8">Comfy</div>
      {sidebarLinks.map((link) => {
        const isSelected = pathname === link.path;
        const iconPath = `/icons/${link.basePath}-${
          isSelected ? "selected" : "notselected"
        }.svg`;

        return (
          <Link key={link.name} href={link.path}>
            <div
              className={`flex items-center gap-3 rounded-full p-3 hover:bg-gray-100 cursor-pointer mb-2 ${
                isSelected ? "bg-[#E7EEFE] hover:bg-[#E7EEFE]" : ""
              }`}
            >
              <Image src={iconPath} alt={link.name} width={20} height={20} />
              <span
                className={`${isSelected ? "text-blue-500" : ""} font-semibold`}
              >
                {link.name}
              </span>
            </div>
          </Link>
        );
      })}
    </aside>
  );

  const currentPage =
    sidebarLinks.find((link) => link.path === pathname)?.name ||
    "Private Assets";

  return (
    <div className="flex h-screen">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <Sheet>
        <SheetTrigger asChild className="lg:hidden absolute top-4 left-4">
          <Button variant="ghost" size="icon">
            <Image src="/icons/menu.svg" alt="Menu" width={24} height={24} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col">
        <Navbar currentPage={currentPage} />

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
