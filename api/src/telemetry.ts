export const TELEMETRY_COLUMNS = [
  "temp_tank_1",
  "temp_tank_2",
  "temp_ambient",
  "humidity_ambient",
  "voltage_battery",
  "current_battery",
  "voltage_solar",
  "current_solar",
  "conductivity_1",
  "conductivity_2",
  "pump_1_rpm",
  "pump_2_rpm",
] as const;

export type TelemetryColumn = (typeof TELEMETRY_COLUMNS)[number];

export type TelemetryRecord = {
  time: string;
  device_id: string;
} & Record<TelemetryColumn, number | null>;

export type NormalizedTelemetry = {
  time: Date | null;
  values: Partial<Record<TelemetryColumn, number>>;
};

export const SERIES_ALIAS: Record<string, TelemetryColumn> = {
  voltage: "voltage_battery",
};

export function resolveSeries(series: string | undefined): TelemetryColumn | null {
  if (!series || series.trim() === "") {
    return SERIES_ALIAS.voltage;
  }

  if (series in SERIES_ALIAS) {
    return SERIES_ALIAS[series];
  }

  if ((TELEMETRY_COLUMNS as readonly string[]).includes(series)) {
    return series as TelemetryColumn;
  }

  return null;
}

export function normalizeTelemetryPayload(payload: unknown): NormalizedTelemetry {
  const data = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

  let time: Date | null = new Date();
  const rawTime = data.time;

  if (typeof rawTime === "string") {
    const parsedTime = new Date(rawTime);
    time = Number.isNaN(parsedTime.getTime()) ? null : parsedTime;
  }

  const values: Partial<Record<TelemetryColumn, number>> = {};
  for (const key of TELEMETRY_COLUMNS) {
    const rawValue = data[key];
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      values[key] = rawValue;
      continue;
    }

    if (typeof rawValue === "string" && rawValue.trim() !== "") {
      const parsedValue = Number(rawValue);
      if (Number.isFinite(parsedValue)) {
        values[key] = parsedValue;
      }
    }
  }

  return { time, values };
}

