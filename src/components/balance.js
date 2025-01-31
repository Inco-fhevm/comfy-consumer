import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useContractWrite,
  useWriteContract,
  useReadContract,
  useWalletClient,
} from "wagmi";
import { toHexString } from "@/utils/fhevm";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseEther, parseUnits } from "viem";
import { getFhevmInstance } from "@/utils/fhevm";

const CONTRACT_ADDRESS = "0xb1942c1b5511bF8466628Eb1A795EAe953b39376";
const mintABI = [
  {
    inputs: [
      {
        internalType: "einput",
        name: "encryptedAmount",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes",
      },
    ],
    name: "_mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "wallet",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "euint64",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const ConfidentialERC20 = () => {
  const [instance, setInstance] = useState(null);
  const [userBalance, setUserBalance] = useState("Hidden");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [lastDecryptedBalance, setLastDecryptedBalance] = useState(null);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { writeContract } = useWriteContract();

  const {
    data: balanceOf,
    isSuccess,
    isLoading,
    isError,
    error,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: mintABI,
    functionName: "balanceOf",
    args: [address],
    enabled: Boolean(address),
  });

  console.log(error);

  useEffect(() => {
    const initializeFhevm = async () => {
      try {
        const fhevmInstance = await getFhevmInstance();
        setInstance(fhevmInstance);
      } catch (error) {
        console.error("Failed to initialize FHEVM:", error);
      }
    };

    if (isConnected) {
      initializeFhevm();
    }
  }, [isConnected]);

  const handleMint = async () => {
    if (!instance || !address) return;
    setIsMinting(true);

    try {
      const input = await instance.createEncryptedInput(
        CONTRACT_ADDRESS,
        address
      );
      input.add64(parseUnits("100", 6));
      const encryptedInput = input.encrypt();

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: mintABI,
        functionName: "_mint",
        args: [
          "0x" + toHexString(encryptedInput.handles[0]),
          "0x" + toHexString(encryptedInput.inputProof),
        ],
      });
    } catch (error) {
      console.error("Minting failed:", error);
    } finally {
      setIsMinting(false);
    }
  };

  useEffect(() => {
    if (
      isSuccess &&
      balanceOf &&
      !isDecrypting &&
      balanceOf !== lastDecryptedBalance
    ) {
      setLastDecryptedBalance(balanceOf);
      handleDecrypt();
    }
  }, [isSuccess, balanceOf]);

  const handleDecrypt = async () => {
    if (!instance || !address || !walletClient) return;
    setIsDecrypting(true);

    try {
      const contractKey = `reencrypt_${CONTRACT_ADDRESS}`;
      const storedData = JSON.parse(localStorage.getItem(contractKey));

      let publicKey, privateKey, signature;

      if (false) {
        ({ publicKey, privateKey, signature } = storedData);
      } else {
        // Generate new keypair logic remains the same...
        const { publicKey: genPublicKey, privateKey: genPrivateKey } =
          await instance.generateKeypair();

        const eip712 = await instance.createEIP712(
          genPublicKey,
          CONTRACT_ADDRESS
        );

        signature = await walletClient.signTypedData({
          domain: eip712.domain,
          types: eip712.types,
          primaryType: "Reencrypt",
          message: eip712.message,
        });

        publicKey = genPublicKey;
        privateKey = genPrivateKey;

        localStorage.setItem(
          contractKey,
          JSON.stringify({ publicKey, privateKey, signature })
        );
      }

      // Wait for balance data to be available
      if (!isSuccess || !balanceOf) {
        console.log("Waiting for balance data...");
        setUserBalance("Loading...");
        return;
      }

      console.log("Balance Of:", balanceOf.toString());

      // Handle zero balance case
      if (balanceOf.toString() === "0") {
        setUserBalance("0");
        return;
      }

      // Proceed with reencryption
      const balanceResult = await instance.reencrypt(
        balanceOf,
        privateKey,
        publicKey,
        signature.replace("0x", ""),
        CONTRACT_ADDRESS,
        address
      );

      console.log("Balance Result:", balanceResult.toString());

      const decryptedBalance = await balanceResult;
      setUserBalance(decryptedBalance.toString());
    } catch (error) {
      console.error("Decryption failed:", error.message);
      setUserBalance("Error");
    } finally {
      setIsDecrypting(false);
    }
  };

  const formatBalance = (balance) => {
    if (balance === "Hidden") return balance;
    const amount = balance?.slice(0, -6) || "0";
    return `${Number(amount).toLocaleString()}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-900">
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="flex justify-end">
          <ConnectButton />
        </div>

        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-center mb-4">
            <div className="text-sm text-slate-400">Balance</div>
            <div className="text-xl font-bold text-slate-100">
              {formatBalance(userBalance)}
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleMint}
              disabled={isMinting}
            >
              {isMinting ? "Minting..." : "Mint 100 Tokens"}
            </Button>

            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleDecrypt}
              disabled={isDecrypting}
            >
              {isDecrypting ? "Decrypting..." : "Decrypt Balance"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfidentialERC20;
