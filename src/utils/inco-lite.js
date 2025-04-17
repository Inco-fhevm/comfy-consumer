import {
  generateSecp256k1Keypair,
  decodeSecp256k1PublicKey,
  getEciesEncryptor,
  incoLiteReencryptor,
} from "@inco-fhevm/js/lite";
import { hexToBytes } from "viem";
import { getAddress, formatUnits } from "viem";

export const SELECTED_NETWORK = "baseSepolia";
export const KMS_CONNECT_ENDPOINT =
  "https://grpc.basesepolia.covalidator.denver.inco.org";

export const encryptValue = async ({
  value,
  address,
  config,
  contractAddress,
}) => {
  const valueBigInt = BigInt(value);

  const checksummedAddress = getAddress(contractAddress);

  const plaintextWithContext = {
    plaintext: {
      scheme: 1, // encryptionSchemes.ecies
      value: valueBigInt,
      type: 8, // handleTypes.uint256
    },
    context: {
      hostChainId: BigInt(config.chainId),
      aclAddress: config.deployedAtAddress,
      userAddress: address,
      contractAddress: checksummedAddress,
    },
  };

  const ephemeralKeypair = await generateSecp256k1Keypair();

  const eciesPubKey = decodeSecp256k1PublicKey(
    hexToBytes(config.eciesPublicKey)
  );

  const encryptor = getEciesEncryptor({
    scheme: 1, // encryptionSchemes.ecies
    pubKeyA: eciesPubKey,
    privKeyB: ephemeralKeypair,
  });

  const inputCt = await encryptor(plaintextWithContext);
  console.log("inputCt", inputCt);
  return { inputCt };
};

export const reEncryptValue = async ({ chainId, walletClient, handle }) => {
  if (!chainId || !walletClient || !handle) {
    throw new Error("Missing required parameters for creating reencryptor");
  }

  try {
    const reencryptor = await incoLiteReencryptor({
      chainId: chainId,
      walletClient: walletClient.data,
      kmsConnectRpcEndpointOrClient: KMS_CONNECT_ENDPOINT,
    });

    const rawDecrypted = await reencryptor({
      handle,
    });

    const decryptedEther = formatUnits(BigInt(rawDecrypted.value), 18);
    const formattedValue = parseFloat(decryptedEther).toFixed(0);

    return formattedValue;
  } catch (error) {
    throw new Error(`Failed to create reencryptor: ${error.message}`);
  }
};
