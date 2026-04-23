"use client"

import { Card, CardContent } from "@/components/ui/card.tsx"
import { ApiKeyRequired } from "@/components/api-key-required.tsx"
import { MetricCard } from "@/components/metric-card.tsx"
import { CATEGORY_ORDER, TELEMETRY_METRICS, TOP_METRIC_KEYS } from "@/constants/telemetry-schema.ts"
import { useTelemetry } from "@/contexts/telemetry-context.tsx"

export default function Dashboard() {
  const { authStatus, isConnected, isLoading, latestValues, rows } = useTelemetry()

  if (authStatus === "missing" || authStatus === "invalid") {
    return <ApiKeyRequired invalid={authStatus === "invalid"} />
  }

  const topMetrics = TOP_METRIC_KEYS.map((key) => TELEMETRY_METRICS.find((metric) => metric.key === key)).filter((metric): metric is NonNullable<typeof metric> => metric !== undefined)

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500"}`} />
            <span className="text-sm font-medium">{isConnected ? "Conectado" : "Esperando telemetria"}</span>
          </div>
          <span className="text-xs text-muted-foreground">Dispositivo: vrfb1</span>
        </CardContent>
      </Card>

      {isLoading && rows.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Cargando telemetria inicial...</CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Metricas prioritarias</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {topMetrics.map((metric) => (
            <MetricCard
              key={`top-${metric.key}`}
              label={metric.label}
              valueType={metric.valueType}
              unit={metric.unit}
              value={latestValues[metric.key]}
              min={metric.min}
              max={metric.max}
              decimals={metric.decimals}
            />
          ))}
        </div>
      </section>

      {CATEGORY_ORDER.map((category) => {
        const metrics = TELEMETRY_METRICS.filter((metric) => metric.category === category)

        return (
          <section key={category} className="space-y-3">
            <h2 className="text-lg font-semibold">{category}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {metrics.map((metric) => (
                <MetricCard
                  key={`${category}-${metric.key}`}
                  label={metric.label}
                  valueType={metric.valueType}
                  unit={metric.unit}
                  value={latestValues[metric.key]}
                  min={metric.min}
                  max={metric.max}
                  decimals={metric.decimals}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
