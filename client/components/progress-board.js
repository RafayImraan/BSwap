"use client";

const steps = [
  { key: "awaiting-btc-lock", label: "Bitcoin escrow", note: "Lock BTC into the HTLC." },
  { key: "awaiting-hbar-lock", label: "Hedera escrow", note: "Counterparty locks HBAR with same hash." },
  { key: "ready-for-hbar-claim", label: "HBAR claim", note: "Initiator claims HBAR and reveals the secret." },
  { key: "btc-claim-ready", label: "Secret relay", note: "Relayer detects reveal and prepares BTC settlement." },
  { key: "completed", label: "BTC claim", note: "Responder finalizes the Bitcoin leg." }
];

export function ProgressBoard({ swap, onDemoSuccess, onDemoRefund }) {
  if (!swap) {
    return (
      <section className="lux-card p-6 md:p-7">
        <p className="lux-label">Settlement Timeline</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Atomic route standing by</h2>
        <p className="mt-3 text-sm leading-7 text-[color:var(--text-soft)]">
          Create a settlement route to activate cross-chain execution visibility across Bitcoin and Hedera.
        </p>
      </section>
    );
  }

  const activeIndex = Math.max(0, steps.findIndex((step) => step.key === swap.status));

  return (
    <section className="lux-card p-6 md:p-7">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="lux-label">Settlement Timeline</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Trustless route orchestration</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => onDemoSuccess(swap.id)} className="lux-button-secondary">
            Simulate success
          </button>
          <button onClick={() => onDemoRefund(swap.id)} className="lux-button-secondary">
            Simulate refund
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {steps.map((step, index) => {
          const complete = index < activeIndex || swap.status === "completed";
          const active = index === activeIndex && swap.status !== "completed";
          return (
            <div
              key={step.key}
              className={`rounded-[1.6rem] p-5 transition ${
                complete
                  ? "border border-[#d7ba72]/30 bg-[#d7ba72]/10"
                  : active
                    ? "border border-[#87d7c8]/30 bg-[#87d7c8]/10"
                    : "lux-subcard"
              }`}
            >
              <p className="lux-kicker">Stage {index + 1}</p>
              <p className="mt-3 text-lg font-semibold text-white">{step.label}</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-soft)]">{step.note}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label="Hashlock" value={swap.secretHash} mono />
        <Stat label="BTC timeout" value={new Date(swap.expiries.bitcoinLocktime * 1000).toLocaleString()} />
        <Stat label="HBAR timeout" value={new Date(swap.expiries.hederaTimelock * 1000).toLocaleString()} />
        <Stat label="BTC confirmations" value={String(swap.bitcoin.confirmations)} />
        <Stat label="HBAR confirmations" value={String(swap.hedera.confirmations)} />
        <Stat label="Current status" value={swap.status} />
      </div>
    </section>
  );
}

function Stat({ label, value, mono = false }) {
  return (
    <div className="lux-subcard rounded-[1.45rem] p-4">
      <p className="lux-kicker">{label}</p>
      <p className={`mt-3 break-all text-sm text-white ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
