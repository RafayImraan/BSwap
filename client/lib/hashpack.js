let cachedConnector = null;

const MIRROR_NODE_BASE = "https://testnet.mirrornode.hedera.com/api/v1";

async function getConnector() {
  if (cachedConnector) {
    return cachedConnector;
  }

  const [{ HashConnect }, { LedgerId }] = await Promise.all([
    import("hashconnect"),
    import("@hashgraph/sdk")
  ]);

  const connector = new HashConnect(
    LedgerId.TESTNET,
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    "BSwap",
    "BSwap atomic settlement console"
  );

  cachedConnector = connector;
  return connector;
}

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

export async function connectHashPack() {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
  if (!projectId) {
    throw new Error("Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID for HashPack pairing.");
  }

  if (typeof window === "undefined") {
    throw new Error("HashPack connection is only available in the browser.");
  }

  const connector = await getConnector();

  const existing = connector.getConnections?.();
  if (existing && existing.length > 0) {
    const first = existing[0];
    const accountId = first.accountIds?.[0] || "";
    return {
      accountId,
      evmAddress: (await lookupEvmAddress(accountId)) || ""
    };
  }

  return new Promise(async (resolve, reject) => {
    let settled = false;

    const finish = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };

    const fail = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(error);
    };

    const pairingHandler = async (data) => {
      const accountId = data.accountIds?.[0] || "";
      finish({
        accountId,
        evmAddress: (await lookupEvmAddress(accountId)) || ""
      });
    };

    try {
      connector.pairingEvent.once(pairingHandler);
      await connector.init();
      await connector.openPairingModal();
      setTimeout(() => {
        fail(new Error("HashPack pairing timed out. Approve the connection request in HashPack."));
      }, 90000);
    } catch (error) {
      fail(error);
    }
  });
}
