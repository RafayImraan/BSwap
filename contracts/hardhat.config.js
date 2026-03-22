require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env" });

const rawKey = process.env.HEDERA_PRIVATE_KEY || "";
const normalizedKey = rawKey.startsWith("0x") ? rawKey.slice(2) : rawKey;
const isEvmHexKey = /^[0-9a-fA-F]{64}$/.test(normalizedKey);

module.exports = {
  solidity: "0.8.24",
  networks: {
    hedera_testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: isEvmHexKey ? [`0x${normalizedKey}`] : []
    }
  }
};
