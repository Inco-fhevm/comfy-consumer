import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next 16 renamed middleware to proxy
export function proxy(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("x-request-id", requestId);

  // Winston can't run on Edge runtime
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Incoming request",
      request: {
        id: requestId,
        method: request.method,
        url: request.url,
        path: request.nextUrl.pathname,
        query: Object.fromEntries(request.nextUrl.searchParams),
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
      service: process.env.SERVICE_NAME || "comfy-consumer",
      environment: process.env.NODE_ENV || "development",
    })
  );

  return response;
}

export const config = {
  matcher: [
    // Everything except static/public assets
    "/((?!_next/static|_next/image|favicon.ico|icons|images|tokens|chains|pfp|not-connected).*)",
  ],
};
