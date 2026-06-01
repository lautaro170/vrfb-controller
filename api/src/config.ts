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

function readBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];

  if (!raw || raw.trim() === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}

export function normalizeMqttUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  const secureByPort = url.protocol === "mqtt:" && url.port === "8883";
  const forceSecure = readBoolean("MQTT_TLS", false);

  if (secureByPort || forceSecure) {
    url.protocol = "mqtts:";
  }

  return url.toString();
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

export type AppConfig = {
  port: number;
  mqttUrl: string;
  mqttUser: string;
  mqttPassword: string;
  mqttRejectUnauthorized: boolean;
  mqttTopic: string;
  apiKey: string;
  databaseUrl: string;
  historyBucketMinutes: number;
  corsOrigins: string[];
};

export const config: AppConfig = {
  port: Number(process.env.PORT ?? "3000"),
  mqttUrl: normalizeMqttUrl(readEnv("MQTT_URL", "mqtt://localhost:1883")),
  mqttUser: readEnv("MQTT_USER", 'vrfb1'),
  mqttPassword: readEnv("MQTT_PASSWORD", 'vrfb1UTN'),
  mqttRejectUnauthorized: readBoolean("MQTT_REJECT_UNAUTHORIZED", true),
  mqttTopic: "vrfb/telemetry/+",
  apiKey: readEnv("API_KEY"),
  databaseUrl: readEnv("DATABASE_URL"),
  historyBucketMinutes: 5,
  corsOrigins: readCorsOrigins(),
};

