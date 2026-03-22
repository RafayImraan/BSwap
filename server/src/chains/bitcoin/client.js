import * as bitcoin from "bitcoinjs-lib";
import * as ecpair from "ecpair";
import * as ecc from "tiny-secp256k1";
import {
  buildBitcoinHtlc,
  buildP2wshPayment,
  networkFor,
  scriptWitnessStack
} from "./htlc.js";

const ECPair = ecpair.ECPairFactory(ecc);

const DUST_LIMIT = 546;

const sum = (values) => values.reduce((acc, value) => acc + value, 0);

export class BitcoinClient {
  constructor(config) {
    this.config = config;
    this.network = networkFor(config.network);
  }

  createLockPlan({
    secretHashHex,
    recipientPubKeyHex,
    refundPubKeyHex,
    locktime
  }) {
    return buildBitcoinHtlc({
      network: this.config.network,
      secretHashHex,
      recipientPubKeyHex,
      refundPubKeyHex,
      locktime
    });
  }

  getKeyPair(wif = this.config.wif) {
    if (!wif) {
      throw new Error("Missing Bitcoin WIF in environment");
    }

    return ECPair.fromWIF(wif, this.network);
  }

  getWalletDetails(wif = this.config.wif) {
    const keyPair = this.getKeyPair(wif);
    const payment = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network: this.network
    });

    return {
      address: payment.address,
      publicKeyHex: Buffer.from(keyPair.publicKey).toString("hex"),
      outputScript: payment.output,
      keyPair
    };
  }

  async getRecommendedFeeRate() {
    if (!this.config.apiBase) {
      return this.config.defaultFeeRate;
    }

    try {
      const response = await fetch(`${this.config.apiBase}/v1/fees/recommended`);
      if (!response.ok) {
        return this.config.defaultFeeRate;
      }
      const data = await response.json();
      return Number(data.fastestFee || data.halfHourFee || data.hourFee || this.config.defaultFeeRate);
    } catch {
      return this.config.defaultFeeRate;
    }
  }

  async getAddressUtxos(address) {
    const response = await fetch(`${this.config.apiBase}/address/${address}/utxo`);
    if (!response.ok) {
      throw new Error(`Failed to fetch UTXOs for ${address}`);
    }

    return response.json();
  }

  async broadcastTransaction(hex) {
    const response = await fetch(`${this.config.apiBase}/tx`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: hex
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Bitcoin broadcast failed: ${error}`);
    }

    return response.text();
  }

  estimateFundingFee(inputCount, outputCount, feeRate) {
    return Math.ceil((10 + inputCount * 68 + outputCount * 31) * feeRate);
  }

  estimateHtlcSpendFee(feeRate) {
    return Math.ceil(180 * feeRate);
  }

  selectUtxos(utxos, target) {
    const selected = [];
    let total = 0;

    for (const utxo of utxos) {
      selected.push(utxo);
      total += utxo.value;
      if (total >= target) {
        return { selected, total };
      }
    }

    throw new Error("Insufficient BTC balance for requested lock");
  }

  async buildAndBroadcastLock({
    secretHashHex,
    recipientPubKeyHex,
    refundPubKeyHex,
    locktime,
    amountSats = this.config.lockAmountSats,
    feeRate
  }) {
    const wallet = this.getWalletDetails();
    const htlc = this.createLockPlan({
      secretHashHex,
      recipientPubKeyHex,
      refundPubKeyHex,
      locktime
    });

    const utxos = await this.getAddressUtxos(wallet.address);
    const resolvedFeeRate = feeRate || (await this.getRecommendedFeeRate());
    const roughFee = this.estimateFundingFee(2, 2, resolvedFeeRate);
    const { selected, total } = this.selectUtxos(utxos, amountSats + roughFee);
    const change = total - amountSats - this.estimateFundingFee(selected.length, 2, resolvedFeeRate);

    const psbt = new bitcoin.Psbt({ network: this.network });

    for (const utxo of selected) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: wallet.outputScript,
          value: utxo.value
        }
      });
    }

    psbt.addOutput({
      address: htlc.address,
      value: amountSats
    });

    if (change > DUST_LIMIT) {
      psbt.addOutput({
        address: wallet.address,
        value: change
      });
    }

    selected.forEach((_, index) => psbt.signInput(index, wallet.keyPair));
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();
    const txid = await this.broadcastTransaction(txHex);

    return {
      txid,
      txHex,
      feeRate: resolvedFeeRate,
      amountSats,
      htlc
    };
  }

  async buildAndBroadcastClaim({
    witnessScriptHex,
    lockTxId,
    lockVout = 0,
    amountSats,
    destinationAddress,
    secretHex,
    claimerWif = this.config.wif,
    feeRate
  }) {
    return this.buildAndBroadcastSpend({
      mode: "claim",
      witnessScriptHex,
      lockTxId,
      lockVout,
      amountSats,
      destinationAddress,
      secretHex,
      signerWif: claimerWif,
      feeRate
    });
  }

  async buildAndBroadcastRefund({
    witnessScriptHex,
    lockTxId,
    lockVout = 0,
    amountSats,
    destinationAddress,
    refundWif = this.config.refundWif || this.config.wif,
    locktime,
    feeRate
  }) {
    return this.buildAndBroadcastSpend({
      mode: "refund",
      witnessScriptHex,
      lockTxId,
      lockVout,
      amountSats,
      destinationAddress,
      signerWif: refundWif,
      locktime,
      feeRate
    });
  }

  async buildAndBroadcastSpend({
    mode,
    witnessScriptHex,
    lockTxId,
    lockVout,
    amountSats,
    destinationAddress,
    signerWif,
    secretHex,
    locktime,
    feeRate
  }) {
    const payment = buildP2wshPayment({
      network: this.config.network,
      witnessScriptHex
    });
    const signer = this.getWalletDetails(signerWif);
    const resolvedFeeRate = feeRate || (await this.getRecommendedFeeRate());
    const fee = this.estimateHtlcSpendFee(resolvedFeeRate);
    const outputValue = amountSats - fee;

    if (outputValue <= DUST_LIMIT) {
      throw new Error("Locked BTC amount is too small to cover claim/refund fee");
    }

    const psbt = new bitcoin.Psbt({ network: this.network });
    psbt.setVersion(2);

    if (mode === "refund") {
      psbt.setLocktime(locktime);
    }

    psbt.addInput({
      hash: lockTxId,
      index: lockVout,
      sequence: mode === "refund" ? 0xfffffffe : 0xfffffffd,
      witnessUtxo: {
        script: payment.output,
        value: amountSats
      },
      witnessScript: Buffer.from(witnessScriptHex, "hex")
    });

    psbt.addOutput({
      address: destinationAddress,
      value: outputValue
    });

    psbt.signInput(0, signer.keyPair);

    psbt.finalizeInput(0, (_inputIndex, input) => {
      const signature = input.partialSig?.[0]?.signature;
      if (!signature) {
        throw new Error("Missing HTLC spend signature");
      }

      const witnessStack =
        mode === "claim"
          ? [
              signature,
              Buffer.from(signer.keyPair.publicKey),
              Buffer.from(secretHex, "hex"),
              bitcoin.script.number.encode(1),
              Buffer.from(witnessScriptHex, "hex")
            ]
          : [
              signature,
              Buffer.from(signer.keyPair.publicKey),
              Buffer.alloc(0),
              Buffer.from(witnessScriptHex, "hex")
            ];

      return {
        finalScriptWitness: scriptWitnessStack(witnessStack)
      };
    });

    const txHex = psbt.extractTransaction().toHex();
    const txid = await this.broadcastTransaction(txHex);

    return {
      txid,
      txHex,
      feeRate: resolvedFeeRate,
      fee,
      outputValue
    };
  }
}
