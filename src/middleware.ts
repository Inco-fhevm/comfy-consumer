import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Generate request ID
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // Create response with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add request ID to response headers for tracing
  response.headers.set("x-request-id", requestId);

  // Log the request (Note: Can't use Winston here directly due to Edge Runtime)
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
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
      service: process.env.SERVICE_NAME || "comfy-consumer",
      environment: process.env.NODE_ENV || "development",
    })
  );

  return response;
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|images|tokens|chains|pfp|not-connected).*)",
  ],
};
