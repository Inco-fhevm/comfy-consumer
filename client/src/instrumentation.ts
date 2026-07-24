import { registerOTel } from "@vercel/otel";

// Auto-traces → OTLP (Grafana). No-op until a collector is configured.
export function register() {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT && !process.env.VERCEL) return;
  registerOTel({ serviceName: process.env.OTEL_SERVICE_NAME || "comfy-consumer" });
}
