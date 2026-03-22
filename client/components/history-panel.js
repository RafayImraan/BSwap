"use client";

export function HistoryPanel({ swaps, activeSwap, onSelect }) {
  return (
    <section className="lux-card p-6 md:p-7">
      <div className="mb-6">
        <p className="lux-label">Portfolio View</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Settlement ledger</h2>
        <p className="mt-2 text-sm leading-7 text-[color:var(--text-soft)]">
          Review created intents, inspect current state, and pivot the console to any active settlement route.
        </p>
      </div>

      <div className="space-y-3">
        {swaps.map((swap) => (
          <button
            key={swap.id}
            onClick={() => onSelect(swap)}
            className={`w-full rounded-[1.6rem] border p-5 text-left transition ${
              activeSwap?.id === swap.id
                ? "border-[#d7ba72]/40 bg-[#d7ba72]/10"
                : "border-white/10 bg-white/[0.03] hover:border-white/20"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">
                  {swap.amounts.btc} BTC to {swap.amounts.hbar} HBAR
                </p>
                <p className="mt-2 font-mono text-xs text-[color:var(--text-soft)]">{swap.id}</p>
              </div>
              <span className="lux-pill">{swap.status}</span>
            </div>
          </button>
        ))}
        {swaps.length === 0 ? (
          <div className="lux-subcard rounded-[1.6rem] p-5 text-sm text-[color:var(--text-soft)]">
            No swaps have been created yet. The first intent you submit will appear here.
          </div>
        ) : null}
      </div>
    </section>
  );
}
