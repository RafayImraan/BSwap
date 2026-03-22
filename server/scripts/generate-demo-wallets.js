import crypto from "node:crypto";
import * as bitcoin from "bitcoinjs-lib";
import * as ecpair from "ecpair";
import * as ecc from "tiny-secp256k1";
import { PrivateKey } from "@hashgraph/sdk";

bitcoin.initEccLib(ecc);
const ECPair = ecpair.ECPairFactory(ecc);

const network = bitcoin.networks.testnet;

const createBtcWallet = (label) => {
  const pair = ECPair.makeRandom({ network });
  const payment = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(pair.publicKey),
    network
  });

  return {
    label,
    address: payment.address,
    pubkey: Buffer.from(pair.publicKey).toString("hex"),
    wif: pair.toWIF()
  };
};

const createHederaWallet = (label) => {
  const key = PrivateKey.generateED25519();
  return {
    label,
    publicKey: key.publicKey.toString(),
    privateKey: key.toStringRaw()
  };
};

const aliceBtc = createBtcWallet("alice");
const bobBtc = createBtcWallet("bob");
const aliceHedera = createHederaWallet("alice");
const bobHedera = createHederaWallet("bob");

const secret = crypto.randomBytes(32).toString("hex");

console.log(JSON.stringify({
  bitcoin: {
    alice: aliceBtc,
    bob: bobBtc,
    faucet: "https://coinfaucet.eu/en/btc-testnet/"
  },
  hedera: {
    alice: aliceHedera,
    bob: bobHedera,
    faucet: "https://portal.hedera.com/faucet"
  },
  sampleSecretHex: secret
}, null, 2));
