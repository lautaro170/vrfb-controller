"use client"

import { Card, CardContent } from "@/components/ui/card.tsx"
import { ApiKeyRequired } from "@/components/api-key-required.tsx"
import { MetricCard } from "@/components/metric-card.tsx"
import { CATEGORY_ORDER, TELEMETRY_METRICS, TOP_METRIC_KEYS, type TelemetryMetricDefinition } from "@/constants/telemetry-schema.ts"
import { useTelemetry } from "@/contexts/telemetry-context.tsx"
import { useAuth } from "@/contexts/auth-context.tsx"

export default function Dashboard() {
  const { authStatus } = useAuth()
// 1. Destructure latestRow instead of latestValues
    const { isConnected, isLoading, latestRow } = useTelemetry()

    if (authStatus === "missing" || authStatus === "invalid") {
        return <ApiKeyRequired invalid={authStatus === "invalid"} />
    }

    const topMetrics = TOP_METRIC_KEYS.map((key) =>
        TELEMETRY_METRICS.find((metric) => metric.key === key)
    ).filter((metric): metric is TelemetryMetricDefinition => metric !== undefined)

    const isInitialLoad = isLoading && !latestRow
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

        {isInitialLoad ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">Cargando telemetria inicial...</CardContent>
            </Card>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Metricas prioritarias</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {topMetrics.map((metric) => {
                const definition = metric as TelemetryMetricDefinition
                return (
                    <MetricCard
                        key={`top-${definition.key}`}
                        label={definition.label}
                        valueType={definition.valueType}
                        unit={definition.unit}
                        value={latestRow?.[definition.key]}
                        min={definition.min}
                        max={definition.max}
                        decimals={definition.decimals}
                    />
                )
            })}
          </div>
        </section>

        {CATEGORY_ORDER.map((category) => {
          const metrics = TELEMETRY_METRICS.filter((metric) => metric.category === category)

          return (
              <section key={category} className="space-y-3">
                <h2 className="text-lg font-semibold">{category}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {metrics.map((metric) => {
                      const definition = metric as TelemetryMetricDefinition
                      return (
                          <MetricCard
                              key={`${category}-${definition.key}`}
                              label={definition.label}
                              valueType={definition.valueType}
                              value={latestRow?.[definition.key]}
                              unit={definition.unit}
                              min={definition.min}
                              max={definition.max}
                              decimals={definition.decimals}
                          />
                      )
                  })}
                </div>
              </section>
          )
        })}
      </div>
  )
}