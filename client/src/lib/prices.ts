// Constant $1 for stablecoin wallet

const CONSTANT_PRICES_BY_SYMBOL: Record<string, number> = {
  USDC: 1,
  USDT: 1,
  DAI: 1,
  USD: 1,
};

export const FALLBACK_USD_PRICE = 1;

export function getUsdPrice(symbol?: string): number {
  if (!symbol) return FALLBACK_USD_PRICE;
  return CONSTANT_PRICES_BY_SYMBOL[symbol.toUpperCase()] ?? FALLBACK_USD_PRICE;
}

export function formatUsd(amount: number | null | undefined): string {
  if (amount == null || !isFinite(amount)) return "$0.00";
  // Past 5 digits, compact with a suffix ($100K, $1.23M) so it never overflows.
  if (Math.abs(amount) >= 100_000) {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Never compacted — the exact figure, for tooltips where precision matters.
export function formatUsdExact(amount: number | null | undefined): string {
  if (amount == null || !isFinite(amount)) return "$0.00";
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
