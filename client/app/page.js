"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SwapForm } from "@/components/swap-form";
import { HistoryPanel } from "@/components/history-panel";
import { ProgressBoard } from "@/components/progress-board";
import { ActivityFeed } from "@/components/activity-feed";
import { ExecutionPanel } from "@/components/execution-panel";
import { WalletPanel } from "@/components/wallets/wallet-panel";
import { api } from "@/lib/api";

export default function Home() {
  const [swaps, setSwaps] = useState([]);
  const [activeSwap, setActiveSwap] = useState(null);
  const [walletMeta, setWalletMeta] = useState(null);
  const [connectedWallets, setConnectedWallets] = useState({
    bitcoin: null,
    hedera: null,
    error: null
  });

  useEffect(() => {
    api.listSwaps().then((data) => {
      setSwaps(data.swaps || []);
      setActiveSwap((data.swaps || [])[0] || null);
    });

    api.getWalletMeta().then((data) => {
      setWalletMeta(data.wallets || null);
    });
  }, []);

  useEffect(() => {
    const socket = io(api.socketUrl, { transports: ["websocket"] });
    socket.on("swap:update", (swap) => {
      setSwaps((current) => {
        const existing = current.find((item) => item.id === swap.id);
        if (!existing) {
          return [swap, ...current];
        }
        return current.map((item) => (item.id === swap.id ? swap : item));
      });

      setActiveSwap((current) => (current?.id === swap.id || !current ? swap : current));
    });

    return () => socket.close();
  }, []);

  const onCreate = async (payload) => {
    const data = await api.createSwap(payload);
    if (data.swap) {
      setSwaps((current) => [data.swap, ...current]);
      setActiveSwap(data.swap);
    }
  };

  const refreshFromMutation = (data) => {
    if (data.swap) {
      setActiveSwap(data.swap);
      setSwaps((current) => {
        const existing = current.find((item) => item.id === data.swap.id);
        if (!existing) {
          return [data.swap, ...current];
        }
        return current.map((item) => (item.id === data.swap.id ? data.swap : item));
      });
    }
  };

  const onUseConnectedValues = (next) => {
    setConnectedWallets((current) => ({
      bitcoin: next.bitcoin || current.bitcoin,
      hedera: next.hedera || current.hedera,
      error: next.error || null
    }));
  };

  const metrics = [
    {
      label: "Trust Model",
      value: "Atomic",
      note: "Hashlock and timelock enforced"
    },
    {
      label: "Settlement Pair",
      value: "BTC / HBAR",
      note: "Native assets without wrapping"
    },
    {
      label: "Active Route",
      value: activeSwap ? activeSwap.status : "Standby",
      note: activeSwap ? activeSwap.id.slice(0, 12) : "No active settlement selected"
    },
    {
      label: "Open Intents",
      value: String(swaps.length),
      note: "Routes currently tracked by coordinator"
    }
  ];

  return (
    <main className="lux-shell min-h-screen px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-7xl">
        <header className="lux-card mb-6 px-5 py-4 md:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d7ba72]/30 bg-[#d7ba72]/10 text-lg font-semibold text-[#f1dfae]">
                B
              </div>
              <div>
                <p className="lux-label">BSwap</p>
                <p className="mt-1 text-sm text-[color:var(--text-soft)]">
                  Cross-chain atomic settlement protocol between Bitcoin and Hedera
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="lux-pill">Protocol Console</span>
              <span className="lux-pill">Testnet Environment</span>
              <span className="lux-pill flex items-center gap-2">
                <span className="status-dot" />
                Coordinator Online
              </span>
            </div>
          </div>
        </header>

        <section className="lux-card relative overflow-hidden px-6 py-8 md:px-10 md:py-10">
          <div className="hero-orb left-[-2rem] top-10 h-28 w-28 bg-[#d7ba72]/25" />
          <div className="hero-orb right-8 top-2 h-32 w-32 bg-[#284a74]/30" />

          <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
            <div>
              <p className="lux-label">Institutional Settlement Terminal</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-white md:text-6xl">
                Trustless cross-chain execution for native Bitcoin and native Hedera.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[color:var(--text-soft)] md:text-lg">
                BSwap coordinates deterministic settlement between BTC and HBAR with cryptographic guarantees, transparent execution state, and protocol-level recovery paths.
              </p>

              <div className="lux-divider mt-8" />

              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                  <div key={metric.label} className="lux-subcard rounded-[1.5rem] p-5">
                    <p className="lux-kicker">{metric.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{metric.value}</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-soft)]">{metric.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lux-subcard rounded-[2rem] p-6">
              <p className="lux-kicker">Operating Principles</p>
              <div className="mt-5 space-y-4">
                <SnapshotRow label="Custody" value="Non-custodial" />
                <SnapshotRow label="Bitcoin Escrow" value="P2WSH HTLC" />
                <SnapshotRow label="Hedera Escrow" value="HBAR contract lock" />
                <SnapshotRow label="Recovery Ordering" value="T1 greater than T2" />
              </div>
              <div className="lux-divider mt-6" />
              <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="lux-kicker">Settlement Guarantee</p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--text-soft)]">
                  Funds complete on both chains or revert to the originating parties after their respective timelocks. No partial settlement path is considered valid.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="space-y-6">
            <WalletPanel walletState={connectedWallets} onUseConnectedValues={onUseConnectedValues} />
            <SwapForm onCreate={onCreate} connectedWallets={connectedWallets} />
            <ExecutionPanel
              swap={activeSwap}
              walletMeta={walletMeta}
              signingMode={walletMeta?.signingMode || "wallet-required"}
              onBitcoinLockLive={async (id) => refreshFromMutation(await api.bitcoinLockLive(id))}
              onHederaLockLive={async (id) => refreshFromMutation(await api.hederaLockLive(id))}
              onHederaClaimLive={async (id) => refreshFromMutation(await api.hederaClaimLive(id))}
              onBitcoinClaimLive={async (id) => refreshFromMutation(await api.bitcoinClaimLive(id))}
              onBitcoinRefundLive={async (id) => refreshFromMutation(await api.bitcoinRefundLive(id))}
              onHederaRefundLive={async (id) => refreshFromMutation(await api.hederaRefundLive(id))}
            />
            <ProgressBoard
              swap={activeSwap}
              onDemoSuccess={async (id) => refreshFromMutation(await api.demoSuccess(id))}
              onDemoRefund={async (id) => refreshFromMutation(await api.demoRefund(id))}
            />
            <ActivityFeed swap={activeSwap} />
          </div>

          <div className="space-y-6">
            <HistoryPanel swaps={swaps} activeSwap={activeSwap} onSelect={setActiveSwap} />
          </div>
        </div>
      </div>
    </main>
  );
}

function SnapshotRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
      <span className="text-sm text-[color:var(--text-soft)]">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
