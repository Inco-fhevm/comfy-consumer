class MetricsCollector {
  private isServer: boolean;
  private metricsEndpoint: string;

  constructor() {
    this.isServer = typeof window === "undefined";
    this.metricsEndpoint = "/api/metrics";
  }

  // Record contract interaction metrics
  recordContractInteraction(
    contractType: string,
    functionName: string,
    status: "success" | "error"
  ) {
    if (this.isServer) {
      // Server-side: Direct metrics recording
      this.recordServerMetric("contract_interaction", {
        contractType,
        functionName,
        status,
      });
    } else {
      // Client-side: Send to API endpoint
      this.recordClientMetric("contract_interaction", {
        contractType,
        functionName,
        status,
      });
    }
  }

  // Record wallet connection metrics
  recordWalletConnection(action: "connect" | "disconnect" | "switch_chain") {
    if (this.isServer) {
      this.recordServerMetric("wallet_connection", { action });
    } else {
      this.recordClientMetric("wallet_connection", { action });
    }
  }

  // Record transaction metrics
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

  // Record encrypted balance fetch metrics
  recordEncryptedBalanceFetch(status: "success" | "error") {
    if (this.isServer) {
      this.recordServerMetric("encrypted_balance_fetch", { status });
    } else {
      this.recordClientMetric("encrypted_balance_fetch", { status });
    }
  }

  // Server-side metrics recording
  private recordServerMetric(type: string, data: Record<string, unknown>) {
    try {
      // Only record metrics on server-side, skip client-side
      console.log(`[Metrics] ${type}:`, data);
    } catch (error) {
      console.error("Failed to record server metric:", error);
    }
  }

  // Client-side metrics recording
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

// Export singleton instance
export const metrics = new MetricsCollector();

// Convenience functions for common metrics
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
