class MetricsCollector {
  private isServer: boolean;
  private metricsEndpoint: string;

  constructor() {
    this.isServer = typeof window === "undefined";
    this.metricsEndpoint = "/api/metrics";
  }

  recordContractInteraction(
    contractType: string,
    functionName: string,
    status: "success" | "error"
  ) {
    if (this.isServer) {
      this.recordServerMetric("contract_interaction", {
        contractType,
        functionName,
        status,
      });
    } else {
      this.recordClientMetric("contract_interaction", {
        contractType,
        functionName,
        status,
      });
    }
  }

  recordWalletConnection(action: "connect" | "disconnect" | "switch_chain") {
    if (this.isServer) {
      this.recordServerMetric("wallet_connection", { action });
    } else {
      this.recordClientMetric("wallet_connection", { action });
    }
  }

  recordTransaction(
    type:
      | "mint_cUSDC"
      | "mint_USDC"
      | "shield"
      | "unshield"
      | "confidential_send",
    status: "success" | "error"
  ) {
    if (this.isServer) {
      this.recordServerMetric("transaction", { type, status });
    } else {
      this.recordClientMetric("transaction", { type, status });
    }
  }

  recordEncryptedBalanceFetch(status: "success" | "error") {
    if (this.isServer) {
      this.recordServerMetric("encrypted_balance_fetch", { status });
    } else {
      this.recordClientMetric("encrypted_balance_fetch", { status });
    }
  }

  private recordServerMetric(type: string, data: Record<string, unknown>) {
    try {
      console.log(`[Metrics] ${type}:`, data);
    } catch (error) {
      console.error("Failed to record server metric:", error);
    }
  }

  private recordClientMetric(type: string, data: Record<string, unknown>) {
    try {
      fetch(this.metricsEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString(),
        }),
      }).catch((error) => {
        console.error("Failed to send client metric:", error);
      });
    } catch (error) {
      console.error("Failed to record client metric:", error);
    }
  }
}

export const metrics = new MetricsCollector();

export const recordContractInteraction = (
  contractType: string,
  functionName: string,
  status: "success" | "error"
) => {
  metrics.recordContractInteraction(contractType, functionName, status);
};

export const recordWalletConnection = (
  action: "connect" | "disconnect" | "switch_chain"
) => {
  metrics.recordWalletConnection(action);
};

export const recordTransaction = (
  type:
    | "mint_cUSDC"
    | "mint_USDC"
    | "shield"
    | "unshield"
    | "confidential_send",
  status: "success" | "error"
) => {
  metrics.recordTransaction(type, status);
};

export const recordEncryptedBalanceFetch = (status: "success" | "error") => {
  metrics.recordEncryptedBalanceFetch(status);
};
