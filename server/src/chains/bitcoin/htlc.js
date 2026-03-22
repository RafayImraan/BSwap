import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";

bitcoin.initEccLib(ecc);

const OPS = bitcoin.script.OPS;

export const networkFor = (networkName) =>
  networkName === "mainnet" ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;

export const buildBitcoinHtlc = ({
  network = "testnet",
  secretHashHex,
  recipientPubKeyHex,
  refundPubKeyHex,
  locktime
}) => {
  const script = bitcoin.script.compile([
    OPS.OP_IF,
    OPS.OP_SHA256,
    Buffer.from(secretHashHex, "hex"),
    OPS.OP_EQUALVERIFY,
    Buffer.from(recipientPubKeyHex, "hex"),
    OPS.OP_CHECKSIG,
    OPS.OP_ELSE,
    bitcoin.script.number.encode(locktime),
    OPS.OP_CHECKLOCKTIMEVERIFY,
    OPS.OP_DROP,
    Buffer.from(refundPubKeyHex, "hex"),
    OPS.OP_CHECKSIG,
    OPS.OP_ENDIF
  ]);

  const p2wsh = bitcoin.payments.p2wsh({
    redeem: { output: script, network: networkFor(network) },
    network: networkFor(network)
  });

  return {
    scriptHex: script.toString("hex"),
    witnessScriptHex: p2wsh.redeem.output.toString("hex"),
    outputScriptHex: p2wsh.output.toString("hex"),
    address: p2wsh.address,
    network
  };
};

export const buildP2wshPayment = ({ network = "testnet", witnessScriptHex }) =>
  bitcoin.payments.p2wsh({
    redeem: {
      output: Buffer.from(witnessScriptHex, "hex"),
      network: networkFor(network)
    },
    network: networkFor(network)
  });

export const scriptWitnessStack = (items) => {
  const buffers = [];
  const writeVarInt = (value) => {
    if (value < 0xfd) {
      buffers.push(Buffer.from([value]));
      return;
    }

    if (value <= 0xffff) {
      const buffer = Buffer.allocUnsafe(3);
      buffer.writeUInt8(0xfd, 0);
      buffer.writeUInt16LE(value, 1);
      buffers.push(buffer);
      return;
    }

    const buffer = Buffer.allocUnsafe(5);
    buffer.writeUInt8(0xfe, 0);
    buffer.writeUInt32LE(value, 1);
    buffers.push(buffer);
  };

  writeVarInt(items.length);
  for (const item of items) {
    writeVarInt(item.length);
    buffers.push(item);
  }

  return Buffer.concat(buffers);
};
