const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = {
  async listSwaps() {
    const response = await fetch(`${API_URL}/api/swaps`, { cache: "no-store" });
    return response.json();
  },
  async createSwap(payload) {
    const response = await fetch(`${API_URL}/api/swaps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return response.json();
  },
  async getWalletMeta() {
    const response = await fetch(`${API_URL}/api/swaps/meta/wallets`, { cache: "no-store" });
    return response.json();
  },
  async demoSuccess(id) {
    const response = await fetch(`${API_URL}/api/swaps/${id}/demo-success`, {
      method: "POST"
    });
    return response.json();
  },
  async demoRefund(id) {
    const response = await fetch(`${API_URL}/api/swaps/${id}/demo-refund`, {
      method: "POST"
    });
    return response.json();
  },
  async bitcoinLockLive(id, payload = {}) {
    const response = await fetch(`${API_URL}/api/swaps/${id}/bitcoin-lock-live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return response.json();
  },
  async bitcoinClaimLive(id, payload = {}) {
    const response = await fetch(`${API_URL}/api/swaps/${id}/bitcoin-claim-live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return response.json();
  },
  async bitcoinRefundLive(id, payload = {}) {
    const response = await fetch(`${API_URL}/api/swaps/${id}/bitcoin-refund-live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return response.json();
  },
  async hederaLockLive(id, payload = {}) {
    const response = await fetch(`${API_URL}/api/swaps/${id}/hedera-lock-live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return response.json();
  },
  async hederaClaimLive(id, payload = {}) {
    const response = await fetch(`${API_URL}/api/swaps/${id}/hedera-claim-live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return response.json();
  },
  async hederaRefundLive(id, payload = {}) {
    const response = await fetch(`${API_URL}/api/swaps/${id}/hedera-refund-live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return response.json();
  },
  socketUrl: API_URL
};
