"use client";

export function ExecutionPanel({
  swap,
  walletMeta,
  signingMode,
  onBitcoinLockLive,
  onHederaLockLive,
  onHederaClaimLive,
  onBitcoinClaimLive,
  onBitcoinRefundLive,
  onHederaRefundLive
}) {
  const walletRequired = signingMode !== "server";

  const actions = [
    { label: "Broadcast BTC Lock", note: "Stage 01", onClick: () => onBitcoinLockLive(swap?.id) },
    { label: "Lock HBAR", note: "Stage 02", onClick: () => onHederaLockLive(swap?.id) },
    { label: "Claim HBAR", note: "Stage 03", onClick: () => onHederaClaimLive(swap?.id) },
    { label: "Claim BTC", note: "Stage 04", onClick: () => onBitcoinClaimLive(swap?.id) },
    { label: "Refund BTC", note: "Recovery", onClick: () => onBitcoinRefundLive(swap?.id) },
    { label: "Refund HBAR", note: "Recovery", onClick: () => onHederaRefundLive(swap?.id) }
  ];

  return (
    <section className="lux-card p-6 md:p-7">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="lux-label">Execution Console</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Wallet-controlled settlement</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--text-soft)]">
            Public deployment mode keeps signing outside the server boundary. Users connect their own wallets and authorize settlement transactions directly from the client side.
          </p>
        </div>
        <div className="lux-pill">{walletRequired ? "Wallet signing required" : "Server signing enabled"}</div>
      </div>

      <div className="rounded-[1.6rem] border border-[#d7ba72]/20 bg-[#d7ba72]/[0.06] p-5">
        <p className="lux-kicker">Security Posture</p>
        <p className="mt-3 text-sm leading-7 text-[color:var(--text-soft)]">
          {walletRequired
            ? "Server-held signing is disabled. The backend may coordinate state, but transaction authorization must come from the participant wallet."
            : "Server signing is enabled. Only use this mode in a private operator environment."}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <button
            key={action.label}
            disabled={!swap || walletRequired}
            onClick={action.onClick}
            className="lux-subcard rounded-[1.6rem] p-5 text-left transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <p className="lux-kicker">{action.note}</p>
            <p className="mt-3 text-lg font-semibold text-white">{action.label}</p>
            <p className="mt-2 text-sm text-[color:var(--text-soft)]">
              {walletRequired
                ? "Client-side wallet signing integration should authorize this step."
                : swap
                  ? "Execute against the selected route."
                  : "Create a settlement route to enable execution."}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <MetaCard
          label="Signing Mode"
          value={walletRequired ? "wallet-required" : "server"}
        />
        <MetaCard
          label="Hedera Contract"
          value={walletMeta?.hedera?.contractId || "Configure HEDERA_CONTRACT_ID in .env"}
        />
      </div>
    </section>
  );
}

function MetaCard({ label, value }) {
  return (
    <div className="lux-subcard rounded-[1.6rem] p-5">
      <p className="lux-kicker">{label}</p>
      <p className="mt-3 break-all font-mono text-sm text-white">{value}</p>
    </div>
  );
}
