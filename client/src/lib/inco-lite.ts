import { AttestedComputeSupportedOps, Lightning } from "@inco/lightning-js/lite";
import { handleTypes, type HexString } from "@inco/lightning-js";
import type { PrivateKeyAccount, WalletClient } from "viem";
import {
  bytesToHex,
  createPublicClient,
  formatUnits,
  http,
  pad,
  toHex,
} from "viem";
import { ACTIVE_CHAIN, IS_TESTNET, SESSION_VERIFIER } from "@/lib/constants";

const publicClient = createPublicClient({
  chain: ACTIVE_CHAIN,
  transport: http(),
});

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

export async function encryptValue({
  value,
  address,
  contractAddress,
}: {
  value: bigint;
  address: `0x${string}`;
  contractAddress: `0x${string}`;
}): Promise<`0x${string}`> {
  const inco = await getConfig();

  const encryptedData = await inco.encrypt(value, {
    accountAddress: address,
    dappAddress: contractAddress,
    handleType: handleTypes.euint256,
  });
  return encryptedData as `0x${string}`;
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

export const attestedCompute = async ({
  walletClient,
  lhsHandle,
  op,
  rhsPlaintext,
}: {
  walletClient: WalletClient;
  lhsHandle: `0x${string}`;
  op: (typeof AttestedComputeSupportedOps)[keyof typeof AttestedComputeSupportedOps];
  rhsPlaintext: bigint;
}) => {
  const incoConfig = await getConfig();

  const result = await incoConfig.attestedCompute(
    // @ts-expect-error - walletClient is not typed
    walletClient,
    lhsHandle as `0x${string}`,
    op,
    rhsPlaintext
  );

  const signatures = result.covalidatorSignatures.map((sig: Uint8Array) =>
    bytesToHex(sig)
  );

  const encodedValue = (
    typeof result.plaintext.value === "boolean"
      ? result.plaintext.value
        ? "0x" + "0".repeat(63) + "1"
        : "0x" + "0".repeat(64)
      : pad(toHex(result.plaintext.value as bigint), { size: 32 })
  ) as `0x${string}`;

  return {
    plaintext: result.plaintext.value,
    attestation: {
      handle: result.handle,
      value: encodedValue,
    },
    signature: signatures,
  };
};

export async function getFee(): Promise<bigint> {
  const inco = await getConfig();

  const fee = await publicClient.readContract({
    address: inco.executorAddress,
    abi: [
      {
        type: "function",
        inputs: [],
        name: "getFee",
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        stateMutability: "pure",
      },
    ],
    functionName: "getFee",
  });

  return fee;
}
