import { AttestedComputeSupportedOps, Lightning } from "@inco/js/lite";
import { handleTypes } from "@inco/js";
import type { WalletClient } from "viem";
import {
  bytesToHex,
  createPublicClient,
  formatEther,
  http,
  pad,
  toHex,
} from "viem";
import { baseSepolia } from "viem/chains";

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export type IncoEnv = "devnet" | "testnet";

/**
 * Get or initialize the Inco configuration based on the current chain
 */
export async function getConfig() {
  const chainId = publicClient.chain.id;
  console.log(`🔧 Initializing Inco config for chain: ${chainId}`);
  const incoConfig = await Lightning.latest("devnet", baseSepolia.id); // Base Sepolia
  return incoConfig;
}

/**
 * Encrypt a value for a specific contract and account
 */
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

/**
 * Re-encrypt and decrypt a handle for a specific wallet
 */
export async function decryptValue({
  walletClient,
  handle,
}: {
  walletClient: WalletClient;
  handle: string;
}): Promise<bigint> {
  const inco = await getConfig();

  // Get attested decrypt for the wallet
  const attestedDecrypt = await inco.attestedDecrypt(
    // @ts-expect-error - walletClient is not typed
    walletClient,
    [handle]
  );

  console.log("Attested decrypt: ", attestedDecrypt);

  // Return the decrypted value
  const formattedValue = formatEther(
    attestedDecrypt[0].plaintext.value as bigint
  );

  return BigInt(formattedValue);
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

  // Encode the plaintext value as bytes32
  // For boolean: true = 1, false = 0, padded to 32 bytes
  const encodedValue = (
    typeof result.plaintext.value === "boolean"
      ? result.plaintext.value
        ? "0x" + "0".repeat(63) + "1"
        : "0x" + "0".repeat(64)
      : pad(toHex(result.plaintext.value as bigint), { size: 32 })
  ) as `0x${string}`;

  // Return in format expected by contract:
  // - plaintext: the actual decrypted value
  // - attestation: { handle, value } for the DecryptionAttestation struct
  // - signature array for verification
  return {
    plaintext: result.plaintext.value,
    attestation: {
      handle: result.handle,
      value: encodedValue,
    },
    signature: signatures,
  };
};

/**
 * Get the fee required for Inco operations
 */
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
