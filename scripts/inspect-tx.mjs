import { createClient } from "../web/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../web/node_modules/genlayer-js/dist/chains/index.js";

const client = createClient({ chain: studionet, endpoint: "https://studio.genlayer.com/api" });

async function main() {
  const hash = "0x98a2228770425f1f37eab99200bf2988472a5fdb1daf9a06d7486c5fcedd1867";
  const tx = await client.getTransaction({ hash });
  console.log("Transaction:", JSON.stringify(tx, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

main().catch(console.error);
