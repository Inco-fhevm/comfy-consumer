import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logging/logger";
import { createRequestLogger } from "@/lib/logging/context";

export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger({
    method: request.method,
    path: "/api/logs",
    ip: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  });

  // Reject cross-site posts + oversized bodies.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.nextUrl.host)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 16_384)
    return NextResponse.json({ error: "too large" }, { status: 413 });

  try {
    const body = await request.json();
    const { level, message, data, ...metadata } = body;
    const lvl = ["error", "warn", "info", "http", "debug"].includes(level) ? level : "info";

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

    logger.log(lvl, `[Client] ${String(message).slice(0, 2000)}`, {
      source: "client",
      clientData: data === undefined ? undefined : JSON.stringify(data).slice(0, 8000),
      ...metadata,
      request: {
        id: request.headers.get("x-request-id") || "unknown",
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Minimal response, no data exposure
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

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
