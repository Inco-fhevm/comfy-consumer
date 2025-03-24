import {
  generateSecp256k1Keypair,
  decodeSecp256k1PublicKey,
  getEciesEncryptor,
} from "@inco-fhevm/js/lite";
import { hexToBytes } from "viem";
import { getReencryptor } from "@inco-fhevm/js/reencryption";
import { incoLiteEnvQuerier, incoLiteReencrypt } from "@inco-fhevm/js/lite";
import { Schema, Binary } from "@inco-fhevm/js";
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
      contractAddress: contractAddress,
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

export const reEncryptValue = async ({
  chainId,
  contractAddress,
  walletClient,
  handle,
  publicClient,
  incoLiteAddress,
  cfg,
  kmsConnectEndpoint,
}) => {
  if (
    !chainId ||
    !contractAddress ||
    !walletClient ||
    !publicClient ||
    !incoLiteAddress
  ) {
    throw new Error("Missing required parameters for creating reencryptor");
  }

  try {
    const checksummedAddress = getAddress(contractAddress);

    const reencryptor = await getReencryptor({
      chainId: chainId,
      contractAddress: checksummedAddress,
      walletClient: walletClient.data,
      reencryptEndpoint: incoLiteReencrypt({
        kmsConnectRpcEndpointOrClient: KMS_CONNECT_ENDPOINT,
      }),
      fheEnvQuerier: incoLiteEnvQuerier({
        incoLiteAddress,
        publicClient,
      }),
    });

    const rawDecrypted = await reencryptor({
      handle: {
        value: Schema.parse(Binary.Bytes32, handle),
        type: 8, // Default to uint256 type
      },
    });

    console.log("rawDecrypted", rawDecrypted);

    const decryptedEther = formatUnits(BigInt(rawDecrypted.value), 18);
    const formattedValue = parseFloat(decryptedEther).toFixed(0);

    return formattedValue;
  } catch (error) {
    throw new Error(`Failed to create reencryptor: ${error.message}`);
  }
};
