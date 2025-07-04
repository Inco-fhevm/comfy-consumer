import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { parseAbiItem } from "viem";

export const dynamic = "force-dynamic";

export async function POST() {
  const privateRPC = process.env.BASE_SEPOLIA_RPC;
  const ENCRYPTED_ERC20_CONTRACT_ADDRESS = process.env
    .ENCRYPTED_ERC20_CONTRACT_ADDRESS as `0x${string}`;

  const pubClient = createPublicClient({
    transport: http(privateRPC),
    chain: baseSepolia,
  });

  const eventPromise: Promise<unknown[] | null> = new Promise((resolve) => {
    const unwatch = pubClient.watchEvent({
      address: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
      event: parseAbiItem(
        "event Unwrap(address indexed account, uint256 amount)"
      ),
      onLogs: (logs: unknown[]) => {
        unwatch();
        resolve(logs);
      },
    });

    setTimeout(() => {
      unwatch();
      resolve(null);
    }, 20000);
  });

  const logs = await eventPromise;

  function replacer(_key: string, value: unknown) {
    return typeof value === "bigint" ? value.toString() : value;
  }

  return new NextResponse(JSON.stringify({ logs }, replacer), {
    headers: { "Content-Type": "application/json" },
  });
}
