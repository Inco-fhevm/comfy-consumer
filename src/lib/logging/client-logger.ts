"use client";

interface LogData {
  level: string;
  message: string;
  data?: unknown;
  timestamp: string;
  url: string;
  userAgent: string;
}

const clientLogger = {
  log: (level: string, message: string, data?: unknown) => {
    const logData: LogData = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    };

    // Always log to console for development
    const colors = {
      error: "\x1b[31m", // red
      warn: "\x1b[33m", // yellow
      info: "\x1b[32m", // green
      debug: "\x1b[37m", // white
    };
    const reset = "\x1b[0m";
    const color = colors[level as keyof typeof colors] || colors.info;

    console.log(
      `${color}[CLIENT ${level.toUpperCase()}]${reset}`,
      message,
      data
    );

    // In production, also send to server for file logging
    if (process.env.NODE_ENV === "production") {
      fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      }).catch((error) => {
        console.error("Failed to send client log to server:", error);
      });
    }
  },

  error: (message: string, data?: unknown) =>
    clientLogger.log("error", message, data),
  warn: (message: string, data?: unknown) =>
    clientLogger.log("warn", message, data),
  info: (message: string, data?: unknown) =>
    clientLogger.log("info", message, data),
  debug: (message: string, data?: unknown) =>
    clientLogger.log("debug", message, data),

  // Wallet-specific logging
  wallet: {
    connect: (walletAddress: string, chainId: number) => {
      clientLogger.info("Wallet connected", {
        walletAddress,
        chainId,
        action: "wallet_connect",
      });
    },

    disconnect: (walletAddress: string) => {
      clientLogger.info("Wallet disconnected", {
        walletAddress,
        action: "wallet_disconnect",
      });
    },

    switchChain: (fromChainId: number, toChainId: number) => {
      clientLogger.info("Chain switched", {
        fromChainId,
        toChainId,
        action: "chain_switch",
      });
    },
  },

  // Transaction-specific logging
  transaction: {
    start: (txType: string, to?: string) => {
      clientLogger.info("Transaction started", {
        txType,
        to,
        action: "transaction_start",
      });
    },

    success: (txHash: string, txType: string) => {
      clientLogger.info("Transaction successful", {
        txHash,
        txType,
        action: "transaction_success",
      });
    },

    error: (error: string, txType: string) => {
      clientLogger.error("Transaction failed", {
        error,
        txType,
        action: "transaction_error",
      });
    },
  },

  // Balance-specific logging
  balance: {
    fetch: (balanceType: "token" | "encrypted") => {
      clientLogger.debug("Balance fetched", {
        balanceType,
        action: "balance_fetch",
      });
    },

    update: (balanceType: "token" | "encrypted") => {
      clientLogger.info("Balance updated", {
        balanceType,
        action: "balance_update",
      });
    },
  },
};

export default clientLogger;
