import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  createTelemetrySocket,
  getTelemetry,
  type TelemetryRow,
  type TelemetryUpdateEvent,
} from "@/lib/backend-client.ts"
import {
  TELEMETRY_METRICS,
  type TelemetryMetricDefinition, type TelemetryMetricKey, type TelemetryMetricValue,
} from "@/constants/telemetry-schema.ts"
import { useAuth } from "@/contexts/auth-context.tsx"

type TelemetryContextType = {
  isConnected: boolean
  isLoading: boolean
  latestRow: TelemetryRow | null
  deviceId: string
}

const DEVICE_ID = "vrfb1"

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined)

function sanitizeMetricValue(value: unknown, definition: TelemetryMetricDefinition): string | number {
  if (value === undefined || value === null) return "-"

  if (definition.valueType === "text") {
    if (typeof value !== "string") return "-"
    const normalized = value.trim()
    return normalized === "" ? "-" : normalized
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : "-"
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : "-"
  }

  return "-"
}

function parsePayloadValues(payload: any): Record<TelemetryMetricKey, TelemetryMetricValue> {
  const parsedValues: Partial<Record<TelemetryMetricKey, TelemetryMetricValue>> = {}

  for (const metric of TELEMETRY_METRICS) {
    const rawValue = payload?.[metric.key]
    parsedValues[metric.key] = sanitizeMetricValue(rawValue, metric)
  }

  return parsedValues as Record<TelemetryMetricKey, TelemetryMetricValue>
}

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const { apiKey } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Single source of truth for the latest incoming data
  const [latestRow, setLatestRow] = useState<TelemetryRow | null>(null)

  const refreshLatest = async () => {
    if (!apiKey) return

    try {
      setIsLoading(true)
      const response = await getTelemetry({
        apiKey: apiKey,
        deviceId: DEVICE_ID,
        limit: 1,
        offset: 0,
      })

      if (response.rows.length > 0) {
        const rawRow = response.rows[0]
        const parsedValues = parsePayloadValues(rawRow)
        const nextRow = {
          ...rawRow,
          ...parsedValues,
        } as TelemetryRow

        // Merge the raw metadata (time, id) with the sanitized parsed values
        setLatestRow(nextRow)
      }
    } catch (error) {
      console.error("Failed to fetch initial telemetry", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!apiKey) {
      setIsConnected(false)
      setLatestRow(null)
      return
    }

    let isDisposed = false
    const socket = createTelemetrySocket(apiKey)

    const loadInitialData = async () => {
      await refreshLatest()
      if (isDisposed) socket.disconnect()
    }

    const handleUpdate = (event: TelemetryUpdateEvent) => {
      if (event.deviceId !== DEVICE_ID || !event.payload) return

      const parsedValues = parsePayloadValues(event.payload)

      // Construct the complete row with time, deviceId, and sanitized values
      const nextRow: TelemetryRow = {
        time: (typeof event.payload?.time === "string" && event.payload.time) || event.receivedAt || new Date().toISOString(),
        device_id: DEVICE_ID,
        ...parsedValues,
      } as TelemetryRow

      setLatestRow(nextRow)
    }

    socket.on("connect", () => setIsConnected(true))
    socket.on("disconnect", () => setIsConnected(false))
    socket.on("connect_error", () => {
      setIsConnected(false)
      socket.disconnect()
    })

    socket.on("telemetry_update", handleUpdate)

    loadInitialData()

    return () => {
      isDisposed = true
      socket.disconnect()
      setIsConnected(false)
    }
  }, [apiKey])

  const value = useMemo(
      () => ({
        isConnected,
        isLoading,
        latestRow,
        deviceId: DEVICE_ID,
      }),
      [isConnected, isLoading, latestRow]
  )

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>
}

export function useTelemetry() {
  const context = useContext(TelemetryContext)
  if (!context) {
    throw new Error("useTelemetry must be used within a TelemetryProvider")
  }
  return context
}