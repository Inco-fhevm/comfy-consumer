import clientLogger from "@/lib/logging/client-logger";

type Status = "success" | "error";

// Metric events → structured logs (Grafana/Loki).
function emit(metric: string, attrs: Record<string, unknown>) {
  clientLogger.info(`metric:${metric}`, { metric, ...attrs });
}

export function recordTransaction(
  type: "shield" | "unshield" | "confidential_send",
  status: Status
) {
  emit("transaction", { type, status });
}

export function recordWalletConnection(action: "connect" | "disconnect" | "switch_chain") {
  emit("wallet_connection", { action });
}

export function recordContractInteraction(contractType: string, functionName: string, status: Status) {
  emit("contract_interaction", { contractType, functionName, status });
}

export function recordEncryptedBalanceFetch(status: Status) {
  emit("encrypted_balance_fetch", { status });
}
