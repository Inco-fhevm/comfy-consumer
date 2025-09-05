const http = require("http");
const {
  register,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} = require("prom-client");

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({
  prefix: "comfy_consumer_",
  timeout: 10000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Custom metrics for Comfy Consumer
const httpRequestDuration = new Histogram({
  name: "comfy_consumer_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new Counter({
  name: "comfy_consumer_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const contractInteractions = new Counter({
  name: "comfy_consumer_contract_interactions_total",
  help: "Total number of contract interactions",
  labelNames: ["contract_type", "function_name", "status"],
});

const walletConnections = new Counter({
  name: "comfy_consumer_wallet_connections_total",
  help: "Total number of wallet connections",
  labelNames: ["action"], // connect, disconnect, switch_chain
});

const transactionMetrics = new Counter({
  name: "comfy_consumer_transactions_total",
  help: "Total number of transactions",
  labelNames: ["type", "status"], // mint_cUSDC, mint_USDC, shield, unshield, confidential_send, success, error
});

const activeConnections = new Gauge({
  name: "comfy_consumer_active_connections",
  help: "Number of active connections",
});

const encryptedBalanceFetches = new Counter({
  name: "comfy_consumer_encrypted_balance_fetches_total",
  help: "Total number of encrypted balance fetches",
  labelNames: ["status"], // success, error
});

// Simple token authentication for security
const METRICS_TOKEN =
  process.env.METRICS_TOKEN ||
  require("crypto").randomBytes(32).toString("hex");
console.log(`Metrics server token: ${METRICS_TOKEN}`);

// Create metrics server
const metricsServer = http.createServer(async (req, res) => {
  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${METRICS_TOKEN}`) {
    res.statusCode = 401;
    res.end("Unauthorized");
    return;
  }

  if (req.url === "/metrics") {
    try {
      res.setHeader("Content-Type", register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.statusCode = 500;
      res.end("Error generating metrics");
    }
  } else if (req.url === "/health") {
    res.statusCode = 200;
    res.end("OK");
  } else {
    res.statusCode = 404;
    res.end("Not Found");
  }
});

const METRICS_PORT = process.env.METRICS_PORT || 9090;
metricsServer.listen(METRICS_PORT, "0.0.0.0", () => {
  console.log(`Secure metrics server running on port ${METRICS_PORT}`);
  console.log(`Use token: ${METRICS_TOKEN} for authentication`);
});

// Export metrics for use in the main application
module.exports = {
  httpRequestDuration,
  httpRequestTotal,
  contractInteractions,
  walletConnections,
  transactionMetrics,
  activeConnections,
  encryptedBalanceFetches,
  METRICS_TOKEN,
};
