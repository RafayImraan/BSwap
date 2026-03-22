import crypto from "node:crypto";
import { z } from "zod";
import { config } from "../config.js";
import { swapStore } from "./store.js";
import { eventBus } from "./eventBus.js";
import { BitcoinClient } from "../chains/bitcoin/client.js";
import { HederaClient } from "../chains/hedera/client.js";

const createSwapSchema = z.object({
  alice: z.object({
    btcAddress: z.string().min(10),
    btcPubKey: z.string().min(32),
    hbarAccount: z.string().min(3),
    evmAddress: z.string().min(10)
  }),
  bob: z.object({
    btcAddress: z.string().min(10),
    btcPubKey: z.string().min(32),
    hbarAccount: z.string().min(3),
    evmAddress: z.string().min(10)
  }),
  amounts: z.object({
    btc: z.number().positive(),
    hbar: z.number().positive()
  }),
  expiries: z.object({
    bitcoinSeconds: z.number().int().positive().default(24 * 60 * 60),
    hederaSeconds: z.number().int().positive().default(12 * 60 * 60)
  })
});

export class SwapCoordinator {
  constructor() {
    this.bitcoin = new BitcoinClient(config.bitcoin);
    this.hedera = new HederaClient(config.hedera);
  }

  listSwaps() {
    return swapStore.list();
  }

  getSwap(id) {
    return swapStore.get(id);
  }

  createSwap(payload) {
    const parsed = createSwapSchema.parse(payload);
    if (parsed.expiries.bitcoinSeconds <= parsed.expiries.hederaSeconds) {
      throw new Error("Bitcoin timeout must be greater than Hedera timeout");
    }

    const secret = crypto.randomBytes(config.swapSecretBytes).toString("hex");
    const secretHash = crypto.createHash("sha256").update(Buffer.from(secret, "hex")).digest("hex");
    const now = Math.floor(Date.now() / 1000);
    const bitcoinLocktime = now + parsed.expiries.bitcoinSeconds;
    const hederaTimelock = now + parsed.expiries.hederaSeconds;

    const btcPlan = this.bitcoin.createLockPlan({
      secretHashHex: secretHash,
      recipientPubKeyHex: parsed.bob.btcPubKey,
      refundPubKeyHex: parsed.alice.btcPubKey,
      locktime: bitcoinLocktime
    });

    const swap = swapStore.create({
      status: "awaiting-btc-lock",
      mode: "testnet",
      secret,
      secretHash,
      amounts: parsed.amounts,
      amountSats: Math.round(parsed.amounts.btc * 100_000_000),
      expiries: {
        bitcoinLocktime,
        hederaTimelock
      },
      participants: parsed,
      bitcoin: {
        ...btcPlan,
        lockTxId: null,
        claimTxId: null,
        refundTxId: null,
        confirmations: 0
      },
      hedera: {
        contractId: config.hedera.contractId || null,
        swapId: null,
        lockTxId: null,
        claimTxId: null,
        refundTxId: null,
        confirmations: 0
      }
    });

    return this.pushHistory(swap.id, {
      type: "swap-created",
      message: "Swap created and secret hash generated."
    });
  }

  getOperationalWallets() {
    return {
      signingMode: config.publicSigningEnabled ? "server" : "wallet-required",
      bitcoin: null,
      hedera: {
        contractId: config.hedera.contractId || null
      }
    };
  }

  pushHistory(id, entry) {
    const swap = swapStore.update(id, (current) => ({
      ...current,
      history: [
        ...current.history,
        {
          at: new Date().toISOString(),
          ...entry
        }
      ]
    }));

    if (swap) {
      eventBus.emit("swap:update", swap);
    }

    return swap;
  }

  recordBitcoinLock(id, { txId, confirmations = 0 }) {
    const swap = swapStore.update(id, (current) => ({
      ...current,
      status: "awaiting-hbar-lock",
      bitcoin: {
        ...current.bitcoin,
        lockTxId: txId,
        confirmations
      }
    }));

    if (!swap) {
      return null;
    }

    return this.pushHistory(id, {
      type: "btc-locked",
      message: `BTC locked in HTLC via ${txId}.`
    });
  }

