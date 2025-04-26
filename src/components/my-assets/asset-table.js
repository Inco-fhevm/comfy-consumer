import { useChainBalance } from "@/hooks/use-chain-balance";
import { EyeOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useChainId, useWalletClient } from "wagmi";
import { Button } from "../ui/button";
import ConfidentialSendDialog from "../confidential-send-dialouge";
import TransactionDialog from "../transactions/transaction-dialouge";

export const AssetTable = ({ title, totalBalance, assets, onActionClick }) => {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [showConfidentialValues, setShowConfidentialValues] = useState(false);
  const [transmittedBalance, setTransmittedBalance] = useState(null);

  const chainId = useChainId();
  const { encryptedBalance, fetchEncryptedBalance } = useChainBalance();
  const walletClient = useWalletClient();
  const { tokenBalance } = useChainBalance();

  const usdcBalance = tokenBalance?.data?.formatted ? tokenBalance?.data?.formatted : "0"

  const handleRefreshEncrypted = (w0) => fetchEncryptedBalance(w0);

  const toggleConfidentialValues = async () => {
    if (!showConfidentialValues) {
      await handleRefreshEncrypted(walletClient);
    }
    setShowConfidentialValues(!showConfidentialValues);
  };

  return (
    <div className="border rounded-3xl shadow-sm mb-4">
      <div className="flex justify-between items-center mb-4 border-b p-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="text-xl font-semibold">
          {title === "Encrypted"
            ? showConfidentialValues
              ? "$" + Number(encryptedBalance).toLocaleString()
              : "$******"
            : "$" + Number(usdcBalance).toLocaleString()}
        </div>
        {title === "Encrypted" && (
          <button className="" onClick={toggleConfidentialValues}>
            {showConfidentialValues ? (
              <EyeOff
                className="w-6 h-6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      <table className="w-full">
        <thead className="">
          <tr className="text-sm text-gray-500">
            <th className="text-left font-normal pb-4 pl-6">Name</th>
            <th className="text-left font-normal pb-4 pl-6">Amount</th>
            <th className="text-right font-normal pb-4 pl-6"></th>
          </tr>
        </thead>
        <tbody className="">
          {assets.map((asset, index) => {
            let displayValue;
            if (asset.name === "cUSDC") {
              displayValue = {
                // FIX: Now checking showConfidentialValues state to determine what to display
                amount:
                  title === "Encrypted" && !showConfidentialValues
                    ? "*****"
                    : encryptedBalance
                      ? Number(encryptedBalance).toLocaleString()
                      : "*****",
                dollarValue:
                  title === "Encrypted" && !showConfidentialValues
                    ? "$******"
                    : encryptedBalance
                      ? "$" + Number(encryptedBalance).toLocaleString()
                      : "$******",
              };
            } else {
              displayValue = {
                amount: Number(usdcBalance).toLocaleString(),
                dollarValue:
                  "$" + Number(usdcBalance).toLocaleString(),
              };
            }

            return (
              <tr key={index}>
                <td className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <Image
                      src={asset.icon}
                      alt={asset.name}
                      width={44}
                      height={44}
                    />
                    <div>
                      <div className="font-medium">{asset.name}</div>
                      {asset.chain !== "Ethereum" && (
                        <div className="text-sm text-gray-500">
                          on {asset.chain}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 pl-6">
                  <div>
                    <div>{displayValue.amount}</div>
                    <div className="text-gray-500">
                      {displayValue.dollarValue}
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-6 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {title === "Encrypted" ? (
                      <>
                        <Button
                          onClick={() => setWithdrawOpen(true)}
                          className="rounded-full"
                          variant="outline"
                        >
                          Unshield
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => {
                          setTransmittedBalance(displayValue.amount);
                          setDepositOpen(true);
                        }}
                        disabled={asset.chain !== "Base Sepolia"}
                        className="bg-blue-500 hover:bg-blue-600 rounded-full dark:text-white"
                      >
                        {asset.chain !== "Base Sepolia" ? "Soon" : "Shield"}
                      </Button>
                    )}

                    {title === "Encrypted" && (
                      <ConfidentialSendDialog
                        balance={
                          // Pass hidden balance if values are hidden
                          !showConfidentialValues
                            ? "*****"
                            : displayValue.amount
                        }
                      />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <TransactionDialog
        mode="shield"
        open={depositOpen}
        balance={transmittedBalance}
        onOpenChange={setDepositOpen}
      />
      <TransactionDialog
        mode="withdraw"
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
      />
    </div>
  );
};
