"use client"

import { useEffect, useState } from "react"
import { ApiKeyRequired } from "@/components/api-key-required.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent } from "@/components/ui/card.tsx"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx"
import { TELEMETRY_METRICS, type TelemetryMetricDefinition } from "@/constants/telemetry-schema.ts"
import { useTelemetry } from "@/contexts/telemetry-context.tsx"
import { useAuth } from "@/contexts/auth-context.tsx"
import { getTelemetry, type TelemetryRow } from "@/lib/backend-client.ts"

const ROWS_PER_PAGE = 10
const LIVE_TRAILING_LIMIT = 50

function formatCellValue(value: unknown, metric: TelemetryMetricDefinition) {
  if (value === "-" || value === undefined || value === null) return "-"
  if (typeof value === "number") {
    const decimals = metric.decimals ?? 2
    return Number.isInteger(value) ? String(value) : value.toFixed(decimals)
  }
  return String(value)
}

export default function LogsPage() {
  const { authStatus, apiKey } = useAuth()
  const { deviceId, latestRow } = useTelemetry()

  const [viewMode, setViewMode] = useState<"historical" | "live">("historical")

  // Historical State
  const [historyRows, setHistoryRows] = useState<TelemetryRow[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [highestId, setHighestId] = useState<number | null>(null)

  // Live Trailing State
  const [liveRows, setLiveRows] = useState<TelemetryRow[]>([])

  // Fetch History DB logic
  const fetchHistory = async (pageNumber: number, resetCursor: boolean = false) => {
    if (!apiKey) return
    setIsHistoryLoading(true)
    try {
      const response = await getTelemetry({
        apiKey,
        deviceId,
        limit: ROWS_PER_PAGE,
        offset: (pageNumber - 1) * ROWS_PER_PAGE,
        // Optional: Include your custom `maxId` or DB cursor param if added to the backend client:
        maxId: resetCursor ? null : highestId,
      })

      setHistoryRows(response.rows)

      if (resetCursor && response.rows.length > 0) {
        setHighestId(response.rows[0].id ?? null) // Adapt to your backend's primary key
      }
    } catch (error) {
      console.error("Failed to fetch historical logs:", error)
    } finally {
      setIsHistoryLoading(false)
    }
  }

  // Load history on mount or mode change
  useEffect(() => {
    if (viewMode === "historical") {
      fetchHistory(1, true)
      setPage(1)
    }
  }, [viewMode, apiKey])

  // Accumulate live events from context
  useEffect(() => {
    if (latestRow) {
      setLiveRows((prev) => [latestRow, ...prev].slice(0, LIVE_TRAILING_LIMIT))
    }
  }, [latestRow])

  if (authStatus === "missing" || authStatus === "invalid") {
    return <ApiKeyRequired invalid={authStatus === "invalid"} />
  }

  const columns = TELEMETRY_METRICS
  const activeRows = viewMode === "historical" ? historyRows : liveRows

  return (
      <div className="space-y-4">
        {/* Mode Switcher & Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
                variant={viewMode === "historical" ? "default" : "outline"}
                onClick={() => setViewMode("historical")}
            >
              Historial DB
            </Button>
            <Button
                variant={viewMode === "live" ? "default" : "outline"}
                onClick={() => setViewMode("live")}
            >
              Live Trailing
              {viewMode === "live" && <span className="ml-2 flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
            </Button>
          </div>

          {viewMode === "historical" && (
              <Button
                  variant="outline"
                  onClick={() => {
                    setPage(1)
                    fetchHistory(1, true)
                  }}
                  disabled={isHistoryLoading}
              >
                {isHistoryLoading ? "Actualizando..." : "Refrescar Datos"}
              </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                {viewMode === "historical" && (
                    <TableCaption>Pagina {page}</TableCaption>
                )}
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
                  {activeRows.map((row, i) => (
                      <TableRow key={`${row.time}-${row.device_id}-${i}`}>
                        <TableCell className="whitespace-nowrap">{new Date(row.time).toLocaleString()}</TableCell>
                        <TableCell>{row.device_id}</TableCell>
                        {columns.map((column) => (
                            <TableCell key={`${row.time}-${column.key}`}>
                              {formatCellValue(row[column.key], column)}
                            </TableCell>
                        ))}
                      </TableRow>
                  ))}

                  {activeRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2 + columns.length} className="py-6 text-center text-muted-foreground">
                          {viewMode === "historical" ? "No hay registros historicos" : "Esperando eventos en vivo..."}
                        </TableCell>
                      </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination Controls (Only for Historical View) */}
        {viewMode === "historical" && (
            <div className="flex items-center justify-between">
              <Button
                  variant="outline"
                  disabled={page === 1 || isHistoryLoading}
                  onClick={() => {
                    const prev = Math.max(1, page - 1)
                    setPage(prev)
                    fetchHistory(prev)
                  }}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
            Pagina {page}
          </span>
              <Button
                  variant="outline"
                  disabled={historyRows.length < ROWS_PER_PAGE || isHistoryLoading}
                  onClick={() => {
                    const next = page + 1
                    setPage(next)
                    fetchHistory(next)
                  }}
              >
                Siguiente
              </Button>
            </div>
        )}
      </div>
  )
}