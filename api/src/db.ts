import { Pool } from "pg";
import { config } from "./config";
import { TELEMETRY_COLUMNS, TelemetryColumn, TelemetryRecord } from "./telemetry";

const TABLE = "vrfb_telemetry";

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

const schemaSql = `
CREATE TABLE IF NOT EXISTS ${TABLE} (
  time TIMESTAMPTZ NOT NULL,
  device_id VARCHAR NOT NULL,
  temp_tank_1 REAL NULL,
  temp_tank_2 REAL NULL,
  temp_ambient REAL NULL,
  humidity_ambient REAL NULL,
  voltage_battery REAL NULL,
  current_battery REAL NULL,
  voltage_solar REAL NULL,
  current_solar REAL NULL,
  conductivity_1 REAL NULL,
  conductivity_2 REAL NULL,
  pump_1_rpm INTEGER NULL,
  pump_2_rpm INTEGER NULL,
  PRIMARY KEY (time, device_id)
);

CREATE INDEX IF NOT EXISTS idx_vrfb_telemetry_device_time_desc
  ON ${TABLE}(device_id, time DESC);
`;

export async function initSchema(): Promise<void> {
  await pool.query(schemaSql);
}

export async function insertTelemetryRow(row: TelemetryRecord): Promise<void> {
  const columns = ["time", "device_id", ...TELEMETRY_COLUMNS];
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  const updateSet = TELEMETRY_COLUMNS.map((column) => `${column} = EXCLUDED.${column}`);

  const values = [
    row.time,
    row.device_id,
    ...TELEMETRY_COLUMNS.map((column) => row[column]),
  ];

  const query = `
    INSERT INTO ${TABLE} (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
    ON CONFLICT (time, device_id)
    DO UPDATE SET ${updateSet.join(", ")};
  `;

  await pool.query(query, values);
}

export async function fetchTelemetryRows(
  deviceId: string,
  limit: number,
  offset: number,
): Promise<TelemetryRecord[]> {
  const query = `
    SELECT time, device_id, ${TELEMETRY_COLUMNS.join(", ")}
    FROM ${TABLE}
    WHERE device_id = $1
    ORDER BY time DESC
    LIMIT $2 OFFSET $3;
  `;

  const result = await pool.query(query, [deviceId, limit, offset]);
  return result.rows;
}

export async function fetchHistoryRows(
  deviceId: string,
  series: TelemetryColumn,
  rangeMinutes: number,
  bucketMinutes: number,
): Promise<Array<{ time: string; value: number | null }>> {
  const bucketSeconds = bucketMinutes * 60;
  const rangeSeconds = rangeMinutes * 60;

  const query = `
    SELECT
      to_timestamp(floor(extract(epoch FROM time) / ${bucketSeconds}) * ${bucketSeconds}) AS time,
      AVG(${series})::REAL AS value
    FROM ${TABLE}
    WHERE device_id = $1
      AND time >= NOW() - ($2::INT * INTERVAL '1 second')
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  const result = await pool.query(query, [deviceId, rangeSeconds]);
  return result.rows;
}

