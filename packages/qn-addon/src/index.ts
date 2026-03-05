import app from "./app";
import { config } from "./config";
import { closeDb } from "./db/database";

const server = app.listen(config.port, () => {
  console.log(
    `Fabrknt On-Chain Compliance QN Add-On running at http://localhost:${config.port}`,
  );
});

/* ------------------------------------------------------------------ */
/*  Graceful shutdown                                                  */
/* ------------------------------------------------------------------ */
function shutdown() {
  console.log("Shutting down...");
  server.close(() => {
    closeDb();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default server;
