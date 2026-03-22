import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { HederaClient } from "../src/chains/hedera/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.join(rootDir, ".env") });

const artifactPath = path.join(
  rootDir,
  "contracts",
  "artifacts",
  "contracts",
  "HederaAtomicSwap.sol",
  "HederaAtomicSwap.json"
);

if (!fs.existsSync(artifactPath)) {
  console.error(`Missing compiled artifact at: ${artifactPath}`);
  console.error("Run `npm run compile -w contracts` first.");
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

const client = new HederaClient({
  operatorAccountId: process.env.HEDERA_OPERATOR_ACCOUNT_ID || "",
  operatorPrivateKey: process.env.HEDERA_OPERATOR_PRIVATE_KEY || ""
});

const contractId = await client.deploy(artifact.bytecode);
console.log(`Deployed HederaAtomicSwap contract: ${contractId}`);
