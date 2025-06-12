import React, { useState }   from "react";
import { Button } from "./ui/button";
import MintDialog from "./mint-token";
import Image from "next/image";
import CustomConnectButton from "./custom-connect-button";

const Navbar = ({ currentPage }: { currentPage: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b p-4 flex justify-between items-center relative">
      <h1 className="md:text-xl hidden md:flex text-2xl font-semibold lg:ml-0">
        {currentPage}
      </h1>

      <div className="flex md:hidden cursor-pointer">
        <Image
          src="/icons/comfy-logo.svg"
          className="w-36"
          width={112}
          height={70}
          alt="Comfy_Logo"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          className="font-semibold"
          onClick={() => setOpen(true)}
        >
          Mint now
        </Button>
        <CustomConnectButton />
      </div>
      <MintDialog
        open={open}
        onOpenChange={setOpen}
      />
    </header>
  );
};

export default Navbar;
