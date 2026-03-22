import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });
dotenv.config();

const number = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const boolean = (value, fallback = false) => {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.toLowerCase() === "true";
};

export const config = {
  port: number(process.env.SERVER_PORT, 4000),
  bitcoin: {
    network: process.env.BITCOIN_NETWORK || "testnet",
    rpcUrl: process.env.BITCOIN_RPC_URL || "",
    apiBase: process.env.BITCOIN_API_BASE || "https://mempool.space/testnet/api",
    wif: process.env.BITCOIN_WIF || "",
    refundWif: process.env.BITCOIN_REFUND_WIF || "",
    lockAmountSats: number(process.env.BITCOIN_LOCK_AMOUNT_SATS, 100000),
    defaultFeeRate: number(process.env.BITCOIN_DEFAULT_FEE_RATE, 5)
  },
  hedera: {
    accountId: process.env.HEDERA_ACCOUNT_ID || "",
    privateKey: process.env.HEDERA_PRIVATE_KEY || "",
    operatorAccountId: process.env.HEDERA_OPERATOR_ACCOUNT_ID || "",
    operatorPrivateKey: process.env.HEDERA_OPERATOR_PRIVATE_KEY || "",
    contractId: process.env.HEDERA_CONTRACT_ID || ""
  },
  swapSecretBytes: number(process.env.SWAP_SECRET_BYTES, 32),
  publicSigningEnabled: boolean(process.env.PUBLIC_SIGNING_ENABLED, false)
};
