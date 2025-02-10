import React, { useState } from "react";
import { Button } from "./ui/button";
import CustomConnectButton from "./custom-connect-button";
import DepositDialog from "./nav/deposit/deposit-dialouge";

const Navbar = ({ currentPage }) => {
  const [depositOpen, setDepositOpen] = useState(false);

  return (
    <header className="border-b p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold ml-12 lg:ml-0">{currentPage}</h1>
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-3">
          <Button
            className="bg-blue-500 hover:bg-blue-600 rounded-full"
            onClick={() => setDepositOpen(true)}
          >
            Deposit
          </Button>
          <Button variant="outline" className="rounded-full">
            Withdraw
          </Button>
        </div>
        <CustomConnectButton />
      </div>
      <DepositDialog open={depositOpen} onOpenChange={setDepositOpen} />
    </header>
  );
};

export default Navbar;
