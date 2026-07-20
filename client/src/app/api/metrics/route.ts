import { NextRequest, NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logging/context";

export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger({
    method: request.method,
    path: "/api/metrics",
    ip: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  });

  try {
    const body = await request.json();
    const { type, data, timestamp } = body;

    if (!type || !data) {
      requestLogger.warn("Invalid metrics data received", {
        hasType: !!type,
        hasData: !!data,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    try {
      // Prometheus recording happens in metrics server
      requestLogger.info("Client metric received", {
        type,
        data: JSON.stringify(data),
        timestamp,
      });
    } catch (metricsError) {
      requestLogger.error("Failed to record client metric", {
        error:
          metricsError instanceof Error
            ? metricsError.message
            : "Unknown error",
        type,
        data: JSON.stringify(data),
      });
    }

    // Minimal response, no data exposure
    return NextResponse.json({ success: true });
  } catch (error) {
    requestLogger.error("Failed to process client metrics", {
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
