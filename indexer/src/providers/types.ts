import type { IncomingHttpHeaders } from "node:http";
import type { NormLog } from "../codec.js";
import type { ProviderName } from "../config.js";

// A webhook source.
export interface Provider {
  name: ProviderName;
  verify(body: Buffer, headers: IncomingHttpHeaders, secret: string): boolean;
  extractLogs(payload: any): NormLog[];
}

// First value of a header.
export const header = (h: string | string[] | undefined) => (Array.isArray(h) ? h[0] : h) ?? "";
