import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logging/logger";
import { createRequestLogger } from "@/lib/logging/context";

export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger({
    method: request.method,
    path: "/api/logs",
    ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  });

  try {
    const body = await request.json();
    const { level, message, data, ...metadata } = body;

    // Validate required fields
    if (!level || !message) {
      requestLogger.warn("Invalid log data received", {
        hasLevel: !!level,
        hasMessage: !!message,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log the client event to server-side files
    logger.log(level || "info", `[Client] ${message}`, {
      source: "client",
      clientData: data,
      ...metadata,
      request: {
        id: request.headers.get("x-request-id") || "unknown",
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Return minimal response - no data exposure
    return NextResponse.json({ success: true });
  } catch (error) {
    requestLogger.error("Failed to process client log", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Block all other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
