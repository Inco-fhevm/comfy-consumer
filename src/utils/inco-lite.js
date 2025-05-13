import { getAddress, formatUnits } from "viem";
import { Lightning } from "@inco/js/lite";

export const getConfig = () => {
  return Lightning.latest("testnet", 84532);
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

    const maxRetries = 100;
    const baseDelayInMs = 1000;
    const backoffFactor = 1.3;

    let decrypted = false;
    let decryptedResult = null;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt + 1}: Attempting to decrypt...`);
        decryptedResult = await reencryptor({ handle });

        if (decryptedResult) {
          decrypted = true;
          break;
        }
      } catch (error) {
        lastError = error;
        console.error(`Error on attempt ${attempt + 1}:`, error);

        if (attempt === maxRetries - 1) {
          break;
        }

        const delay = baseDelayInMs * Math.pow(backoffFactor, attempt);
        const jitter = delay * (0.8 + Math.random() * 0.4); // jitter: 80% - 120%
        console.log(`Retrying in ${Math.round(jitter)}ms...`);
        await new Promise(resolve => setTimeout(resolve, jitter));
      }
    }

    if (!decryptedResult) {
      throw lastError || new Error("Failed to decrypt after retries");
    }

    console.log("Decrypted result:", decryptedResult);

    const decryptedEther = formatUnits(BigInt(decryptedResult.value), 18);
    const formattedValue = parseFloat(decryptedEther).toFixed(0);

    return isformat ?  decryptedResult.value : formattedValue
  } catch (error) {
    throw new Error(`Failed to create reencryptor: ${error.message}`);
  }
};


