// src/lib/logging/context.ts
import { headers } from "next/headers";
import logger from "./logger";

interface RequestContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  query?: unknown;
  walletAddress?: string;
  chainId?: number;
}

/**
 * Create a child logger with request context
 */
export function createRequestLogger(context: RequestContext) {
  return logger.child({
    request: {
      id: context.requestId || generateRequestId(),
      userId: context.userId,
      sessionId: context.sessionId,
      ip: context.ip,
      userAgent: context.userAgent,
      method: context.method,
      path: context.path,
      query: context.query,
      walletAddress: context.walletAddress,
      chainId: context.chainId,
    },
  });
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Extract context from Next.js headers (for App Router)
 */
export async function getRequestContext() {
  try {
    const headersList = headers();
    return {
      requestId: headersList.get("x-request-id") || generateRequestId(),
      userAgent: headersList.get("user-agent") || "unknown",
      ip:
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        "unknown",
    };
  } catch {
    // Headers not available (e.g., in static generation)
    return {
      requestId: generateRequestId(),
    };
  }
}

/**
 * Create a logger with wallet context for blockchain operations
 */
export function createWalletLogger(
  walletAddress: string,
  chainId?: number,
  requestId?: string
) {
  return logger.child({
    wallet: {
      address: walletAddress,
      chainId: chainId,
    },
    request: {
      id: requestId || generateRequestId(),
    },
  });
}

/**
 * Create a logger for contract interactions
 */
export function createContractLogger(
  contractAddress: string,
  functionName: string,
  requestId?: string
) {
  return logger.child({
    contract: {
      address: contractAddress,
      function: functionName,
    },
    request: {
      id: requestId || generateRequestId(),
    },
  });
}
