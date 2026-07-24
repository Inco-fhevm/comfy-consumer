import { hmacHex, safeEqualHex, type NormLog } from "../codec.js";
import { header, type Provider } from "./types.js";

// QuickNode: the active source.
// UNVALIDATED: confirm against real delivery.
export const quicknode: Provider = {
  name: "quicknode",

  // HMAC over nonce+timestamp+body.
  verify(body, headers, secret) {
    const nonce = header(headers["x-qn-nonce"]);
    const ts = header(headers["x-qn-timestamp"]);
    const sig = header(headers["x-qn-signature"]);
    if (!nonce || !ts || !sig) return false;
    return safeEqualHex(hmacHex(nonce + ts + body.toString(), secret), sig);
  },

  // Flat eth_getLogs-style list.
  extractLogs(payload) {
    const logs = Array.isArray(payload) ? payload : payload?.logs ?? payload?.data ?? [];
    return logs.map((log: any): NormLog => {
      const topics = log.topics as `0x${string}`[];
      return {
        address: String(log.address).toLowerCase() as `0x${string}`,
        topic0: topics[0],
        topics,
        data: (log.data ?? "0x") as `0x${string}`,
        blockNumber: BigInt(log.blockNumber),
        blockHash: log.blockHash as `0x${string}`,
        logIndex: Number(log.logIndex),
        txHash: log.transactionHash as `0x${string}`,
        blockTime: Number(log.blockTimestamp ?? 0),
      };
    });
  },
};
