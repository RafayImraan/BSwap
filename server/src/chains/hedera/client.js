import {
  AccountId,
  Client,
  ContractCreateFlow,
  ContractExecuteTransaction,
  Hbar,
  PrivateKey
} from "@hashgraph/sdk";
import { ethers } from "ethers";
import { HEDERA_SWAP_ABI } from "./abi.js";

export class HederaClient {
  constructor(config) {
    this.config = config;
    this.iface = new ethers.Interface(HEDERA_SWAP_ABI);
    this.client = null;
  }

  getClient() {
    if (this.client) {
      return this.client;
    }

    if (!this.config.operatorAccountId || !this.config.operatorPrivateKey) {
      return null;
    }

    const client = Client.forTestnet();
    const privateKey = this.parsePrivateKey(this.config.operatorPrivateKey);
    client.setOperator(
      AccountId.fromString(this.config.operatorAccountId),
      privateKey
    );
    this.client = client;
    return this.client;
  }

  parsePrivateKey(value) {
    const normalized = (value || "").trim();

    if (/^[0-9a-fA-F]{64}$/.test(normalized)) {
      return PrivateKey.fromString(normalized);
    }

    try {
      return PrivateKey.fromStringED25519(normalized);
    } catch {
      return PrivateKey.fromString(normalized);
    }
  }

  async lock({ contractId, secretHashHex, recipientEvmAddress, timelock, amountHbar }) {
    const client = this.getClient();
    if (!client) {
      throw new Error("Missing Hedera operator configuration");
    }

    const params = this.iface.encodeFunctionData("lock", [
      `0x${secretHashHex}`,
      recipientEvmAddress,
      BigInt(timelock)
    ]);

    const tx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(300000)
      .setPayableAmount(new Hbar(amountHbar))
      .setFunctionParameters(Buffer.from(params.slice(2), "hex"))
      .execute(client);

    return tx.getTransactionId().toString();
  }

  async claim({ contractId, swapIdHex, secretHex }) {
    const client = this.getClient();
    if (!client) {
      throw new Error("Missing Hedera operator configuration");
    }

    const params = this.iface.encodeFunctionData("claim", [
      `0x${swapIdHex}`,
      `0x${secretHex}`
    ]);

    const tx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(250000)
      .setFunctionParameters(Buffer.from(params.slice(2), "hex"))
      .execute(client);

    return tx.getTransactionId().toString();
  }

  async refund({ contractId, swapIdHex }) {
    const client = this.getClient();
    if (!client) {
      throw new Error("Missing Hedera operator configuration");
    }

    const params = this.iface.encodeFunctionData("refund", [`0x${swapIdHex}`]);

    const tx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(200000)
      .setFunctionParameters(Buffer.from(params.slice(2), "hex"))
      .execute(client);

    return tx.getTransactionId().toString();
  }

  async deploy(bytecodeHex) {
    const client = this.getClient();
    if (!client) {
      throw new Error("Missing Hedera operator configuration");
    }

    const tx = await new ContractCreateFlow()
      .setGas(3000000)
      .setBytecode(bytecodeHex.startsWith("0x") ? bytecodeHex : `0x${bytecodeHex}`)
      .execute(client);

    const receipt = await tx.getReceipt(client);
    return receipt.contractId?.toString() || null;
  }
}
