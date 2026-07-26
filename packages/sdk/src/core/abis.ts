import type { Abi } from "viem";
import ctoken from "@comfy/config/abis/CToken.json";
import factory from "@comfy/config/abis/WrapperFactory.json";
import erc20 from "@comfy/config/abis/ERC20.json";

// Inlined from @comfy/config.
export const CTOKEN_ABI = ctoken as Abi;
export const WRAPPER_FACTORY_ABI = factory as Abi;
export const ERC20_ABI = erc20 as Abi;
