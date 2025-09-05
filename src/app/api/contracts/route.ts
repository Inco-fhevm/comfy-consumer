import { NextRequest, NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logging/context";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Create a logger with request context
  const requestLogger = createRequestLogger({
    requestId: request.headers.get("x-request-id") || undefined,
    method: "GET",
    path: "/api/contracts",
    ip: request.ip || request.headers.get("x-forwarded-for") || undefined,
    userAgent: request.headers.get("user-agent") || undefined,
  });

  try {
    requestLogger.info("Processing contracts API request");

    const ENCRYPTED_ERC20_CONTRACT_ADDRESS =
      process.env.ENCRYPTED_ERC20_CONTRACT_ADDRESS;
    const ERC20_CONTRACT_ADDRESS = process.env.ERC20_CONTRACT_ADDRESS;
    const INCO_ENV = process.env.INCO_ENV;
    const REOWN_APP_ID = process.env.REOWN_APP_ID;

    // Validate required environment variables
    if (
      !ENCRYPTED_ERC20_CONTRACT_ADDRESS ||
      !ERC20_CONTRACT_ADDRESS ||
      !INCO_ENV ||
      !REOWN_APP_ID
    ) {
      requestLogger.error("Missing required environment variables", {
        hasEncryptedERC20: !!ENCRYPTED_ERC20_CONTRACT_ADDRESS,
        hasERC20: !!ERC20_CONTRACT_ADDRESS,
        hasIncoEnv: !!INCO_ENV,
        hasReownAppId: !!REOWN_APP_ID,
      });

      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 }
      );
    }

    const contractData = {
      encryptedERC20: {
        address: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
      },
      erc20: {
        address: ERC20_CONTRACT_ADDRESS,
      },
      incoEnv: INCO_ENV,
      REOWN_APP_ID: REOWN_APP_ID,
    };

    requestLogger.info("Contracts API request successful", {
      contractCount: 2,
      incoEnv: INCO_ENV,
      statusCode: 200,
    });

    return NextResponse.json(contractData);
  } catch (error) {
    requestLogger.error("Contracts API request failed", {
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
