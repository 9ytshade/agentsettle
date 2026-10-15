import { createRequire } from "module";
const require = createRequire(import.meta.url);
const keytar = require("C:/Users/9ytshade/Desktop/Genlayer Intelligent Contracts/proofpay/node_modules/keytar");
import { createClient, createAccount } from "../web/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../web/node_modules/genlayer-js/dist/chains/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RPC_ENDPOINT = "https://studio.genlayer.com/api";

async function main() {
  console.log("===============================================================");
  console.log("  AgentSettle v1.2.0: Studionet Deployment");
  console.log("===============================================================");

  // 1. Setup Deployer Account (9ytshade_Deployer)
  const deployerPk = await keytar.getPassword("genlayer-cli", "account:9ytshade_Deployer");
  if (!deployerPk) throw new Error("Deployer (9ytshade_Deployer) private key not found in keytar");
  const deployer = createAccount(deployerPk);
  console.log(`[ACCOUNT] Deployer (9ytshade_Deployer): ${deployer.address}`);

  const client = createClient({
    chain: studionet,
    endpoint: RPC_ENDPOINT,
    account: deployer,
  });

  const balance = await client.getBalance({ address: deployer.address });
  console.log(`[BALANCE] Deployer Balance: ${balance.toString()} wei (${Number(balance) / 1e18} GEN)\n`);

  const contractPath = path.resolve(__dirname, "../contracts/agentsettle.py");
  const contractCode = fs.readFileSync(contractPath, "utf-8");
  console.log(`[CONTRACT] Read contract code (${contractCode.length} bytes) from ${contractPath}`);

  console.log("--> [TX START] Broadcasting deployContract to GenLayer Studionet (Chain 61999)...");
  const txHash = await client.deployContract({
    code: contractCode,
    args: [],
  });

  console.log(`    Deployment Tx Hash: ${txHash}`);
  console.log("    Waiting for Studionet validator consensus finalization (retries: 150, interval: 5000ms)...");

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: "FINALIZED",
    retries: 150,
    interval: 5000,
  });

  console.log(`    Receipt Status: ${receipt.status}`);
  console.log("    Full Receipt:", JSON.stringify(receipt, null, 2));

  const contractAddress =
    receipt.contractAddress ||
    receipt.data?.contract_address ||
    receipt.data?.address ||
    (typeof receipt.data === "string" ? receipt.data : null);

  console.log("\n===============================================================");
  console.log(`  DEPLOYED CONTRACT ADDRESS: ${contractAddress}`);
  console.log(`  DEPLOYMENT TX HASH:        ${txHash}`);
  console.log(`  DEPLOYER ACCOUNT:          ${deployer.address}`);
  console.log("===============================================================\n");

  // Verify version immediately
  if (contractAddress) {
    const version = await client.readContract({
      address: contractAddress,
      functionName: "get_contract_version",
      args: [],
    });
    console.log(`[VERIFICATION] Contract version readback: ${version}`);
  }
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
