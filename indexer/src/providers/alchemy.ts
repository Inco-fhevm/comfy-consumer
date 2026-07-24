import { verifyHmac, type NormLog } from "../codec.js";
import { header, type Provider } from "./types.js";

// Alchemy: paused backup, GraphQL payload.
export const alchemy: Provider = {
  name: "alchemy",

  verify: (body, headers, secret) => verifyHmac(body, header(headers["x-alchemy-signature"]), secret),

  extractLogs(payload) {
    const block = payload?.event?.data?.block;
    if (!block?.logs) return [];
    return block.logs.map((log: any): NormLog => {
      const topics = log.topics as `0x${string}`[];
      return {
        address: String(log.account?.address ?? log.address).toLowerCase() as `0x${string}`,
        topic0: topics[0],
        topics,
        data: (log.data ?? "0x") as `0x${string}`,
        blockNumber: BigInt(block.number),
        blockHash: block.hash as `0x${string}`,
        logIndex: Number(log.index ?? log.logIndex),
        txHash: (log.transaction?.hash ?? log.transactionHash) as `0x${string}`,
        blockTime: Number(block.timestamp ?? 0),
      };
    });
  },
};
