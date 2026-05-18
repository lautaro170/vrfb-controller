import dotenv from "dotenv";

dotenv.config();

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

function readCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;

  if (!raw || raw.trim() === "") {
    return DEFAULT_CORS_ORIGINS;
  }

  if (raw.trim() === "*") {
    return ["*"];
  }

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export const config = {
  port: Number(process.env.PORT ?? "3000"),
  mqttUrl: readEnv("MQTT_URL", "mqtt://localhost:1883"),
  mqttUser: readEnv("MQTT_USER", 'vrfb1'),
  mqttPassword: readEnv("MQTT_PASSWORD", 'vrfb1UTN'),
  mqttTopic: "vrfb/telemetry/+",
  apiKey: readEnv("API_KEY"),
  databaseUrl: readEnv("DATABASE_URL"),
  historyBucketMinutes: 5,
  corsOrigins: readCorsOrigins(),
};

