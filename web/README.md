# UI Architecture: VRFB Dashboard Screens

Framework: React + shadcn/ui + Recharts + TanStack Table

## 1. Screen: / (Operacion / Dashboard)

Purpose: Main command center for real-time monitoring.

### Data shown

- **Top priority:** Battery Voltage (V), Battery Current (A), Tank 1 Temp, Tank 2 Temp.
- **Electrical:** Battery Voltage (V), Battery Current (A).
- **Thermal:** Tank 1 Temp, Tank 2 Temp, Ambient Temp, Ambient Humidity.
- **Chemical:** Conductivity 1, Conductivity 2.
- **Mechanical:** Pump 1 RPM, Pump 2 RPM.
- **Solar (read-only):** Solar Voltage (V), Solar Current (A), Total Energy Harvested (Wh), and new solar fields as they become available.

### Components used

- `Card` (shadcn): metric cards and section containers.
- Reusable metric card: supports `min` and `max` thresholds and applies `border-destructive` when out of range.
- Connection indicator: socket status + current bound device (`vrfb1`).
- Missing values: keeps last known valid value; shows `-` for `undefined`, `null`, or `NaN`.
- Command controls are omitted for now.

## 2. Screen: /logs (Registro y Datos)

Purpose: Historical telemetry review for the same device.

### Data shown

- Last X telemetry rows from backend `GET /api/telemetry`.
- Live updates merged from websocket stream.
- Dynamic columns based on available telemetry fields.

### Components used

- `Table` (shadcn): paginated telemetry rows.
- `Button` (shadcn): manual refresh and pagination controls.

## API Key Gate (Shared)

Both `/` and `/logs` require a valid API key:

- API key is entered from the bottom-left sidebar panel.
- API key is persisted locally in browser storage.
- If API key is missing or invalid, telemetry UI is hidden and replaced by the same prompt section.
- Backend auth format: `Authorization: Bearer <API_KEY>` for HTTP and socket auth token.

## Data Source

- Initial hydration and table data: `GET /api/telemetry`.
- Real-time stream: Socket.io event `telemetry_update`.
- Device binding: fixed to `vrfb1`.
