# Architecture Design: VRFB Telemetry Dashboard

- **Stack**: Node.js, React.js (shadcn/ui), PostgreSQL, MQTT (Mosquitto)
- **Data Frequency**: 1 payload every 5 to 60 seconds

## 1) Broker and Communication (MQTT)

- **Broker**: Eclipse Mosquitto acts as the central message hub between the edge device and backend server.
- **Topic**:

```text
vrfb/telemetry/{deviceId}
```

- **Payload format**: A JSON object with one or more telemetry fields (partial updates allowed). Missing fields are stored as `NULL`.
- **Timestamp**: Field `time` uses ISO8601 when provided. If `time` is missing, backend uses server `now()`.

## 2) Database and Data Model (PostgreSQL)

- **Schema pattern**: Wide-table design
- **Table**: `vrfb_telemetry`

### Columns

| Column(s) | Type | Notes |
| --- | --- | --- |
| `time` | `TIMESTAMPTZ` | Primary key |
| `device_id` | `VARCHAR` | Primary key |
| `temp_tank_1`, `temp_tank_2`, `temp_ambient` | `REAL` | Temperature sensors |
| `humidity_ambient` | `REAL` | Ambient humidity |
| `voltage_battery`, `current_battery`, `voltage_solar`, `current_solar` | `REAL` | Electrical values |
| `conductivity_1`, `conductivity_2` | `REAL` | Conductivity sensors |
| `pump_1_rpm`, `pump_2_rpm` | `INTEGER` | Pump speed |

- **Indexing**: Composite index on (`device_id`, `time DESC`)

## 3) Backend and API Endpoints (Node.js)

- **Data ingestion**: A Node.js MQTT client connects to Mosquitto, subscribes to telemetry topics, and maps incoming JSON payloads into PostgreSQL rows.
- **Write behavior**: Database writes are best-effort. On insert/update failure, the message is skipped and ingestion continues.
- **Real-time feed**: A WebSocket server (`socket.io`) broadcasts incoming MQTT payloads directly to connected React clients.
- **Broadcast behavior**: Incoming MQTT messages are always broadcasted to clients. Socket transport uses reconnect-only behavior.

### REST API

- `GET /api/telemetry` - Returns paginated historical data. Query params: `deviceId`, `limit`, `offset`.
- `GET /api/telemetry/history` - Returns aggregated time-series data for frontend line charts. Query params: `deviceId`, `range` (free-form minutes), `series`.
  - `series` uses telemetry DB column names (e.g. `temp_tank_1`) and defaults to `voltage` (`voltage_battery`).
  - Fixed aggregation bucket size: 5 minutes.
- `POST /api/commands` *(future)* - Receives frontend instructions and publishes to:

```text
vrfb/commands/{deviceId}
```

- **Authentication**: Basic validation requiring a hardcoded API key in the `Authorization` header for all HTTP requests and WebSocket handshakes.

## 4) Frontend (React.js)

- **Core libraries**:
  - `shadcn/ui` (UI components)
  - `recharts` (charts)
  - `@tanstack/react-table` (data grids)
  - `zustand` (state management for live socket data)

### Page Structure

- `/` (**Dashboard**) - Live view with real-time sensor highlight cards and a scrolling live line chart.
- `/history` - Paginated data table for reviewing and filtering historical PostgreSQL logs.

