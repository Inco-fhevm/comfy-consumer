"use client";
import { LoaderCircle, Eye, EyeOff, RefreshCw } from "lucide-react";
import { formatUsd, formatUsdExact } from "@/lib/prices";
import { IS_TESTNET } from "@/lib/constants";
import { useBalances } from "@/context/token-balances-provider";
import { NumberTicker } from "./ui/number-ticker";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./ui/tooltip";

// Hidden until every token decrypted
const TotalBalance = () => {
  const { allRevealed, revealAll, hideAll, busy, totals } = useBalances();
  // Compacted headline ($1.23M) hides the exact figure — reveal it on hover.
  const compacted = totals.usdCombined >= 100_000;

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">Total balance</p>

      <div className="mt-1.5 flex items-center gap-3">
        {allRevealed ? (
          compacted ? (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default">
                    <NumberTicker
                      value={totals.usdCombined}
                      format={formatUsd}
                      className="tabular text-[2.75rem] font-bold leading-none tracking-apple"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{formatUsdExact(totals.usdCombined)}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <NumberTicker
              value={totals.usdCombined}
              format={formatUsd}
              className="tabular text-[2.75rem] font-bold leading-none tracking-apple"
            />
          )
        ) : (
          <span className="text-[2.75rem] font-bold leading-none tracking-apple text-muted-foreground/70">
            ••••••
          </span>
        )}

        {busy ? (
          <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : allRevealed ? (
          <div className="flex items-center gap-1">
            {/* Controls act on all tokens */}
            <IconBtn label="Refresh balances" onClick={() => void revealAll()}>
              <RefreshCw className="h-[18px] w-[18px]" />
            </IconBtn>
            <IconBtn label="Hide balances" onClick={hideAll}>
              <EyeOff className="h-[18px] w-[18px]" />
            </IconBtn>
          </div>
        ) : (
          <IconBtn label="Reveal all balances" onClick={() => void revealAll()}>
            <Eye className="h-[18px] w-[18px]" />
          </IconBtn>
        )}
      </div>

      <p className="mt-2 text-[13px] text-muted-foreground">
        {allRevealed
          ? "Public and shielded USD, across priced tokens."
          : "Decrypt all tokens to reveal your total."}
        {IS_TESTNET && " · Testnet"}
      </p>
    </div>
  );
};

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95"
    >
      {children}
    </button>
  );
}

export default TotalBalance;
