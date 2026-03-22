const MIRROR_NODE_BASE = "https://testnet.mirrornode.hedera.com/api/v1";

let cachedConnector = null;

async function lookupEvmAddress(accountId) {
  try {
    const response = await fetch(`${MIRROR_NODE_BASE}/accounts/${accountId}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return "";
    }

    const data = await response.json();
    return data.evm_address || "";
  } catch {
    return "";
  }
}

async function getConnector() {
  if (cachedConnector) {
    return cachedConnector;
  }

  const [{ HashConnect }, { LedgerId }] = await Promise.all([
    import("hashconnect"),
    import("@hashgraph/sdk")
  ]);

  const metadata = {
    name: "BSwap",
    description: "BSwap atomic settlement console",
    icons: ["https://www.google.com/s2/favicons?domain=localhost&sz=128"],
    url:
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost:3000"
  };

  const connector = new HashConnect(
    LedgerId.TESTNET,
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    metadata,
    false
  );

  cachedConnector = connector;
  return connector;
}

export async function connectHashPack() {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
  if (!projectId) {
    throw new Error("Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID for HashPack pairing.");
  }

  if (typeof window === "undefined") {
    throw new Error("HashPack connection is only available in the browser.");
  }

  const connector = await getConnector();
  await connector.init();

  const existingAccounts = connector.connectedAccountIds || [];
  if (existingAccounts.length > 0) {
    const accountId = existingAccounts[0].toString();
    return {
      accountId,
      evmAddress: (await lookupEvmAddress(accountId)) || ""
    };
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    const finish = async (data) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      const accountId = data.accountIds?.[0] || "";
      resolve({
        accountId,
        evmAddress: (await lookupEvmAddress(accountId)) || ""
      });
    };

    const fail = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(error);
    };

    connector.pairingEvent.once(finish);
    connector.openPairingModal("dark", "#090b10", "#d7ba72", "#d7ba72", "24px").catch(fail);

    timeoutId = setTimeout(() => {
      fail(new Error("HashPack pairing timed out. Approve the connection request in HashPack."));
    }, 90000);
  });
}