  recordHederaLock(id, { txId, swapId, confirmations = 0 }) {
    const swap = swapStore.update(id, (current) => ({
      ...current,
      status: "ready-for-hbar-claim",
      hedera: {
        ...current.hedera,
        lockTxId: txId,
        swapId,
        confirmations
      }
    }));

    if (!swap) {
      return null;
    }

    return this.pushHistory(id, {
      type: "hbar-locked",
      message: `HBAR locked on Hedera via ${txId}.`
    });
  }

  revealSecret(id, { secret, sourceChain, txId }) {
    const swap = swapStore.get(id);
    if (!swap) {
      return null;
    }

    const derivedHash = crypto.createHash("sha256").update(Buffer.from(secret, "hex")).digest("hex");
    if (derivedHash !== swap.secretHash) {
      throw new Error("Secret does not match swap hash");
    }

    swapStore.update(id, (current) => ({
      ...current,
      secret,
      status: sourceChain === "hedera" ? "btc-claim-ready" : current.status,
      hedera:
        sourceChain === "hedera"
          ? { ...current.hedera, claimTxId: txId }
          : current.hedera
    }));

    return this.pushHistory(id, {
      type: "secret-revealed",
      message: `Secret revealed on ${sourceChain}.`
    });
  }

  recordBitcoinClaim(id, txId) {
    const swap = swapStore.update(id, (current) => ({
      ...current,
      status: "completed",
      bitcoin: { ...current.bitcoin, claimTxId: txId }
    }));

    if (!swap) {
      return null;
    }

    return this.pushHistory(id, {
      type: "btc-claimed",
      message: `BTC claimed with secret via ${txId}.`
    });
  }

  recordRefund(id, chain, txId) {
    const swap = swapStore.update(id, (current) => ({
      ...current,
      status: "refunded",
      [chain]: {
        ...current[chain],
        refundTxId: txId
      }
    }));

    if (!swap) {
      return null;
    }

    return this.pushHistory(id, {
      type: `${chain}-refunded`,
      message: `${chain.toUpperCase()} refunded via ${txId}.`
    });
  }

  simulateSuccess(id) {
    const swap = this.getSwap(id);
    if (!swap) {
      return null;
    }

    this.recordBitcoinLock(id, { txId: `btc-lock-${id.slice(0, 8)}`, confirmations: 1 });
    this.recordHederaLock(id, {
      txId: `hedera-lock-${id.slice(0, 8)}`,
      swapId: crypto.createHash("sha256").update(id).digest("hex"),
      confirmations: 1
    });
    this.revealSecret(id, {
      secret: swap.secret,
      sourceChain: "hedera",
      txId: `hedera-claim-${id.slice(0, 8)}`
    });
    return this.recordBitcoinClaim(id, `btc-claim-${id.slice(0, 8)}`);
  }

  simulateRefund(id) {
    const swap = this.getSwap(id);
    if (!swap) {
      return null;
    }

    this.recordBitcoinLock(id, { txId: `btc-lock-${id.slice(0, 8)}`, confirmations: 1 });
    return this.recordRefund(id, "bitcoin", `btc-refund-${id.slice(0, 8)}`);
  }

  async executeBitcoinLock(id, options = {}) {
    const swap = this.getSwap(id);
    if (!swap) {
      return null;
    }

    const result = await this.bitcoin.buildAndBroadcastLock({
      secretHashHex: swap.secretHash,
      recipientPubKeyHex: swap.participants.bob.btcPubKey,
      refundPubKeyHex: swap.participants.alice.btcPubKey,
      locktime: swap.expiries.bitcoinLocktime,
      amountSats: options.amountSats || swap.amountSats,
      feeRate: options.feeRate
    });

    const updated = swapStore.update(id, (current) => ({
      ...current,
      amountSats: result.amountSats,
      bitcoin: {
        ...current.bitcoin,
        ...result.htlc,
        lockTxId: result.txid,
        lockTxHex: result.txHex,
        lockVout: 0,
        feeRate: result.feeRate,
        confirmations: 0
      },
      status: "awaiting-hbar-lock"
    }));

    if (!updated) {
      return null;
    }

    return this.pushHistory(id, {
      type: "btc-locked-live",
      message: `Live BTC lock broadcast: ${result.txid}.`
    });
  }

