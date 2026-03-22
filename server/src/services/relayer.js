import { eventBus } from "./eventBus.js";
import { swapCoordinator } from "./swapCoordinator.js";

export class RelayerService {
  start() {
    eventBus.on("swap:update", (swap) => {
      if (swap.status === "btc-claim-ready" && swap.secret && !swap.bitcoin.claimTxId) {
        setTimeout(() => {
          swapCoordinator.recordBitcoinClaim(
            swap.id,
            `relayed-btc-claim-${swap.id.slice(0, 8)}`
          );
        }, 1500);
      }
    });
  }
}

export const relayerService = new RelayerService();
