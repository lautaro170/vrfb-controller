import express, { Request, Response } from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mqtt, { MqttClient } from "mqtt";
import { apiKeyAuth, isSocketAuthorized } from "./auth";
import { config } from "./config";
import { fetchHistoryRows, fetchTelemetryRows, insertTelemetryRow } from "./db";
import {
  normalizeTelemetryPayload,
  resolveSeries,
  TELEMETRY_COLUMNS,
  TelemetryColumn,
  TelemetryRecord,
} from "./telemetry";

type Runtime = {
  app: express.Express;
  server: http.Server;
  io: SocketIOServer;
  mqttClient: MqttClient;
};

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  if (config.corsOrigins.includes("*")) {
    return true;
  }

  return config.corsOrigins.includes(origin);
}

function parseTopic(topic: string): string | null {
  const match = /^vrfb\/telemetry\/(.+)$/.exec(topic);
  return match?.[1] ?? null;
}

function toTelemetryRow(deviceId: string, timestamp: Date, values: Partial<Record<TelemetryColumn, number>>): TelemetryRecord {
  const row: TelemetryRecord = {
    time: timestamp.toISOString(),
    device_id: deviceId,
    temp_tank_1: null,
    temp_tank_2: null,
    temp_ambient: null,
    humidity_ambient: null,
    voltage_battery: null,
    current_battery: null,
    voltage_solar: null,
    current_solar: null,
    conductivity_1: null,
    conductivity_2: null,
    pump_1_rpm: null,
    pump_2_rpm: null,
  };

  for (const column of TELEMETRY_COLUMNS) {
    if (column in values) {
      const value = values[column];
      row[column] = column.startsWith("pump_") ? Math.trunc(value as number) : (value as number);
    }
  }

  return row;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createRuntime(): Runtime {
  const app = express();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("CORS origin not allowed"));
      },
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type"],
    },
  });

  io.use((socket, next) => {
    const authorization = socket.handshake.headers.authorization;
    const authToken =
      typeof socket.handshake.auth.token === "string" ? socket.handshake.auth.token : undefined;

    if (!isSocketAuthorized(authorization, authToken)) {
      next(new Error("Unauthorized"));
      return;
    }

    next();
  });

  io.on("connection", () => {
    // Intentionally empty: all live updates are pushed from MQTT callbacks.
  });

  app.use(express.json());

  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (typeof origin === "string" && isOriginAllowed(origin)) {
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Origin", config.corsOrigins.includes("*") ? "*" : origin);
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    }

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.use("/api", apiKeyAuth);

  app.get("/api/telemetry", async (req: Request, res: Response) => {
    const deviceId = req.query.deviceId as string | undefined;
    if (!deviceId) {
      res.status(400).json({ error: "Bad request" });
      return;
    }

    const limit = parsePositiveInt(req.query.limit as string | undefined, 100);
    const offset = parsePositiveInt(req.query.offset as string | undefined, 0);

    try {
      const rows = await fetchTelemetryRows(deviceId, limit, offset);
      res.json({ deviceId, limit, offset, rows });
    } catch {
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.get("/api/telemetry/history", async (req: Request, res: Response) => {
    const deviceId = req.query.deviceId as string | undefined;
    if (!deviceId) {
      res.status(400).json({ error: "Bad request" });
      return;
    }

    const rangeMinutes = parsePositiveInt(req.query.range as string | undefined, 5);
    const series = resolveSeries(req.query.series as string | undefined);

    if (!series) {
      res.status(400).json({ error: "Bad request" });
      return;
    }

    try {
      const points = await fetchHistoryRows(deviceId, series, rangeMinutes, config.historyBucketMinutes);
      res.json({
        deviceId,
        series,
        rangeMinutes,
        bucketMinutes: config.historyBucketMinutes,
        points,
      });
    } catch {
      res.status(500).json({ error: "Internal error" });
    }
  });

  const mqttClient = mqtt.connect(config.mqttUrl, {
    reconnectPeriod: 5000,
  });

  mqttClient.on("connect", () => {
    mqttClient.subscribe(config.mqttTopic);
  });

  mqttClient.on("message", async (topic, buffer) => {
    const payloadText = buffer.toString();
    const deviceId = parseTopic(topic);

    if (!deviceId) {
      return;
    }

    let parsedPayload: unknown = {};
    try {
      parsedPayload = JSON.parse(payloadText);
    } catch {
      // Keep broadcasting raw payload if parse fails.
      io.emit("telemetry_update", {
        deviceId,
        topic,
        raw: payloadText,
      });
      return;
    }

    const normalized = normalizeTelemetryPayload(parsedPayload);
    const timestamp = normalized.time;

    io.emit("telemetry_update", {
      deviceId,
      topic,
      payload: parsedPayload,
      receivedAt: new Date().toISOString(),
    });

    if (!timestamp) {
      return;
    }

    const row = toTelemetryRow(deviceId, timestamp, normalized.values);

    try {
      await insertTelemetryRow(row);
    } catch {
      // Best effort persistence: skip bad write and continue with next telemetry message.
    }
  });

  return { app, server, io, mqttClient };
}