  async executeBitcoinClaim(id, options = {}) {
    const swap = this.getSwap(id);
    if (!swap || !swap.bitcoin.lockTxId) {
      return null;
    }

    const result = await this.bitcoin.buildAndBroadcastClaim({
      witnessScriptHex: swap.bitcoin.witnessScriptHex,
      lockTxId: swap.bitcoin.lockTxId,
      lockVout: swap.bitcoin.lockVout || 0,
      amountSats: swap.amountSats,
      destinationAddress:
        options.destinationAddress || this.bitcoin.getWalletDetails().address,
      secretHex: options.secretHex || swap.secret,
      feeRate: options.feeRate
    });

    const updated = swapStore.update(id, (current) => ({
      ...current,
      status: "completed",
      bitcoin: {
        ...current.bitcoin,
        claimTxId: result.txid,
        claimTxHex: result.txHex
      }
    }));

    if (!updated) {
      return null;
    }

    return this.pushHistory(id, {
      type: "btc-claimed-live",
      message: `Live BTC claim broadcast: ${result.txid}.`
    });
  }

  async executeBitcoinRefund(id, options = {}) {
    const swap = this.getSwap(id);
    if (!swap || !swap.bitcoin.lockTxId) {
      return null;
    }

    const refundWallet = this.bitcoin.getWalletDetails(config.bitcoin.refundWif || config.bitcoin.wif);
    const result = await this.bitcoin.buildAndBroadcastRefund({
      witnessScriptHex: swap.bitcoin.witnessScriptHex,
      lockTxId: swap.bitcoin.lockTxId,
      lockVout: swap.bitcoin.lockVout || 0,
      amountSats: swap.amountSats,
      destinationAddress: options.destinationAddress || refundWallet.address,
      refundWif: config.bitcoin.refundWif || config.bitcoin.wif,
      locktime: swap.expiries.bitcoinLocktime,
      feeRate: options.feeRate
    });

    const updated = swapStore.update(id, (current) => ({
      ...current,
      status: "refunded",
      bitcoin: {
        ...current.bitcoin,
        refundTxId: result.txid,
        refundTxHex: result.txHex
      }
    }));

    if (!updated) {
      return null;
    }

    return this.pushHistory(id, {
      type: "btc-refunded-live",
      message: `Live BTC refund broadcast: ${result.txid}.`
    });
  }

  async executeHederaLock(id, options = {}) {
    const swap = this.getSwap(id);
    if (!swap) {
      return null;
    }

    const txId = await this.hedera.lock({
      contractId: options.contractId || swap.hedera.contractId,
      secretHashHex: swap.secretHash,
      recipientEvmAddress: swap.participants.alice.evmAddress,
      timelock: swap.expiries.hederaTimelock,
      amountHbar: options.amountHbar || swap.amounts.hbar
    });

    return this.recordHederaLock(id, {
      txId,
      swapId: options.swapId || `pending-${id.slice(0, 8)}`,
      confirmations: 0
    });
  }

  async executeHederaClaim(id, options = {}) {
    const swap = this.getSwap(id);
    if (!swap || !swap.hedera.contractId || !swap.hedera.swapId) {
      return null;
    }

    const txId = await this.hedera.claim({
      contractId: options.contractId || swap.hedera.contractId,
      swapIdHex: swap.hedera.swapId,
      secretHex: options.secretHex || swap.secret
    });

    return this.revealSecret(id, {
      secret: options.secretHex || swap.secret,
      sourceChain: "hedera",
      txId
    });
  }

  async executeHederaRefund(id, options = {}) {
    const swap = this.getSwap(id);
    if (!swap || !swap.hedera.contractId || !swap.hedera.swapId) {
      return null;
    }

    const txId = await this.hedera.refund({
      contractId: options.contractId || swap.hedera.contractId,
      swapIdHex: swap.hedera.swapId
    });

    return this.recordRefund(id, "hedera", txId);
  }
}

export const swapCoordinator = new SwapCoordinator();
