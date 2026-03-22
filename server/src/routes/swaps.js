import { Router } from "express";
import { swapCoordinator } from "../services/swapCoordinator.js";
import { config } from "../config.js";

export const swapsRouter = Router();

const ensureServerSigningEnabled = (_req, res, next) => {
  if (!config.publicSigningEnabled) {
    return res.status(403).json({
      error: "Server signing is disabled for public deployment. Users must execute settlement with their own wallets."
    });
  }

  next();
};

swapsRouter.get("/", (_req, res) => {
  res.json({ swaps: swapCoordinator.listSwaps() });
});

swapsRouter.get("/meta/wallets", (_req, res) => {
  try {
    res.json({ wallets: swapCoordinator.getOperationalWallets() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

swapsRouter.get("/:id", (req, res) => {
  const swap = swapCoordinator.getSwap(req.params.id);
  if (!swap) {
    return res.status(404).json({ error: "Swap not found" });
  }

  res.json({ swap });
});

swapsRouter.post("/", (req, res) => {
  try {
    const swap = swapCoordinator.createSwap(req.body);
    res.status(201).json({ swap });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

swapsRouter.post("/:id/bitcoin-lock", (req, res) => {
  const swap = swapCoordinator.recordBitcoinLock(req.params.id, req.body);
  if (!swap) {
    return res.status(404).json({ error: "Swap not found" });
  }
  res.json({ swap });
});

swapsRouter.post("/:id/hedera-lock", (req, res) => {
  const swap = swapCoordinator.recordHederaLock(req.params.id, req.body);
  if (!swap) {
    return res.status(404).json({ error: "Swap not found" });
  }
  res.json({ swap });
});

swapsRouter.post("/:id/reveal", (req, res) => {
  try {
    const swap = swapCoordinator.revealSecret(req.params.id, req.body);
    if (!swap) {
      return res.status(404).json({ error: "Swap not found" });
    }
    res.json({ swap });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

swapsRouter.post("/:id/refund", (req, res) => {
  const swap = swapCoordinator.recordRefund(req.params.id, req.body.chain, req.body.txId);
  if (!swap) {
    return res.status(404).json({ error: "Swap not found" });
  }
  res.json({ swap });
});

swapsRouter.post("/:id/demo-success", (req, res) => {
  const swap = swapCoordinator.simulateSuccess(req.params.id);
  if (!swap) {
    return res.status(404).json({ error: "Swap not found" });
  }
  res.json({ swap });
});

swapsRouter.post("/:id/demo-refund", (req, res) => {
  const swap = swapCoordinator.simulateRefund(req.params.id);
  if (!swap) {
    return res.status(404).json({ error: "Swap not found" });
  }
  res.json({ swap });
});

swapsRouter.post("/:id/bitcoin-lock-live", ensureServerSigningEnabled, async (req, res) => {
  try {
    const swap = await swapCoordinator.executeBitcoinLock(req.params.id, req.body || {});
    if (!swap) {
      return res.status(404).json({ error: "Swap not found" });
    }
    res.json({ swap });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

swapsRouter.post("/:id/bitcoin-claim-live", ensureServerSigningEnabled, async (req, res) => {
  try {
    const swap = await swapCoordinator.executeBitcoinClaim(req.params.id, req.body || {});
    if (!swap) {
      return res.status(404).json({ error: "Swap not found" });
    }
    res.json({ swap });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

swapsRouter.post("/:id/bitcoin-refund-live", ensureServerSigningEnabled, async (req, res) => {
  try {
    const swap = await swapCoordinator.executeBitcoinRefund(req.params.id, req.body || {});
    if (!swap) {
      return res.status(404).json({ error: "Swap not found" });
    }
    res.json({ swap });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

swapsRouter.post("/:id/hedera-lock-live", ensureServerSigningEnabled, async (req, res) => {
  try {
    const swap = await swapCoordinator.executeHederaLock(req.params.id, req.body || {});
    if (!swap) {
      return res.status(404).json({ error: "Swap not found" });
    }
    res.json({ swap });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

swapsRouter.post("/:id/hedera-claim-live", ensureServerSigningEnabled, async (req, res) => {
  try {
    const swap = await swapCoordinator.executeHederaClaim(req.params.id, req.body || {});
    if (!swap) {
      return res.status(404).json({ error: "Swap not found" });
    }
    res.json({ swap });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

swapsRouter.post("/:id/hedera-refund-live", ensureServerSigningEnabled, async (req, res) => {
  try {
    const swap = await swapCoordinator.executeHederaRefund(req.params.id, req.body || {});
    if (!swap) {
      return res.status(404).json({ error: "Swap not found" });
    }
    res.json({ swap });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
