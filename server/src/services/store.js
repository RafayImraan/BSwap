import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const dataDir = path.resolve("server", "data");
const dataFile = path.join(dataDir, "swaps.json");

const ensureStore = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({ swaps: [] }, null, 2));
  }
};

const readDb = () => {
  ensureStore();
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
};

const writeDb = (data) => {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

export class SwapStore {
  list() {
    return readDb().swaps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  get(id) {
    return this.list().find((swap) => swap.id === id) || null;
  }

  create(payload) {
    const data = readDb();
    const swap = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [],
      ...payload
    };

    data.swaps.push(swap);
    writeDb(data);
    return swap;
  }

  update(id, updater) {
    const data = readDb();
    const index = data.swaps.findIndex((swap) => swap.id === id);
    if (index === -1) {
      return null;
    }

    const current = data.swaps[index];
    const next =
      typeof updater === "function" ? updater(current) : { ...current, ...updater };

    next.updatedAt = new Date().toISOString();
    data.swaps[index] = next;
    writeDb(data);
    return next;
  }
}

export const swapStore = new SwapStore();
