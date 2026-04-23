import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { cn } from "@/lib/utils.ts"

type MetricCardProps = {
  label: string
  value?: number
  unit?: string
  min?: number
  max?: number
  decimals?: number
}

function formatValue(value: number | undefined, decimals = 2) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "-"
  }

  if (Number.isInteger(value)) {
    return String(value)
  }

  return value.toFixed(decimals)
}

export function MetricCard({ label, value, unit, min, max, decimals = 2 }: MetricCardProps) {
  const isOutOfRange =
    value !== undefined &&
    Number.isFinite(value) &&
    ((min !== undefined && value < min) || (max !== undefined && value > max))

  return (
    <Card className={cn(isOutOfRange && "border-destructive") }>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {formatValue(value, decimals)}
          {unit ? <span className="ml-1 text-sm text-muted-foreground">{unit}</span> : null}
        </div>
      </CardContent>
    </Card>
  )
}

