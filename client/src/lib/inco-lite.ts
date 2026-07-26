import { Lightning } from "@inco/lightning-js/lite";
import { type HexString } from "@inco/lightning-js";
import { formatUnits, type PrivateKeyAccount, type WalletClient } from "viem";
import { IS_TESTNET, SESSION_VERIFIER } from "@/lib/constants";

// Cached singleton; config is immutable
let lightningPromise: ReturnType<typeof Lightning.baseSepoliaTestnet> | null =
  null;

export async function getConfig() {
  if (!lightningPromise) {
    lightningPromise = IS_TESTNET
      ? Lightning.baseSepoliaTestnet()
      : Lightning.baseMainnet();
  }
  return lightningPromise;
}

export async function grantSessionKey({
  walletClient,
  granteeAddress,
  expiresAt,
}: {
  walletClient: WalletClient;
  granteeAddress: `0x${string}`;
  expiresAt: Date;
}) {
  const inco = await getConfig();
  const voucher = await inco.grantSessionKeyAllowanceVoucher(
    // @ts-expect-error - wagmi's WalletClient is structurally looser than the SDK's
    walletClient,
    granteeAddress,
    expiresAt,
    SESSION_VERIFIER
  );
  return voucher;
}

export type SessionVoucher = Awaited<ReturnType<typeof grantSessionKey>>;

export async function decryptValueWithVoucher({
  account,
  voucher,
  handle,
  decimals = 18,
}: {
  account: PrivateKeyAccount;
  voucher: SessionVoucher;
  handle: string;
  decimals?: number;
}): Promise<number> {
  const inco = await getConfig();
  const results = await inco.attestedDecryptWithVoucher(
    // SDK bundles its own viem
    account as Parameters<typeof inco.attestedDecryptWithVoucher>[0],
    voucher,
    [handle as HexString]
  );
  const formattedValue = formatUnits(
    results[0].plaintext.value as bigint,
    decimals
  );
  return Number(formattedValue);
}
