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

export function formatUsdExact(amount: number | null | undefined): string {
  if (amount == null || !isFinite(amount)) return "$0.00";
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
