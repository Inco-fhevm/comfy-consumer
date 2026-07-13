// components/MobileAssetTable.tsx
"use client";
import React, { useState } from "react";
import { EyeOff, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format-number";
import IconBuilder from "../icon-builder";
import TransactionDialog from "../transaction/transaction-dialouge";
import ConfidentialSendDialog from "../confidential-send-dialouge";
import { TokenInfo } from "@/types/token";
import { useTokenBalance } from "@/context/token-balances-provider";
import { useTokenRegistry } from "@/context/token-registry-provider";
import { useSessionKey } from "@/context/session-key-provider";

type Variant = "wallet" | "encrypted";

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
    className="w-5 h-5"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const MobileAssetRow: React.FC<{ token: TokenInfo; variant: Variant }> = ({
  token,
  variant,
}) => {
  const b = useTokenBalance(token.id);
  const { removeToken } = useTokenRegistry();
  const { refreshBalances } = useSessionKey();

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const isEncrypted = variant === "encrypted";

  const toggleReveal = (): void => {
    if (b.revealed) b.hide();
    else void b.reveal();
  };

  const amount = !isEncrypted
    ? formatNumber(b.wallet)
    : !b.revealed
      ? "*****"
      : b.encryptedLoading
        ? "…"
        : b.encryptedError
          ? "error"
          : formatNumber(b.encrypted ?? 0);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
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
            <div className="font-medium text-base flex items-center gap-1">
              {isEncrypted ? token.encryptedSymbol : token.symbol}
              {token.isCustom && (
                <button
                  onClick={() => removeToken(token.id)}
                  aria-label="Remove token"
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500">on Base Sepolia</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-base font-medium text-right break-all leading-tight max-w-full overflow-wrap-anywhere">
            {amount}
          </div>
          {isEncrypted && (
            <button className="p-1" onClick={toggleReveal}>
              {b.revealed ? <EyeOff className="w-5 h-5" /> : <EyeIcon />}
            </button>
          )}
        </div>
      </div>
      <div className="w-full flex gap-2 items-center mt-4">
        {isEncrypted ? (
          <Button
            onClick={() => setWithdrawOpen(true)}
            className="rounded-full w-full shadow-none"
            variant="outline"
          >
            Unshield
          </Button>
        ) : (
          <Button
            onClick={() => setDepositOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 shadow-none rounded-full w-full text-white"
          >
            Shield
          </Button>
        )}

        {isEncrypted && (
          <ConfidentialSendDialog
            token={token}
            encryptedBalance={b.revealed ? b.encrypted : null}
            onSuccess={refreshBalances}
          />
        )}

        {!isEncrypted ? (
          <TransactionDialog
            mode="shield"
            open={depositOpen}
            onOpenChange={setDepositOpen}
            balance={String(b.wallet)}
            token={token}
            onSuccess={refreshBalances}
          />
        ) : (
          <TransactionDialog
            mode="withdraw"
            open={withdrawOpen}
            onOpenChange={setWithdrawOpen}
            token={token}
            onSuccess={refreshBalances}
          />
        )}
      </div>
    </div>
  );
};

interface MobileAssetTableProps {
  title: string;
  variant: Variant;
  tokens: TokenInfo[];
}

const MobileAssetTable: React.FC<MobileAssetTableProps> = ({
  title,
  variant,
  tokens,
}) => {
  const { revealAll, isGranting } = useSessionKey();

  return (
    <div className="border rounded-xl shadow-sm mb-4">
      <div className="flex justify-between items-center border-b p-4">
        <h2 className="md:text-lg text-xl font-semibold">{title}</h2>
        {variant === "encrypted" && tokens.length > 0 && (
          <Button
            variant="outline"
            className="rounded-full h-8 px-3 text-xs"
            onClick={() => void revealAll()}
            disabled={isGranting}
          >
            {isGranting && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Decrypt all
          </Button>
        )}
      </div>
      <div className="px-4">
        <div className="flex justify-between text-sm text-gray-500 md:py-2 py-6">
          <div>Name</div>
          <div>Amount</div>
        </div>
        {tokens.map((token) => (
          <MobileAssetRow key={token.id} token={token} variant={variant} />
        ))}
      </div>
    </div>
  );
};

export default MobileAssetTable;
