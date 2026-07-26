import { Lightning, AttestedComputeSupportedOps } from "@inco/lightning-js/lite";
import { handleTypes } from "@inco/lightning-js";
import { bytesToHex, pad, toHex } from "viem";
import type { ComfyContext } from "./context";
import { requireWallet } from "./context";
import type { Address, Hex } from "./types";

// @inco/lightning-js lite instance type.
export type LightningInstance = Awaited<ReturnType<typeof Lightning.baseSepoliaTestnet>>;

// Lazy, cached per context.
export function getInco(ctx: ComfyContext): Promise<LightningInstance> {
  if (!ctx.incoRef.current) {
    ctx.incoRef.current =
      ctx.network === "base" ? Lightning.baseMainnet() : Lightning.baseSepoliaTestnet();
  }
  return ctx.incoRef.current;
}

export async function encryptAmount(
  ctx: ComfyContext,
  value: bigint,
  account: Address,
  dapp: Address
): Promise<Hex> {
  const inco = await getInco(ctx);
  const ciphertext = await inco.encrypt(value, {
    accountAddress: account,
    dappAddress: dapp,
    handleType: handleTypes.euint256,
  });
  return ciphertext as Hex;
}

const GET_FEE_ABI = [
  {
    type: "function",
    name: "getFee",
    stateMutability: "pure",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

// Ciphertext-ingest fee for a payable confidentialTransfer.
export async function getFee(ctx: ComfyContext): Promise<bigint> {
  const inco = await getInco(ctx);
  return ctx.publicClient.readContract({
    address: inco.executorAddress as Address,
    abi: GET_FEE_ABI,
    functionName: "getFee",
  });
}

// Signed `checkpoint >= amount` attestation.
export async function attestedGe(
  ctx: ComfyContext,
  lhsHandle: Hex,
  rhsPlaintext: bigint
): Promise<{ attestation: { handle: Hex; value: Hex }; signature: Hex[] }> {
  const inco = await getInco(ctx);
  const walletClient = requireWallet(ctx);
  // wagmi WalletClient is looser.
  const result = await inco.attestedCompute(
    walletClient as never,
    lhsHandle,
    AttestedComputeSupportedOps.Ge,
    rhsPlaintext
  );
  const signature = result.covalidatorSignatures.map((sig: Uint8Array) => bytesToHex(sig));
  const value = (
    typeof result.plaintext.value === "boolean"
      ? result.plaintext.value
        ? `0x${"0".repeat(63)}1`
        : `0x${"0".repeat(64)}`
      : pad(toHex(result.plaintext.value as bigint), { size: 32 })
  ) as Hex;
  return { attestation: { handle: result.handle as Hex, value }, signature };
}
