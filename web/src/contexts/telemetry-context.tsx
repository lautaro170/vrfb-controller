import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  createTelemetrySocket,
  getTelemetry,
  type TelemetryRow,
  type TelemetryUpdateEvent,
} from "@/lib/backend-client.ts"
import {
  TELEMETRY_METRICS,
  type TelemetryMetricDefinition,
  type TelemetryMetricKey,
  type TelemetryMetricValue,
  type TelemetryValuesMap,
} from "@/constants/telemetry-schema.ts"
import {useAuth} from "@/contexts/auth-context.tsx";


type TelemetryContextType = {
  isConnected: boolean
  isLoading: boolean
  latestValues: TelemetryValuesMap
  rows: TelemetryRow[]
  deviceId: string
  refreshRows: () => Promise<void>
}

const DEVICE_ID = "vrfb1"
const HISTORY_LIMIT = 100

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined)

function sanitizeMetricValue(value: unknown, definition: TelemetryMetricDefinition): TelemetryMetricValue | undefined {
  if (definition.valueType === "text") {
    if (typeof value !== "string") {
      return undefined
    }

    const normalized = value.trim()
    return normalized === "" ? undefined : normalized
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function buildLatestValues(rows: TelemetryRow[]): TelemetryValuesMap {
  const values: TelemetryValuesMap = {}

  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index]

    for (const metric of TELEMETRY_METRICS) {
      const rawValue = row[metric.key]
      const normalizedValue = sanitizeMetricValue(rawValue, metric)
      if (normalizedValue !== undefined) {
        values[metric.key] = normalizedValue
      }
    }
  }

  return values
}

function parsePayloadValues(payload: TelemetryUpdateEvent["payload"]): TelemetryValuesMap {
  const parsedValues: TelemetryValuesMap = {}

  if (!payload) {
    return parsedValues
  }

  for (const metric of TELEMETRY_METRICS) {
    const rawValue = payload[metric.key]
    const normalizedValue = sanitizeMetricValue(rawValue, metric)
    if (normalizedValue !== undefined) {
      parsedValues[metric.key] = normalizedValue
    }
  }

  return parsedValues
}

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const { apiKey } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [latestValues, setLatestValues] = useState<TelemetryValuesMap>({})
  const [rows, setRows] = useState<TelemetryRow[]>([])

  const refreshRows = async () => {
    const trimmedKey = apiKey.trim()
    if (!trimmedKey) {
      return
    }

    try {
      const response = await getTelemetry({
        apiKey: trimmedKey,
        deviceId: DEVICE_ID,
        limit: HISTORY_LIMIT,
        offset: 0,
      })

      setRows(response.rows)
      setLatestValues(buildLatestValues(response.rows))
    } catch (error) {
    }
  }

  useEffect(() => {
    const trimmedKey = apiKey.trim()
    if (!trimmedKey) {
      setIsConnected(false)
      setLatestValues({})
      setRows([])
      return
    }

    let isDisposed = false
    const socket = createTelemetrySocket(trimmedKey)

    const loadInitialData = async () => {
      setIsLoading(true)

      try {
        const response = await getTelemetry({
          apiKey: trimmedKey,
          deviceId: DEVICE_ID,
          limit: HISTORY_LIMIT,
          offset: 0,
        })

        if (isDisposed) {
          return
        }

        setRows(response.rows)
        setLatestValues(buildLatestValues(response.rows))
      } catch (error) {
        if (isDisposed) {
          return
        }
         socket.disconnect()
      } finally {
        if (!isDisposed) {
          setIsLoading(false)
        }
      }
    }

    const handleUpdate = (event: TelemetryUpdateEvent) => {
      if (event.deviceId !== DEVICE_ID || !event.payload) {
        return
      }

      const parsedValues = parsePayloadValues(event.payload)

      if (Object.keys(parsedValues).length === 0) {
        return
      }

      setLatestValues((previous) => ({
        ...previous,
        ...parsedValues,
      }))

      setRows((previous) => {
        const head = previous[0] ?? { time: new Date().toISOString(), device_id: DEVICE_ID }
        const nextValues: Partial<Record<TelemetryMetricKey, number | string | null>> = {}

        for (const metric of TELEMETRY_METRICS) {
          const value = parsedValues[metric.key]
          if (value !== undefined) {
            nextValues[metric.key] = value
          }
        }

        const nextRow: TelemetryRow = {
          ...head,
          ...nextValues,
          time:
            (typeof event.payload?.time === "string" && event.payload.time) ||
            event.receivedAt ||
            new Date().toISOString(),
          device_id: DEVICE_ID,
        }

        return [nextRow, ...previous].slice(0, HISTORY_LIMIT)
      })
    }

    socket.on("connect", () => {
      setIsConnected(true)
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
    })

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
      latestValues,
      rows,
      deviceId: DEVICE_ID,
      refreshRows,
    }),
    [isConnected, isLoading, latestValues, rows],
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



