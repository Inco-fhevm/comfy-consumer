"use client";

// Console in dev; forward to /api/logs in prod
function emit(level: "info" | "error", message: string, data?: unknown) {
  console[level === "error" ? "error" : "log"](`[client:${level}]`, message, data ?? "");
  if (process.env.NODE_ENV === "production") {
    fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "unknown",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      }),
    }).catch(() => {});
  }
}

const clientLogger = {
  info: (message: string, data?: unknown) => emit("info", message, data),
  error: (message: string, data?: unknown) => emit("error", message, data),
};

export default clientLogger;
