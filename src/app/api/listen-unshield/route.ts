import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { parseAbiItem } from "viem";
import {
  createRequestLogger,
  createContractLogger,
} from "@/lib/logging/context";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Create a logger with request context
  const requestLogger = createRequestLogger({
    requestId: request.headers.get("x-request-id") || undefined,
    method: "POST",
    path: "/api/listen-unshield",
    ip: request.ip || request.headers.get("x-forwarded-for") || undefined,
    userAgent: request.headers.get("user-agent") || undefined,
  });

  try {
    requestLogger.info("Starting unshield event monitoring");

    const privateRPC = process.env.BASE_SEPOLIA_RPC;
    const ENCRYPTED_ERC20_CONTRACT_ADDRESS = process.env
      .ENCRYPTED_ERC20_CONTRACT_ADDRESS as `0x${string}`;

    // Validate environment variables
    if (!privateRPC || !ENCRYPTED_ERC20_CONTRACT_ADDRESS) {
      requestLogger.error(
        "Missing required environment variables for unshield monitoring",
        {
          hasPrivateRPC: !!privateRPC,
          hasContractAddress: !!ENCRYPTED_ERC20_CONTRACT_ADDRESS,
        }
      );

      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 }
      );
    }

    const contractLogger = createContractLogger(
      ENCRYPTED_ERC20_CONTRACT_ADDRESS,
      "Unwrap",
      request.headers.get("x-request-id") || undefined
    );

    contractLogger.info("Creating public client for event monitoring", {
      rpc: privateRPC,
      chainId: baseSepolia.id,
    });

    const pubClient = createPublicClient({
      transport: http(privateRPC),
      chain: baseSepolia,
    });

    const eventPromise: Promise<unknown[] | null> = new Promise((resolve) => {
      contractLogger.info("Setting up event watcher for Unwrap events");

      const unwatch = pubClient.watchEvent({
        address: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
        event: parseAbiItem(
          "event Unwrap(address indexed account, uint256 amount)"
        ),
        onLogs: (logs: unknown[]) => {
          contractLogger.info("Unwrap events detected", {
            eventCount: logs.length,
            events: logs,
          });
          unwatch();
          resolve(logs);
        },
      });

      // 20 second timeout
      setTimeout(() => {
        contractLogger.warn("Event monitoring timeout reached", {
          timeoutMs: 20000,
          contractAddress: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
        });
        unwatch();
        resolve(null);
      }, 20000);
    });

    const logs = await eventPromise;

    const response = { logs };

    requestLogger.info("Unshield monitoring completed", {
      eventCount: logs ? logs.length : 0,
      hasEvents: !!logs,
      statusCode: 200,
    });

    return new NextResponse(
      JSON.stringify(response, (_key: string, value: unknown) => {
        return typeof value === "bigint" ? value.toString() : value;
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    requestLogger.error("Unshield monitoring failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      statusCode: 500,
    });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
