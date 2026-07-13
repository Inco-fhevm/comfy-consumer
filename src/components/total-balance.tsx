"use client";
import { Loader, Eye } from "lucide-react";
import { formatNumber } from "@/lib/format-number";
import { useBalanceTotals } from "@/context/token-balances-provider";
import { useSessionKey } from "@/context/session-key-provider";

/**
 * Combined balance across every token — normal (wallet) plus shielded.
 * Shielded amounts are included once decrypted; the eye button decrypts all.
 */
const TotalBalance = () => {
  const { combined, anyRevealed } = useBalanceTotals();
  const { revealAll, isGranting } = useSessionKey();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-500">Total Balance</h3>
      <div className="flex items-center gap-2">
        <div className="text-3xl font-semibold break-all leading-tight max-w-full overflow-wrap-anywhere">
          {formatNumber(combined)}
        </div>

        {isGranting ? (
          <Loader className="animate-spin ml-1" size={18} />
        ) : (
          !anyRevealed && (
            <button
              onClick={() => void revealAll()}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Include shielded balances"
              title="Decrypt to include shielded balances"
            >
              <Eye size={18} />
            </button>
          )
        )}
      </div>

      <div className="text-xs text-gray-500">
        {anyRevealed
          ? "Normal + shielded, across all tokens"
          : "Normal balances only, decrypt to include shielded"}
      </div>
    </div>
  );
};

export default TotalBalance;
