"use client"

import { useMemo, useState } from "react"
import { ApiKeyRequired } from "@/components/api-key-required.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent } from "@/components/ui/card.tsx"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx"
import { TELEMETRY_METRICS, type TelemetryMetricDefinition } from "@/constants/telemetry-schema.ts"
import { useTelemetry } from "@/contexts/telemetry-context.tsx"

const ROWS_PER_PAGE = 10

function formatCellValue(value: unknown, metric: TelemetryMetricDefinition) {
  if (value === undefined || value === null) {
    return "-"
  }

  if (metric.valueType === "text") {
    if (typeof value !== "string") {
      return "-"
    }

    const text = value.trim()
    return text === "" ? "-" : text
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "-"
    }

    const decimals = metric.decimals ?? 2
    return Number.isInteger(value) ? String(value) : value.toFixed(decimals)
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      const decimals = metric.decimals ?? 2
      return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(decimals)
    }
  }

  return "-"
}

export default function LogsPage() {
  const { authStatus, isLoading, rows, refreshRows } = useTelemetry()
  const [currentPage, setCurrentPage] = useState(1)

  const columns = useMemo(() => TELEMETRY_METRICS, [])

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * ROWS_PER_PAGE
  const currentRows = rows.slice(startIndex, startIndex + ROWS_PER_PAGE)

  if (authStatus === "missing" || authStatus === "invalid") {
    return <ApiKeyRequired invalid={authStatus === "invalid"} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Mostrando ultimos {rows.length} registros de telemetria</p>
        <Button variant="outline" onClick={() => void refreshRows()} disabled={isLoading}>
          {isLoading ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>
                Pagina {safeCurrentPage} de {totalPages}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Device</TableHead>
                  {columns.map((column) => (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRows.map((row) => (
                  <TableRow key={`${row.time}-${row.device_id}`}>
                    <TableCell>{new Date(row.time).toLocaleString()}</TableCell>
                    <TableCell>{row.device_id}</TableCell>
                    {columns.map((column) => (
                      <TableCell key={`${row.time}-${column.key}`}>{formatCellValue(row[column.key], column)}</TableCell>
                    ))}
                  </TableRow>
                ))}

                {currentRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2 + columns.length} className="py-6 text-center text-muted-foreground">
                      No hay registros disponibles
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Pagina {safeCurrentPage} de {totalPages}
        </span>
        <Button variant="outline" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}
