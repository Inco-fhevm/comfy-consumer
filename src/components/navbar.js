import React, { useState } from "react";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import CustomConnectButton from "./custom-connect-button";
import TransactionDialog from "./transactions/transaction-dialouge";
import MintDialog from "./mint-token";

const Navbar = ({ currentPage }) => {
  // const [depositOpen, setDepositOpen] = useState(false);
  // const [withdrawOpen, setWithdrawOpen] = useState(false);
  // const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b p-4 flex justify-between items-center relative">
      <h1 className="md:text-xl text-2xl font-semibold lg:ml-0">
        {currentPage}
      </h1>

      <div className="flex items-center gap-3">
        {/* Desktop buttons */}
        {/* <div className="hidden lg:flex items-center gap-3">
          <Button
            onClick={() => setDepositOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 rounded-full"
          >
            Shield
          </Button>
          <Button
            onClick={() => setWithdrawOpen(true)}
            className="rounded-full"
            variant="outline"
          >
            Unshield
          </Button>
        </div> */}

        {/* Mobile menu button */}
        {/* <div className="lg:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mr-2"
          >
            <Menu size={24} />
          </Button>
        </div> */}

        <Button
          variant="link"
          className="text-black hover:text-black/70 font-semibold"
          onClick={() => setOpen(true)}
        >
          Mint now
        </Button>
        <CustomConnectButton />
      </div>
      <MintDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={({ amount, token }) => {
          console.log("Minting", amount, "of", token);
          setOpen(false);
        }}
      />
      {/* Mobile menu dropdown */}
      {/* {mobileMenuOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-900 shadow-lg rounded-lg p-2 z-50 lg:hidden">
          <div className="flex flex-col gap-2 w-40">
            <Button
              onClick={() => {
                setDepositOpen(true);
                setMobileMenuOpen(false);
              }}
              className="bg-blue-500 hover:bg-blue-600 w-full"
            >
              Shield
            </Button>
            <Button
              onClick={() => {
                setWithdrawOpen(true);
                setMobileMenuOpen(false);
              }}
              variant="outline"
              className="w-full"
            >
              Unshield
            </Button>
          </div>
        </div>
      )} */}

      {/* Transaction dialogs */}
      {/* <TransactionDialog
        mode="shield"
        open={depositOpen}
        onOpenChange={setDepositOpen}
      />
      <TransactionDialog
        mode="withdraw"
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
      /> */}
    </header>
  );
};

export default Navbar;
