"use client";

import { useEffect, useState } from "react";

const initialForm = {
  alice: {
    btcAddress: "tb1qaliceexample...",
    btcPubKey: "02a1633caf7bf6b6e3d8f6a1dbd3f3147f8ce1b5d7f4cabb7a6d2014cb6db4f430",
    hbarAccount: "0.0.5001",
    evmAddress: "0x1111111111111111111111111111111111111111"
  },
  bob: {
    btcAddress: "tb1qbobexample...",
    btcPubKey: "03b0bd634234abbb1ba1e986e884185c9b4ac5c2b2bd4498d7ccf54f9f7f0f8bb9",
    hbarAccount: "0.0.5002",
    evmAddress: "0x2222222222222222222222222222222222222222"
  },
  amounts: {
    btc: 0.01,
    hbar: 120
  },
  expiries: {
    bitcoinSeconds: 86400,
    hederaSeconds: 43200
  }
};

export function SwapForm({ onCreate, connectedWallets }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connectedWallets) {
      return;
    }

    setForm((current) => ({
      ...current,
      alice: {
        ...current.alice,
        btcAddress: connectedWallets.bitcoin?.address || current.alice.btcAddress,
        btcPubKey: connectedWallets.bitcoin?.publicKey || current.alice.btcPubKey,
        hbarAccount: connectedWallets.hedera?.hbarAccount || current.alice.hbarAccount,
        evmAddress: connectedWallets.hedera?.evmAddress || current.alice.evmAddress
      }
    }));
  }, [connectedWallets]);

  const update = (group, key, value) => {
    setForm((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [key]: value
      }
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await onCreate({
        ...form,
        amounts: {
          btc: Number(form.amounts.btc),
          hbar: Number(form.amounts.hbar)
        },
        expiries: {
          bitcoinSeconds: Number(form.expiries.bitcoinSeconds),
          hederaSeconds: Number(form.expiries.hederaSeconds)
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="lux-card p-6 md:p-7">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="lux-label">Intent Builder</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Compose a premium swap mandate</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--text-soft)]">
            Configure counterparties, asset amounts, and timeout ordering in one structured settlement workspace.
          </p>
        </div>
        <button type="submit" form="swap-form" disabled={loading} className="lux-button">
          {loading ? "Creating..." : "Create Swap"}
        </button>
      </div>

      <form id="swap-form" onSubmit={submit}>
        <div className="grid gap-6 xl:grid-cols-2">
          <ParticipantCard
            title="Alice"
            subtitle="Initiator settlement profile"
            fields={[
              { label: "BTC address", value: form.alice.btcAddress, onChange: (value) => update("alice", "btcAddress", value) },
              { label: "BTC pubkey", value: form.alice.btcPubKey, onChange: (value) => update("alice", "btcPubKey", value) },
              { label: "Hedera account", value: form.alice.hbarAccount, onChange: (value) => update("alice", "hbarAccount", value) },
              { label: "EVM address", value: form.alice.evmAddress, onChange: (value) => update("alice", "evmAddress", value) }
            ]}
          />
          <ParticipantCard
            title="Bob"
            subtitle="Responder settlement profile"
            fields={[
              { label: "BTC address", value: form.bob.btcAddress, onChange: (value) => update("bob", "btcAddress", value) },
              { label: "BTC pubkey", value: form.bob.btcPubKey, onChange: (value) => update("bob", "btcPubKey", value) },
              { label: "Hedera account", value: form.bob.hbarAccount, onChange: (value) => update("bob", "hbarAccount", value) },
              { label: "EVM address", value: form.bob.evmAddress, onChange: (value) => update("bob", "evmAddress", value) }
            ]}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="lux-subcard rounded-[1.75rem] p-5">
            <p className="lux-kicker">Settlement Terms</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="BTC amount">
                <input type="number" step="0.0001" className="lux-input" value={form.amounts.btc} onChange={(e) => update("amounts", "btc", e.target.value)} />
              </Field>
              <Field label="HBAR amount">
                <input type="number" step="1" className="lux-input" value={form.amounts.hbar} onChange={(e) => update("amounts", "hbar", e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="lux-subcard rounded-[1.75rem] p-5">
            <p className="lux-kicker">Recovery Windows</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Bitcoin timeout">
                <input type="number" className="lux-input" value={form.expiries.bitcoinSeconds} onChange={(e) => update("expiries", "bitcoinSeconds", e.target.value)} />
              </Field>
              <Field label="Hedera timeout">
                <input type="number" className="lux-input" value={form.expiries.hederaSeconds} onChange={(e) => update("expiries", "hederaSeconds", e.target.value)} />
              </Field>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}

function ParticipantCard({ title, subtitle, fields }) {
  return (
    <div className="lux-subcard rounded-[1.75rem] p-5">
      <p className="lux-kicker">{subtitle}</p>
      <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
      <div className="mt-5 grid gap-4">
        {fields.map((field) => (
          <Field key={field.label} label={field.label}>
            <input className="lux-input" value={field.value} onChange={(e) => field.onChange(e.target.value)} />
          </Field>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-[color:var(--text-soft)]">{label}</span>
      {children}
    </label>
  );
}
