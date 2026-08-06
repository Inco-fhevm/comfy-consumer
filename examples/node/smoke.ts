// Live smoke test for the ERC-7984 wrapper flow.
//   PRIVATE_KEY=0x… pnpm --filter @comfy/node-example smoke
// createWrapper (if needed) → approve cToken → wrap → decrypt → send → unwrap.
import { ComfyClient } from "../../packages/sdk/src/index.ts";
import type { Address } from "../../packages/sdk/src/index.ts";

const RPC = process.env.RPC_URL ?? "https://sepolia.base.org";
const TOKEN = (process.env.TOKEN ?? "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as Address;
const WRAP = process.env.AMOUNT ?? "0.05";
const SEND = process.env.SEND_AMOUNT ?? "0.02";
const pk = process.env.PRIVATE_KEY as `0x${string}` | undefined;
const confirmations = Number(process.env.CONFIRMATIONS ?? 2);

let failures = 0;

function near(actual: number, expected: number, label: string, tol = 1e-9) {
  const ok = Math.abs(actual - expected) <= tol;
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}: got ${actual}, want ${expected}`);
}

function check(ok: boolean, label: string) {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
}

async function main() {
  if (!pk) throw new Error("Set PRIVATE_KEY (a funded Base Sepolia key).");

  const comfy = ComfyClient.node({
    network: "baseSepolia",
    privateKey: pk,
    rpcUrl: RPC,
    indexerUrl: process.env.INDEXER_URL,
    confirmations,
  });
  const me = comfy.context.account!.address as Address;
  const factory = comfy.context.addresses.wrapperFactory;
  console.log(`account  ${me}\nfactory  ${factory}\ntoken    ${TOKEN}\nrpc      ${RPC}\n`);

  // 1. Wrapper state before.
  console.log("[1] wrapper lookup");
  const existing = await comfy.wrapperOf({ token: TOKEN });
  const predicted = await comfy.confidentialOf({ token: TOKEN });
  console.log(`  getWrapper            ${existing ?? "0x0 (not deployed)"}`);
  console.log(`  computeWrapperAddress ${predicted}`);
  if (existing) check(existing === predicted, "deployed address == predicted address");

  // 2. Balances before.
  const pub0 = await comfy.publicBalanceOf({ token: TOKEN });
  const sh0 = await comfy.balanceOf({ token: TOKEN });
  console.log(`\n[2] before: public=${pub0} shielded=${sh0}`);
  check(pub0 >= Number(WRAP), `public balance covers wrap of ${WRAP}`);
  if (failures) return;

  // 3. Wrap (deploys the wrapper first if absent).
  console.log(`\n[3] wrap ${WRAP}`);
  const dep = await comfy.deposit({
    token: TOKEN,
    amount: WRAP,
    onStep: (s) => console.log(`  step: ${s}`),
  });
  console.log(`  tx ${dep.hash}`);
  const cToken = await comfy.wrapperOf({ token: TOKEN });
  check(!!cToken, "wrapper registered after deposit");
  check(cToken === predicted, "registered wrapper == predicted address");

  const pub1 = await comfy.publicBalanceOf({ token: TOKEN });
  const sh1 = await comfy.balanceOf({ token: TOKEN });
  console.log(`  after: public=${pub1} shielded=${sh1}`);
  near(pub1, pub0 - Number(WRAP), "public -= wrap");
  near(sh1, sh0 + Number(WRAP), "shielded += wrap");

  // 4. Confidential send (pays the Inco ciphertext fee).
  const to = (process.env.TO ?? me) as Address;
  const fee = await comfy.networkFee();
  console.log(`\n[4] confidentialSend ${SEND} → ${to}  (fee ${fee} wei)`);
  const sent = await comfy.confidentialSend({ token: TOKEN, to, amount: SEND });
  console.log(`  tx ${sent.hash}`);
  const sh2 = await comfy.balanceOf({ token: TOKEN });
  console.log(`  shielded=${sh2}`);
  // Self-send nets to zero; an external recipient debits the sender.
  near(sh2, to.toLowerCase() === me.toLowerCase() ? sh1 : sh1 - Number(SEND), "shielded after send");

  // 5. Unwrap what is left of this run.
  const back = sh2 - sh0;
  if (back <= 0) {
    console.log("\n[5] unwrap skipped (nothing left from this run)");
  } else {
    console.log(`\n[5] unwrap ${back}`);
    const out = await comfy.withdraw({ token: TOKEN, amount: String(back) });
    console.log(`  tx ${out.hash}`);
    const pub3 = await comfy.publicBalanceOf({ token: TOKEN });
    const sh3 = await comfy.balanceOf({ token: TOKEN });
    console.log(`  after: public=${pub3} shielded=${sh3}`);
    near(pub3, pub1 + back, "public += unwrap");
    near(sh3, sh0, "shielded back to start");
  }

  console.log(failures ? `\n❌ ${failures} assertion(s) failed` : "\n✅ all assertions passed");
  if (failures) process.exit(1);
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
