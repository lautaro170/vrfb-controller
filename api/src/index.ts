import { createRuntime } from "./app";
import { config } from "./config";
import { initSchema, pool } from "./db";

async function start(): Promise<void> {
  await initSchema();

  const runtime = createRuntime();
  runtime.server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${config.port}`);
  });

  const shutdown = async () => {
    runtime.mqttClient.end(true);
    runtime.io.close();
    runtime.server.close();
    await pool.end();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API", error);
  process.exit(1);
});

