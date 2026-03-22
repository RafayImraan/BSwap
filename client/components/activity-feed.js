"use client";

export function ActivityFeed({ swap }) {
  return (
    <section className="lux-card p-6 md:p-7">
      <div className="mb-6">
        <p className="lux-label">Observability</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Chain activity journal</h2>
        <p className="mt-2 text-sm leading-7 text-[color:var(--text-soft)]">
          A precise record of contract creation, secret revelation, relay activity, state transitions, and recovery events as the swap progresses.
        </p>
      </div>

      <div className="space-y-4">
        {(swap?.history || []).slice().reverse().map((entry) => (
          <div key={`${entry.type}-${entry.at}`} className="lux-subcard rounded-[1.6rem] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-white">{entry.message}</p>
                <p className="mt-3 font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
                  {entry.type}
                </p>
              </div>
              <span className="font-mono text-xs text-[color:var(--text-soft)]">
                {new Date(entry.at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {!swap ? (
          <div className="lux-subcard rounded-[1.6rem] p-5 text-sm text-[color:var(--text-soft)]">
            Realtime chain events will appear here after a swap is selected.
          </div>
        ) : null}
      </div>
    </section>
  );
}
