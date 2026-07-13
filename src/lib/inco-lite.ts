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
import { baseSepolia } from "viem/chains";

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Cached singleton, the Lightning config is immutable for a given network.
let lightningPromise: ReturnType<typeof Lightning.baseSepoliaTestnet> | null =
  null;

export async function getConfig() {
  if (!lightningPromise) {
    console.log(`🔧 Initializing Inco Lightning config for chain: ${baseSepolia.id}`);
    lightningPromise = Lightning.baseSepoliaTestnet();
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

export async function decryptValue({
  walletClient,
  handle,
  decimals = 18,
}: {
  walletClient: WalletClient;
  handle: string;
  decimals?: number;
}): Promise<number> {
  const inco = await getConfig();

  // Get attested decrypt for the wallet
  const attestedDecrypt = await inco.attestedDecrypt(
    // @ts-expect-error - walletClient is not typed
    walletClient,
    [handle]
  );

  console.log("Attested decrypt: ", attestedDecrypt);

  // Return the decrypted value formatted using the token's decimals
  const formattedValue = formatUnits(
    attestedDecrypt[0].plaintext.value as bigint,
    decimals
  );

  return Number(formattedValue);
}

const DEFAULT_SESSION_VERIFIER =
  "0xc34569efc25901bdd6b652164a2c8a7228b23005";

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
    DEFAULT_SESSION_VERIFIER
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
    // @inco/lightning-js bundles its own viem, so cast to the SDK's own
    // PrivateKeyAccount type to bridge the duplicate-viem nominal mismatch.
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
  rhsPlaintext: `0x${string}`;
}) => {
  const incoConfig = await getConfig();

  const result = await incoConfig.attestedCompute(
    // @ts-expect-error - walletClient is not typed
    walletClient,
    lhsHandle as `0x${string}`,
    op,
    rhsPlaintext
  );

  // Convert Uint8Array signatures to hex strings
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

  // Read the fee from the Lightning contract
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

  console.log("Fee: ", fee);
  return fee;
}
