import encyptedERC20ABI from "@/abi/encryptedERC20.json";
export const ENCRYPTEDERC20ABI = encyptedERC20ABI;
export const ENCRYPTED_ERC20_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_ENCRYPTED_ERC20_CONTRACT_ADDRESS as `0x${string}`;

import ercABI from "@/abi/ERC20.json";
export const ERC20ABI = ercABI;
export const ERC20_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ERC20_CONTRACT_ADDRESS as `0x${string}`;
