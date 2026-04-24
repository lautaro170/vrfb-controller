import { useEffect, useMemo, useState } from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button.tsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx"
import type { TelemetryMetricDefinition } from "@/constants/telemetry-schema.ts"
import { useAuth } from "@/contexts/auth-context.tsx"
import { getTelemetryHistory, type TelemetryHistoryPoint } from "@/lib/backend-client.ts"

const RANGE_PRESETS = [
  { label: "15m", minutes: 15 },
  { label: "60m", minutes: 60 },
  { label: "6h", minutes: 360 },
  { label: "24h", minutes: 1440 },
] as const

type MetricHistoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  metric: TelemetryMetricDefinition | null
  deviceId: string
}

function formatMetricValue(value: number | null, decimals = 2): string {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) {
    return "-"
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(decimals)
}

export function MetricHistoryDialog({ open, onOpenChange, metric, deviceId }: MetricHistoryDialogProps) {
  const { apiKey } = useAuth()
  const [rangeMinutes, setRangeMinutes] = useState<number>(60)
  const [points, setPoints] = useState<TelemetryHistoryPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open || !metric || metric.valueType !== "number" || !apiKey) {
      return
    }

    let isActive = true

    const loadHistory = async () => {
      setIsLoading(true)
      try {
        const response = await getTelemetryHistory({
          apiKey,
          deviceId,
          range: rangeMinutes,
          series: metric.key,
        })

        if (isActive) {
          setPoints(response.points)
        }
      } catch {
        if (isActive) {
          setPoints([])
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      isActive = false
    }
  }, [open, metric, apiKey, deviceId, rangeMinutes])

  const chartData = useMemo(
    () =>
      points.map((point) => ({
        ...point,
        label: new Date(point.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })),
    [points],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{metric?.label ?? "Historial"}</DialogTitle>
          <DialogDescription>
            Variacion en el tiempo {metric?.unit ? `(${metric.unit})` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {RANGE_PRESETS.map((preset) => (
            <Button
              key={preset.minutes}
              type="button"
              variant={rangeMinutes === preset.minutes ? "default" : "outline"}
              size="sm"
              onClick={() => setRangeMinutes(preset.minutes)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="h-80 w-full rounded-md border p-2">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Cargando historial...</div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No hay datos para el rango seleccionado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" minTickGap={32} />
                <YAxis
                  tickFormatter={(value: number) => formatMetricValue(value, metric?.decimals ?? 2)}
                  width={64}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    color: "var(--popover-foreground)",
                  }}
                  labelStyle={{ color: "var(--popover-foreground)", marginBottom: "0.25rem" }}
                  itemStyle={{ color: "var(--popover-foreground)" }}
                  formatter={(value: number | string) => formatMetricValue(Number(value), metric?.decimals ?? 2)}
                  labelFormatter={(_label: string, payload?: Array<{ payload?: { time?: string } }>) => {
                    const first = payload?.[0]
                    return first?.payload?.time ? new Date(first.payload.time).toLocaleString() : ""
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 2, fill: "var(--primary)", stroke: "var(--primary)" }}
                  activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 1 }}
                  connectNulls
                />
                {typeof metric?.min === "number" ? (
                  <ReferenceLine
                    y={metric.min}
                    stroke="var(--destructive)"
                    strokeDasharray="5 5"
                    label={{ value: `Min ${metric.min}${metric.unit ? ` ${metric.unit}` : ""}`, position: "insideTopLeft", fill: "var(--destructive)", fontSize: 12 }}
                  />
                ) : null}
                {typeof metric?.max === "number" ? (
                  <ReferenceLine
                    y={metric.max}
                    stroke="var(--destructive)"
                    strokeDasharray="5 5"
                    label={{ value: `Max ${metric.max}${metric.unit ? ` ${metric.unit}` : ""}`, position: "insideTopRight", fill: "var(--destructive)", fontSize: 12 }}
                  />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


