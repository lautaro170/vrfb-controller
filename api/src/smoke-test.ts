import { normalizeTelemetryPayload, resolveSeries } from "./telemetry";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function run(): void {
  const payload = {
    time: "2026-04-20T10:15:00.000Z",
    voltage_battery: 48.1,
    pump_1_rpm: 1200,
  };

  const normalized = normalizeTelemetryPayload(payload);
  assert(normalized.time !== null, "Expected valid ISO8601 time");
  assert(normalized.values.voltage_battery === 48.1, "Expected voltage mapping");
  assert(normalized.values.pump_1_rpm === 1200, "Expected pump mapping");
  assert(resolveSeries("voltage") === "voltage_battery", "Expected default alias");
  assert(resolveSeries("temp_tank_1") === "temp_tank_1", "Expected exact series");

  // eslint-disable-next-line no-console
  console.log("Smoke test passed");
}

run();

