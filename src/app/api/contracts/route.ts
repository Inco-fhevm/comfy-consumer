import { NextResponse } from "next/server";

export async function GET() {
  const ENCRYPTED_ERC20_CONTRACT_ADDRESS =
    process.env.ENCRYPTED_ERC20_CONTRACT_ADDRESS;
  const ERC20_CONTRACT_ADDRESS = process.env.ERC20_CONTRACT_ADDRESS;

  const INCO_ENV = process.env.INCO_ENV

  const REOWN_APP_ID = process.env.REOWN_APP_ID;

  return NextResponse.json({
    encryptedERC20: {
      address: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
    },
    erc20: {
      address: ERC20_CONTRACT_ADDRESS,
    },
    incoEnv: INCO_ENV,
    REOWN_APP_ID: REOWN_APP_ID,
  });
}
