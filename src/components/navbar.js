import React, { useState } from "react";
import { Button } from "./ui/button";
import CustomConnectButton from "./custom-connect-button";
import TransactionDialog from "./nav/transactions/transaction-dialouge";

const Navbar = ({ currentPage }) => {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  return (
    <header className="border-b p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold ml-12 lg:ml-0">{currentPage}</h1>
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-3">
          <Button
            onClick={() => setDepositOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 rounded-full"
          >
            Deposit
          </Button>
          <Button
            onClick={() => setWithdrawOpen(true)}
            className="rounded-full"
            variant="outline"
          >
            Withdraw
          </Button>
        </div>
        <CustomConnectButton />
      </div>
      <TransactionDialog
        mode="deposit"
        open={depositOpen}
        onOpenChange={setDepositOpen}
      />
      <TransactionDialog
        mode="withdraw"
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
      />
    </header>
  );
};

export default Navbar;
