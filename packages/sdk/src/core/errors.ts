export type ComfyErrorCode =
  | "WALLET_REQUIRED"
  | "NOT_CONNECTED"
  | "WRAPPER_NOT_FOUND"
  | "INDEXER_NOT_CONFIGURED"
  | "INDEXER_UNAVAILABLE"
  | "TX_REVERTED"
  | "DECRYPT_FAILED"
  | "SESSION_FAILED"
  | "INVALID_ADDRESS"
  | "INVALID_AMOUNT"
  | "UNSUPPORTED_NETWORK";

// Single typed error; switch on `.code`.
export class ComfyError extends Error {
  readonly code: ComfyErrorCode;
  constructor(code: ComfyErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ComfyError";
    this.code = code;
  }
}
