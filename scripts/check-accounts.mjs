import { createRequire } from "module";
const require = createRequire(import.meta.url);
const keytar = require("C:/Users/9ytshade/Desktop/Genlayer Intelligent Contracts/proofpay/node_modules/keytar");
import { createClient, createAccount } from "../web/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../web/node_modules/genlayer-js/dist/chains/index.js";

const RPC_ENDPOINT = "https://studio.genlayer.com/api";

async function main() {
  const pk1 = await keytar.getPassword("genlayer-cli", "account:9ytshade_Deployer");
  const pk2 = await keytar.getPassword("genlayer-cli", "account:proofpay-deployer");
  
  const alice = createAccount(pk1);
  const bob = createAccount(pk2);

  const client = createClient({
    chain: studionet,
    endpoint: RPC_ENDPOINT,
  });

  const bAlice = await client.getBalance({ address: alice.address });
  const bBob = await client.getBalance({ address: bob.address });

  console.log("Hiring Agent (Alice):", alice.address, "Balance:", bAlice.toString(), "wei");
  console.log("Worker Agent (Bob):  ", bob.address, "Balance:", bBob.toString(), "wei");
}

main().catch(console.error);
