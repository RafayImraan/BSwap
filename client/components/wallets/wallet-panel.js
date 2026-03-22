"use client";

import { useState } from "react";
import { connectHashPack } from "@/lib/hashpack";

const truncate = (value) =>
  value ? `${value.slice(0, 10)}...${value.slice(-6)}` : "Awaiting connection";

export function WalletPanel({ walletState, onUseConnectedValues }) {
  const [loading, setLoading] = useState({ btc: false, hedera: false });

  const connectBitcoin = async () => {
    setLoading((current) => ({ ...current, btc: true }));
    try {
      if (typeof window === "undefined" || !window.unisat) {
        throw new Error("UniSat wallet not detected. Install UniSat for testnet BTC.");
      }

      await window.unisat.switchNetwork("testnet");
      const [address] = await window.unisat.requestAccounts();
      const publicKey = await window.unisat.getPublicKey();
      onUseConnectedValues({
        bitcoin: {
          address,
          publicKey
        }
      });
    } catch (error) {
      onUseConnectedValues({ error: error.message });
    } finally {
      setLoading((current) => ({ ...current, btc: false }));
    }
  };

  const connectHedera = async () => {
    setLoading((current) => ({ ...current, hedera: true }));
    try {
      const account = await connectHashPack();

      onUseConnectedValues({
        hedera: {
          hbarAccount: account.accountId,
          evmAddress: account.evmAddress
        }
      });
    } catch (error) {
      onUseConnectedValues({ error: error.message });
    } finally {
      setLoading((current) => ({ ...current, hedera: false }));
    }
  };

  return (
    <section className="lux-card p-6 md:p-7">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="lux-label">Wallet Access Layer</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Connect settlement identities</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--text-soft)]">
            Browser wallet connection is optional, but when available it preloads live participant identities and reduces manual settlement setup.
          </p>
        </div>
        <div className="lux-pill">Identity Routing</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <WalletCard
          chain="Bitcoin"
          detail="UniSat extension on Bitcoin Testnet"
          value={truncate(walletState.bitcoin?.address)}
          secondary={truncate(walletState.bitcoin?.publicKey)}
          actionLabel={loading.btc ? "Connecting..." : "Connect BTC Wallet"}
          accent="gold"
          onClick={connectBitcoin}
        />
        <WalletCard
          chain="Hedera"
          detail="HashPack pairing via WalletConnect"
          value={truncate(walletState.hedera?.hbarAccount || walletState.hedera?.evmAddress)}
          secondary={walletState.hedera?.evmAddress ? truncate(walletState.hedera?.evmAddress) : "EVM address is loaded from Hedera mirror data when available"}
          actionLabel={loading.hedera ? "Connecting..." : "Connect Hedera Wallet"}
          accent="teal"
          onClick={connectHedera}
        />
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4">
        <p className="text-sm text-[color:var(--text-soft)]">
          {walletState.error || "If a browser wallet is unavailable, the UI can still prepare settlement terms, but transaction authorization should remain in the participant wallet."}
        </p>
      </div>
    </section>
  );
}

function WalletCard({ chain, detail, value, secondary, actionLabel, onClick, accent }) {
  const accentClass =
    accent === "teal"
      ? "from-[#87d7c8]/30 to-transparent"
      : "from-[#d7ba72]/30 to-transparent";

  return (
    <div className="lux-subcard relative overflow-hidden rounded-[1.75rem] p-5">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accentClass}`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="lux-kicker">{chain}</p>
            <p className="mt-2 text-sm text-[color:var(--text-soft)]">{detail}</p>
          </div>
          <div className="lux-pill">Client-side</div>
        </div>
        <div className="mt-8 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Primary</p>
            <p className="mt-2 font-mono text-sm text-white">{value}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Details</p>
            <p className="mt-2 text-sm text-[color:var(--text-soft)]">{secondary}</p>
          </div>
        </div>
        <button onClick={onClick} className="lux-button-secondary mt-8">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
