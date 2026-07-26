import type { ComfyContext } from "./context";
import { requireWallet } from "./context";
import { getInco } from "./inco";
import { ensureSession } from "./session";
import { fromBaseUnits } from "./amounts";
import { ComfyError } from "./errors";
import type { Hex } from "./types";

// Batch: one attested call.
// Browser voucher; node direct.
export async function decryptHandles(ctx: ComfyContext, handles: Hex[]): Promise<bigint[]> {
  if (handles.length === 0) return [];
  const inco = await getInco(ctx);
  try {
    if (ctx.mode === "browser") {
      const session = await ensureSession(ctx);
      const results = await inco.attestedDecryptWithVoucher(
        session.account as never,
        session.voucher,
        handles
      );
      return results.map((r) => r.plaintext.value as bigint);
    }
    const signer = requireWallet(ctx);
    const results = await inco.attestedDecrypt(signer as never, handles);
    return results.map((r) => r.plaintext.value as bigint);
  } catch (err) {
    if (err instanceof ComfyError) throw err;
    throw new ComfyError("DECRYPT_FAILED", "Failed to decrypt handle(s).", { cause: err });
  }
}

export interface DecryptArgs {
  handle: Hex;
  decimals?: number;
}

export async function decryptValue(ctx: ComfyContext, args: DecryptArgs): Promise<number> {
  const [value] = await decryptHandles(ctx, [args.handle]);
  return fromBaseUnits(value, args.decimals ?? 18);
}
