# VRFB Controller Server

Minimal backend for Vanadium Redox Flow Battery (VRFB) monitoring and control. Handles real-time telemetry via MQTT, persistent storage via SQLite, and live updates to the React dashboard via WebSockets.

## Architecture

- Runtime: Node.js (Alpine Docker image)
- Messaging: MQTT (Mosquitto bridge) & WebSockets (Socket.io)
- Storage: SQLite (`better-sqlite3`)
- API: Express.js

## Setup & Deployment

Ensure Docker and Docker Compose are installed on the Raspberry Pi (or target host).

Bash

```bash
# Build and start the stack
docker-compose up -d --build
```

## MQTT Interface (Local Broker)

The server communicates with the battery hardware and cloud bridge via these topics:

| Topic | Direction | Description |
|---|---:|---|
| `vrfb/telemetry` | Sub | Incoming sensor data (voltage, temperature, SoC, etc.) |
| `vrfb/commands` | Pub | Outgoing control signals (pump speed, relay state) |

Clients sending telemetry should publish JSON payloads to `vrfb/telemetry`. Control commands issued by this server are published to `vrfb/commands`.

## API Endpoints (REST)

Used for initial dashboard hydration and for manual overrides.

- GET `/api/latest`
  - Returns the most recent battery state stored in the database.
  - Response: `200 OK` with a JSON object containing the latest reading.

- POST `/api/command`
  - Sends a control command to the battery.
  - Payload example:

```json
{
  "command": "string",
  "value": 123
}
```

  - Action: Publishes the payload to the MQTT topic `vrfb/commands`.

## WebSockets (Real-time)

The server broadcasts every incoming MQTT telemetry message to connected React clients via Socket.io.

- Event: `telemetry_update`
- Payload: Mirror of the MQTT telemetry JSON (same structure as published to `vrfb/telemetry`).

Clients should listen for `telemetry_update` to receive live telemetry updates.

## Database Schema

The SQLite database is stored in `data/vrfb.db`.

Table: `readings`

| Column     | Type     | Notes |
|---|---|---|
| `id`        | INTEGER  | Primary Key |
| `timestamp` | DATETIME | Default: `CURRENT_TIMESTAMP` |
| `voltage`   | REAL     | Voltage reading |
| `temperature` | REAL   | Temperature reading |
| `soc`       | REAL     | State of Charge |
| `pump_speed`| INTEGER  | Pump speed (if available) |


## Maintenance

- View service logs:

```bash
docker-compose logs -f api
```

- Access the local SQLite database:

```bash
sqlite3 data/vrfb.db
```

---

If you want, I can also:
- add example MQTT payload schemas, or
- create a minimal `curl` example for the REST endpoints, or
- add a short `README.md` for the `api/` folder with these quickstart steps.




FALTA DECIDIR:
- Estructura en la que se van a mandar los mensajes desde el broker mqtt: Single topic o multiple topics (ej: `vrfb/telemetry/voltage`, `vrfb/telemetry/temperature`, etc.)
`- En consecuencia a lo anterior, la estructura de la base de datos.
`