import { ComfyClient } from "../../packages/sdk/src/index.ts";

const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`;
const pk = process.env.PRIVATE_KEY as `0x${string}` | undefined;
const indexerUrl = process.env.INDEXER_URL;

async function main() {
  const comfy = ComfyClient.node({ network: "baseSepolia", privateKey: pk, indexerUrl });

  // Reads that need no wallet.
  const cToken = await comfy.confidentialOf({ token: USDC });
  console.log("confidentialOf(USDC):", cToken);
  console.log("underlyingOf(cUSDC):", await comfy.underlyingOf({ cToken }));

  if (indexerUrl) {
    const page = await comfy.history({ address: pk ? undefined : USDC, limit: 3 });
    console.log(`history: ${page.total} txs`);
  }

  if (!pk) {
    console.log("\nSet PRIVATE_KEY to exercise balanceOf / deposit / send / withdraw.");
    return;
  }

  console.log("\nbalanceOf(USDC):", await comfy.balanceOf({ token: USDC }));

  console.log("depositing 1 USDC…");
  const dep = await comfy.deposit({ token: USDC, amount: "1", onStep: (s) => console.log(" ", s) });
  console.log("  tx:", dep.hash);
  console.log("balanceOf(USDC):", await comfy.balanceOf({ token: USDC }));

  console.log("\n✅ done");
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
