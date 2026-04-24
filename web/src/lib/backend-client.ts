import { io, type Socket } from "socket.io-client"
import type { TelemetryMetricKey, TelemetryMetricValue } from "@/constants/telemetry-schema.ts"

export type TelemetryRow = {
  id: number
  time: string
  device_id: string
} & Partial<Record<TelemetryMetricKey, TelemetryMetricValue>>

export type TelemetryListResponse = {
  deviceId: string
  limit: number
  offset: number
  rows: TelemetryRow[]
}

export type TelemetryUpdateEvent = {
  deviceId: string
  topic: string
  payload?: Partial<Record<TelemetryMetricKey | "time", unknown>>
  raw?: string
  receivedAt?: string
}

export type TelemetryHistoryPoint = {
  time: string
  value: number | null
}

export type TelemetryHistoryResponse = {
  deviceId: string
  series: string
  rangeMinutes: number
  bucketMinutes: number
  points: TelemetryHistoryPoint[]
}

export class BackendClientError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = "BackendClientError"
    this.status = status
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"

function createAuthHeader(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
  }
}

async function fetchJson<T>(
  path: string,
  apiKey: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...createAuthHeader(apiKey),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new BackendClientError(`HTTP ${response.status}`, response.status)
  }

  return (await response.json()) as T
}

export function getTelemetry(params: {
  apiKey: string
  deviceId: string
  limit: number
  offset: number
  maxId?: number | null
}) {
  const search = new URLSearchParams({
    deviceId: params.deviceId,
    limit: String(params.limit),
    offset: String(params.offset),
  })

  return fetchJson<TelemetryListResponse>(`/api/telemetry?${search.toString()}`, params.apiKey)
}

export function getTelemetryHistory(params: {
  apiKey: string
  deviceId: string
  range: number
  series: string
}) {
  const search = new URLSearchParams({
    deviceId: params.deviceId,
    range: String(params.range),
    series: params.series,
  })

  return fetchJson<TelemetryHistoryResponse>(`/api/telemetry/history?${search.toString()}`, params.apiKey)
}

export function createTelemetrySocket(apiKey: string): Socket {
  return io(API_BASE_URL, {
    transports: ["websocket"],
    auth: {
      token: `Bearer ${apiKey}`,
    },
  })
}