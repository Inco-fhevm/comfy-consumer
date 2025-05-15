import { getAddress, formatUnits } from "viem";
import { Lightning } from "@inco/js/lite";

export const getConfig = () => {
  return Lightning.latest("demonet", 84532);
  // return CURRENT_MODE === MODES.BASE_SEPOLIA
  //   ? Lightning.latest("devnet", 84532)
  //   : Lightning.localNode();
};

/**
 * @example
 * const encryptedValue = await encryptValue({
 *   value: 100,
 *   address: "0x123...",
 *   contractAddress: "0x456..."
 * });
 */
export const encryptValue = async ({ value, address, contractAddress }) => {
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

/**
 * @example
 * const decryptedValue = await reEncryptValue({
 *   walletClient: yourWalletClient,
 *   handle: encryptionHandle
 * });
 */
export const reEncryptValue = async ({
  walletClient,
  handle,
  isformat = false,
}) => {
  if (!walletClient || !handle) {
    throw new Error("Missing required parameters for creating reencryptor");
  }

  try {
    const incoConfig = await getConfig();

    const reencryptor = await incoConfig.getReencryptor(walletClient.data);
    const backoffConfig = {
      maxRetries: 100,
      baseDelayInMs: 1000,
      backoffFactor: 1.5,
    };

    const decryptedResult = await reencryptor(
      { handle: handle },
      backoffConfig
    );

    if (!decryptedResult) {
      throw new Error("Failed to decrypt");
    }

    const decryptedEther = formatUnits(BigInt(decryptedResult.value), 18);
    const formattedValue = parseFloat(decryptedEther).toFixed(0);

    return isformat ? decryptedResult.value : formattedValue;
  } catch (error) {
    console.error("Reencryption error:", error);
    throw new Error(`Failed to reencrypt: ${error.message}`);
  }
};
