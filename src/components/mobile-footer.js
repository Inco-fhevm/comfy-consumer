import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MobileFooter = () => {
  const pathname = usePathname();

  const footerLinks = [
    {
      name: "Assets",
      basePath: "private-assets",
      path: "/private-assets",
    },
    {
      name: "Swap",
      basePath: "private-swap",
      path: "/private-swap",
    },
    {
      name: "Bridge",
      basePath: "private-bridge",
      path: "/private-bridge",
    },
    {
      name: "Play",
      basePath: "games",
      path: "/games",
    },
    {
      name: "Apps",
      basePath: "other-apps",
      path: "/other-apps",
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-lg flex justify-between items-center px-2 py-3 z-10">
      {footerLinks.map((link) => {
        const isActive = pathname === link.path;
        return (
          <Link href={link.path} key={link.name}>
            <div className="flex items-center justify-center p-2">
              <Image
                src={`/icons/${link.basePath}-${
                  isActive ? "selected" : "notselected"
                }.svg`}
                alt={link.name}
                width={28}
                height={28}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default MobileFooter;
