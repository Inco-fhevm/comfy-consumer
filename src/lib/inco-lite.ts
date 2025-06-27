import {
  getAddress,
  formatUnits,
  WalletClient,
  Account,
  Transport,
  Chain,
} from "viem";
import { Lightning } from "@inco/js/lite";
import { baseSepolia } from "viem/chains";

export const getConfig = () => {
  return Lightning.latest(
    process.env.NEXT_PUBLIC_INCO_ENV as "testnet" | "demonet" | "devnet",
    baseSepolia.id
  );
};

export const encryptValue = async ({
  value,
  address,
  contractAddress,
}: {
  value: bigint;
  address: `0x${string}`;
  contractAddress: `0x${string}`;
}) => {
  // Convert the input value to BigInt for proper encryption
  const valueBigInt = BigInt(value);

  // Format the contract address to checksum format for standardization
  const checksummedAddress = getAddress(contractAddress);

  const incoConfig = await getConfig();

  const encryptedData = await incoConfig.encrypt(valueBigInt, {
    accountAddress: address,
    dappAddress: checksummedAddress,
  });

  console.log("Encrypted data:", encryptedData);

  return encryptedData;
};

export const reEncryptValue = async ({
  walletClient,
  handle,
}: {
  walletClient: WalletClient;
  handle: string;
  isformat?: boolean;
}) => {
  if (!walletClient || !handle) {
    throw new Error("Missing required parameters for creating reencryptor");
  }

  try {
    const incoConfig = getConfig();
    const reencryptor = await incoConfig.getReencryptor(
      walletClient as WalletClient<Transport, Chain, Account>
    );
    const backoffConfig = {
      maxRetries: 100,
      baseDelayInMs: 1000,
      backoffFactor: 1.5,
    };

    const decryptedResult = await reencryptor(
      { handle: handle as `0x${string}` },
      backoffConfig
    );

    if (!decryptedResult) {
      throw new Error("Failed to decrypt");
    }

    const decryptedEther = formatUnits(BigInt(decryptedResult.value), 18);
    const formattedValue = parseFloat(decryptedEther).toFixed(0);

    return formattedValue;
  } catch (error: unknown) {
    console.error("Reencryption error:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to reencrypt: ${error.message}`);
    }
    throw new Error("Failed to reencrypt: Unknown error");
  }
};
