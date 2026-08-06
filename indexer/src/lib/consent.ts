import { recoverMessageAddress } from "viem";
import { termsMessage } from "@comfy/config";

export interface ConsentInput {
  address: string;
  signedAt: number;
  signature: string;
}

// Rebuild the canonical message and recover the signer.
export async function verifyConsent(input: ConsentInput): Promise<{ ok: boolean; message: string }> {
  const address = input.address.toLowerCase();
  const message = termsMessage({ address, signedAt: input.signedAt });
  try {
    const recovered = await recoverMessageAddress({
      message,
      signature: input.signature as `0x${string}`,
    });
    return { ok: recovered.toLowerCase() === address, message };
  } catch {
    return { ok: false, message }; // malformed signature
  }
}
