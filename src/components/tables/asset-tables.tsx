"use client";
import React, { useState } from "react";
import { AlertCircle, EyeOff, Loader2, X } from "lucide-react";
import { Button } from "../ui/button";
import ConfidentialSendDialog from "../confidential-send-dialouge";
import TransactionDialog from "../transaction/transaction-dialouge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatNumber } from "@/lib/format-number";
import IconBuilder from "../icon-builder";
import { TokenInfo } from "@/types/token";
import { useTokenBalance } from "@/context/token-balances-provider";
import { useTokenRegistry } from "@/context/token-registry-provider";
import { useSessionKey } from "@/context/session-key-provider";

type Variant = "wallet" | "encrypted";

const LoadingDisplay = ({ size = "w-4 h-4" }: { size?: string }) => (
  <div className="flex items-center">
    <Loader2 className={`${size} mr-1 animate-spin`} />
  </div>
);

const ErrorDisplay = ({
  onClick,
  size = "w-4 h-4",
}: {
  onClick: () => void;
  size?: string;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger
        className="flex items-center text-red-500"
        onClick={onClick}
      >
        <AlertCircle className={`${size} mr-1`} />
        <span className={size === "w-3 h-3" ? "text-sm" : ""}>Error</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Click to retry</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const EyeIcon = () => (
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
);

const AssetRow: React.FC<{ token: TokenInfo; variant: Variant }> = ({
  token,
  variant,
}) => {
  const b = useTokenBalance(token.id);
  const { removeToken } = useTokenRegistry();
  const { refreshBalances } = useSessionKey();

  const [shieldOpen, setShieldOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const isEncrypted = variant === "encrypted";

  const toggleReveal = (): void => {
    if (b.revealed) b.hide();
    else void b.reveal();
  };

  const renderAmount = (): React.ReactNode => {
    if (!isEncrypted) {
      if (b.walletLoading) return <LoadingDisplay size="w-3 h-3" />;
      return formatNumber(b.wallet);
    }
    if (!b.revealed) return "*****";
    if (b.encryptedLoading) return <LoadingDisplay size="w-3 h-3" />;
    if (b.encryptedError)
      return <ErrorDisplay onClick={() => void b.reveal()} size="w-3 h-3" />;
    return formatNumber(b.encrypted ?? 0);
  };

  return (
    <tr>
      <td className="py-4 pl-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11">
            <IconBuilder
              isEncrypted={isEncrypted}
              usdcImage={"/tokens/usdc-token.svg"}
              incoImage={"/tokens/inco-token.svg"}
              networkImage={"/chains/base-sepolia.svg"}
              isCustom={token.isCustom}
              symbol={token.symbol}
            />
          </div>
          <div>
            <div className="font-medium">
              {isEncrypted ? token.encryptedSymbol : token.symbol}
            </div>
            <div className="text-sm text-gray-500">on Base Sepolia</div>
          </div>
        </div>
      </td>
      <td className="py-4 pl-6 md:pr-6">
        <div className="break-all leading-tight max-w-full overflow-wrap-anywhere font-medium">
          {renderAmount()}
        </div>
      </td>
      <td className="py-4 pr-6 text-right">
        <div className="flex items-center justify-end space-x-2">
          {isEncrypted ? (
            <>
              <button
                onClick={toggleReveal}
                aria-label={b.revealed ? "Hide balance" : "Reveal balance"}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                {b.revealed ? <EyeOff className="w-5 h-5" /> : <EyeIcon />}
              </button>
              <Button
                onClick={() => setWithdrawOpen(true)}
                className="rounded-full"
                variant="outline"
              >
                Unshield
              </Button>
              <ConfidentialSendDialog
                token={token}
                encryptedBalance={b.revealed ? b.encrypted : null}
                onSuccess={refreshBalances}
              />
            </>
          ) : (
            <Button
              onClick={() => setShieldOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 rounded-full dark:text-white"
            >
              Shield
            </Button>
          )}

          {token.isCustom && (
            <button
              onClick={() => removeToken(token.id)}
              aria-label="Remove token"
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>

      {/* Dialogs (portal to body) */}
      {!isEncrypted && (
        <TransactionDialog
          mode="shield"
          open={shieldOpen}
          onOpenChange={setShieldOpen}
          balance={String(b.wallet)}
          token={token}
          onSuccess={refreshBalances}
        />
      )}
      {isEncrypted && (
        <TransactionDialog
          mode="withdraw"
          open={withdrawOpen}
          onOpenChange={setWithdrawOpen}
          token={token}
          onSuccess={refreshBalances}
        />
      )}
    </tr>
  );
};

interface AssetTableProps {
  title: string;
  variant: Variant;
  tokens: TokenInfo[];
}

export const AssetTable: React.FC<AssetTableProps> = ({
  title,
  variant,
  tokens,
}) => {
  const { revealAll, isGranting } = useSessionKey();

  return (
    <div className="border rounded-3xl shadow-sm mb-4">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 mb-4 border-b p-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        {variant === "encrypted" && tokens.length > 0 && (
          <Button
            variant="outline"
            className="rounded-full h-9 px-4 text-sm"
            onClick={() => void revealAll()}
            disabled={isGranting}
          >
            {isGranting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Decrypt all
          </Button>
        )}
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="text-sm text-gray-500">
            <th className="text-left font-normal pb-4 pl-6">Name</th>
            <th className="text-left font-normal pb-4 pl-6">Amount</th>
            <th className="text-right font-normal pb-4 pl-6"></th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <AssetRow key={token.id} token={token} variant={variant} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
