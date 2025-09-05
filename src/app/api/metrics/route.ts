import { NextRequest, NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logging/context";

export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger({
    method: request.method,
    path: "/api/metrics",
    ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  });

  try {
    const body = await request.json();
    const { type, data, timestamp } = body;

    // Validate required fields
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

    // Record metrics on server-side
    try {
      // For now, just log the metrics - the actual Prometheus metrics will be recorded
      // by the metrics server when it receives the data
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

    // Return minimal response - no data exposure
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
