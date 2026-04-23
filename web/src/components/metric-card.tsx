import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { cn } from "@/lib/utils.ts"
import type { TelemetryMetricValue, TelemetryValueType } from "@/constants/telemetry-schema.ts"

type MetricCardProps = {
  label: string
  value?: TelemetryMetricValue
  valueType: TelemetryValueType
  unit?: string
  min?: number
  max?: number
  decimals?: number
}

function formatValue(value: TelemetryMetricValue | undefined, valueType: TelemetryValueType, decimals = 2) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "-"
  }

  if (valueType === "text") {
    const text = String(value).trim()
    return text === "" ? "-" : text
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-"
  }

  if (Number.isInteger(value)) {
    return String(value)
  }

  return value.toFixed(decimals)
}

export function MetricCard({ label, value, valueType, unit, min, max, decimals = 2 }: MetricCardProps) {
  const isOutOfRange =
    valueType === "number" &&
    typeof value === "number" &&
    Number.isFinite(value) &&
    ((min !== undefined && value < min) || (max !== undefined && value > max))

  return (
    <Card className={cn(isOutOfRange && "border-destructive") }>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {formatValue(value, valueType, decimals)}
          {valueType === "number" && unit ? <span className="ml-1 text-sm text-muted-foreground">{unit}</span> : null}
        </div>
      </CardContent>
    </Card>
  )
}

