# VRFB API

Minimal Node.js + TypeScript backend for VRFB telemetry ingestion, persistence, and real-time delivery.

## Features

- MQTT ingestion from `vrfb/telemetry/{deviceId}`
- PostgreSQL storage in `vrfb_telemetry` (wide table)
- Socket.io real-time event: `telemetry_update`
- REST endpoints:
  - `GET /api/telemetry`
  - `GET /api/telemetry/history`
- API key auth with `Authorization: Bearer <API_KEY>` for HTTP and Socket.io

## Environment Variables

- `PORT` (default `3000`)
- `MQTT_URL` (example: `mqtt://mosquitto:1883`)
- `DATABASE_URL` (example: `postgresql://vrfb:vrfb@postgres:5432/vrfb`)
- `API_KEY` (required)
- `CORS_ORIGINS` (optional CSV, default allows local Vite origins `http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173`; use `*` to allow all)

## Telemetry Rules

- Topic format: `vrfb/telemetry/{deviceId}`
- Payload: JSON object with optional telemetry columns and optional `time`
- `time` handling:
  - If present, must be ISO 8601 parseable
  - If missing, server `now()` is used
- Missing telemetry fields are stored as `NULL`
- Every MQTT message is broadcast via Socket.io, even if DB insert fails
- DB write failures are ignored (best effort), next messages continue

## History API

- Query params:
  - `deviceId` (required)
  - `range` (optional, minutes, default `5`)
  - `series` (optional, default `voltage`)
- `series` accepts DB column names (e.g. `temp_tank_1`) and alias `voltage` (`voltage_battery`)
- Fixed aggregation bucket: 5 minutes
- Response points shape: `{ time, value }`

## Local Run

```bash
cd api
npm install
npm run build
npm run smoke
npm run start
```

## Example Requests

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" "http://localhost:3000/api/telemetry?deviceId=device-01&limit=50&offset=0"
curl -H "Authorization: Bearer YOUR_API_KEY" "http://localhost:3000/api/telemetry/history?deviceId=device-01&range=60&series=voltage"
```

