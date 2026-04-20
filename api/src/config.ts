import dotenv from "dotenv";

dotenv.config();

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

export const config = {
  port: Number(process.env.PORT ?? "3000"),
  mqttUrl: readEnv("MQTT_URL", "mqtt://localhost:1883"),
  mqttTopic: "vrfb/telemetry/+",
  apiKey: readEnv("API_KEY"),
  databaseUrl: readEnv("DATABASE_URL"),
  historyBucketMinutes: 5,
};

