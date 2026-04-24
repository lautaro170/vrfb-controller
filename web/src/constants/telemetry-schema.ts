export type TelemetryValueType = "number" | "text"

export type TelemetryCategory = "Electrical" | "Thermal" | "Chemical" | "Mechanical" | "Solar" | "State"

export const TELEMETRY_METRIC_KEYS = [
  "voltage_battery",
  "current_battery",
  "temp_tank_1",
  "temp_tank_2",
  "temp_ambient",
  "humidity_ambient",
  "conductivity_1",
  "conductivity_2",
  "pump_1_rpm",
  "pump_2_rpm",
  "voltage_solar",
  "current_solar",
  "total_energy_harvested",
  "current_state",
] as const

export type TelemetryMetricKey = (typeof TELEMETRY_METRIC_KEYS)[number]

export type TelemetryMetricDefinition = {
  key: TelemetryMetricKey
  label: string
  valueType: TelemetryValueType
  unit?: string
  category: TelemetryCategory
  min?: number
  max?: number
  decimals?: number
}

export const TELEMETRY_METRICS: ReadonlyArray<TelemetryMetricDefinition> = [
  { key: "voltage_battery", label: "Battery Voltage", valueType: "number", unit: "V", category: "Electrical", min: 0, max: 80, decimals: 2 },
  { key: "current_battery", label: "Battery Current", valueType: "number", unit: "A", category: "Electrical", min: -250, max: 250, decimals: 2 },
  { key: "temp_tank_1", label: "Tank 1 Temp", valueType: "number", unit: "C", category: "Thermal", min: 0, max: 60, decimals: 1 },
  { key: "temp_tank_2", label: "Tank 2 Temp", valueType: "number", unit: "C", category: "Thermal", min: 0, max: 60, decimals: 1 },
  { key: "temp_ambient", label: "Ambient Temp", valueType: "number", unit: "C", category: "Thermal", min: -10, max: 55, decimals: 1 },
  { key: "humidity_ambient", label: "Ambient Humidity", valueType: "number", unit: "%", category: "Thermal", min: 0, max: 100, decimals: 1 },
  { key: "conductivity_1", label: "Conductivity 1", valueType: "number", unit: "mS/cm", category: "Chemical", min: 0, max: 200, decimals: 2 },
  { key: "conductivity_2", label: "Conductivity 2", valueType: "number", unit: "mS/cm", category: "Chemical", min: 0, max: 200, decimals: 2 },
  { key: "pump_1_rpm", label: "Pump 1 RPM", valueType: "number", unit: "rpm", category: "Mechanical", min: 0, max: 6000, decimals: 0 },
  { key: "pump_2_rpm", label: "Pump 2 RPM", valueType: "number", unit: "rpm", category: "Mechanical", min: 0, max: 6000, decimals: 0 },
  { key: "voltage_solar", label: "Solar Voltage", valueType: "number", unit: "V", category: "Solar", min: 0, max: 120, decimals: 2 },
  { key: "current_solar", label: "Solar Current", valueType: "number", unit: "A", category: "Solar", min: 0, max: 120, decimals: 2 },
  { key: "total_energy_harvested", label: "Total Energy Harvested", valueType: "number", unit: "Wh", category: "Solar", min: 0, decimals: 2 },
  { key: "current_state", label: "Current State", valueType: "text", category: "State" },
]

export type TelemetryMetricValue = number | string

export type TelemetryValuesMap = Partial<Record<TelemetryMetricKey, TelemetryMetricValue>>

export const TOP_METRIC_KEYS: ReadonlyArray<TelemetryMetricKey> = [
  "voltage_battery",
  "current_battery",
  "temp_tank_1",
  "temp_tank_2",
  "current_state",
]

export const CATEGORY_ORDER: ReadonlyArray<TelemetryCategory> = [
  "Electrical",
  "Thermal",
  "Chemical",
  "Mechanical",
  "Solar",
  "State",
]

export const METRIC_DEFINITION_BY_KEY: Readonly<Record<TelemetryMetricKey, TelemetryMetricDefinition>> = TELEMETRY_METRICS.reduce(
  (acc, metric) => {
    acc[metric.key as TelemetryMetricKey] = metric
    return acc
  },
  {} as Record<TelemetryMetricKey, TelemetryMetricDefinition>,
)
