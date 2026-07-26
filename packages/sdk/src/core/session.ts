import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { PrivateKeyAccount } from "viem";
import type { ComfyContext } from "./context";
import { requireWallet } from "./context";
import { getInco, type LightningInstance } from "./inco";
import { SESSION_VERIFIER } from "../internal/constants";
import { ComfyError } from "./errors";

type Voucher = Awaited<ReturnType<LightningInstance["grantSessionKeyAllowanceVoucher"]>>;

export interface Session {
  account: PrivateKeyAccount;
  voucher: Voucher;
  expiresAt: number;
}

// One signature mints a voucher.
export async function ensureSession(ctx: ComfyContext): Promise<Session> {
  const existing = ctx.sessionRef.current;
  if (existing && existing.expiresAt > Date.now()) return existing;

  const walletClient = requireWallet(ctx);
  const inco = await getInco(ctx);
  try {
    // Throwaway account; the voucher authorizes it.
    const account = privateKeyToAccount(generatePrivateKey());
    const expiresAt = new Date(Date.now() + ctx.sessionTtlHours * 60 * 60 * 1000);
    const voucher = await inco.grantSessionKeyAllowanceVoucher(
      walletClient as never,
      account.address,
      expiresAt,
      SESSION_VERIFIER
    );
    const session: Session = { account, voucher, expiresAt: expiresAt.getTime() };
    ctx.sessionRef.current = session;
    return session;
  } catch (err) {
    throw new ComfyError("SESSION_FAILED", "Failed to grant session key.", { cause: err });
  }
}
