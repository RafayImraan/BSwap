import { buildApp } from "./app.js";
import { config } from "./config.js";
import { relayerService } from "./services/relayer.js";

const { server } = buildApp();
relayerService.start();

server.listen(config.port, () => {
  console.log(`BSwap coordinator listening on http://localhost:${config.port}`);
});
