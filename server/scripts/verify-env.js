import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const envPath = path.join(rootDir, ".env");
dotenv.config({ path: envPath });

if (!fs.existsSync(envPath)) {
  console.error(`.env file is missing at project root: ${envPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(envPath, "utf8");
const has = (key) => new RegExp(`^${key}=.+$`, "m").test(raw);

const required = [
  "BITCOIN_API_BASE",
  "HEDERA_CONTRACT_ID"
];

if ((process.env.PUBLIC_SIGNING_ENABLED || "").toLowerCase() === "true") {
  required.push(
    "BITCOIN_WIF",
    "HEDERA_OPERATOR_ACCOUNT_ID",
    "HEDERA_OPERATOR_PRIVATE_KEY"
  );
}

const missing = required.filter((key) => !has(key));

if (missing.length > 0) {
  console.error("Missing required env vars:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log("Environment looks ready for live BSwap testnet actions.");
