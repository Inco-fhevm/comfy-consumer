export type ComfyErrorCode =
  | "WALLET_REQUIRED"
  | "NOT_CONNECTED"
  | "WRAPPER_NOT_FOUND"
  | "INDEXER_NOT_CONFIGURED"
  | "INDEXER_UNAVAILABLE"
  | "TX_REVERTED"
  | "DECRYPT_FAILED"
  | "SESSION_FAILED"
  | "INVALID_ADDRESS"
  | "INVALID_AMOUNT"
  | "UNSUPPORTED_NETWORK"
  | "WRONG_NETWORK";

// Single typed error; switch on `.code`.
export class ComfyError extends Error {
  readonly code: ComfyErrorCode;
  constructor(code: ComfyErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ComfyError";
    this.code = code;
  }
}

// Wallet/RPC error to one sentence.
export function humanizeError(err: unknown): string | null {
  if (!err) return null;
  if (err instanceof ComfyError) return err.message;

  const chain = causeChain(err);
  const named = (n: string) => chain.some((e) => e?.name === n);
  const code = chain.find((e) => typeof e?.code === "number")?.code;
  const text = chain.map((e) => e?.message ?? "").join(" ").toLowerCase();

  if (code === 4001 || named("UserRejectedRequestError")) {
    return "You rejected the request in your wallet.";
  }
  if (named("ChainMismatchError") || named("ChainNotConfiguredError") || code === 4902) {
    return "Wrong network. Switch your wallet to continue.";
  }
  if (/insufficient funds|exceeds the balance/.test(text)) {
    return "Not enough ETH to cover gas.";
  }
  if (/transfer amount exceeds balance|erc20insufficientbalance/.test(text)) {
    return "Not enough balance for this amount.";
  }
  if (/insufficient allowance|erc20insufficientallowance/.test(text)) {
    return "Approval is too low. Approve again and retry.";
  }
  if (/user denied|denied transaction|rejected/.test(text)) {
    return "You rejected the request in your wallet.";
  }
  if (/timed out|timeout/.test(text)) {
    return "The network took too long to respond. Try again.";
  }
  if (named("HttpRequestError") || /failed to fetch|network error/.test(text)) {
    return "Network error. Check your connection and try again.";
  }

  const root = chain[chain.length - 1] as { shortMessage?: string; message?: string } | undefined;
  const short =
    chain.find((e) => typeof e?.shortMessage === "string")?.shortMessage ??
    root?.message ??
    "Something went wrong. Please try again.";
  return trimSentence(short);
}

function causeChain(err: unknown): any[] {
  const out: any[] = [];
  let cur: any = err;
  // Bounded; cause loops must not hang.
  for (let i = 0; cur && i < 10; i++) {
    out.push(cur);
    cur = cur.cause;
  }
  return out;
}

function trimSentence(s: string): string {
  const first = s.split("\n")[0]!.trim();
  return first.length > 160 ? `${first.slice(0, 157)}…` : first;
}
