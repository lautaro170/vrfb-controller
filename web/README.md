# PMCD Monitoring Dashboard

This dashboard provides a web interface for real-time monitoring of PMCD system sensors.

## Features

- Real-time sensor data visualization
- Configurable pressure gauge
- Historical value graph
- Status indicators (normal, warning, critical)
- Temperature monitoring

## Requirements

- Node.js 18 or higher
- npm or yarn
- MQTT Broker (Mosquitto)

## Installation

1. Install dependencies:
```bash
cd dashboard
npm install
```

2. Configure environment variables:
Create a `.env.local` file with:
```
NEXT_PUBLIC_MQTT_BROKER=ws://localhost:9001
```

## Development

To start the development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

## Project Structure

```
dashboard/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/         # Application pages
│   └── lib/           # Utilities and configurations
├── public/            # Static files
└── package.json       # Dependencies and scripts
```

## MQTT Topics

The dashboard subscribes to the following topics:

- `pmcd/pressure/1`: Pressure sensor data
  ```json
  {
    "value": 123456,  // value in pascals
    "time": "2024-03-21T12:34:56Z"  // ISO timestamp
  }
  ```

- `pmcd/temp`: Temperature data
  ```json
  {
    "value": 25.5,    // value in Celsius
    "time": "2024-03-21T12:34:56Z"  // ISO timestamp
  }
  ```

## Pressure Configuration

The dashboard allows configuration of:
- Minimum pressure (Pa)
- Maximum pressure (Pa, default 200,000)

States are automatically determined:
- Normal: < 80% of range
- Warning: 80-90% of range
- Critical: > 90% of range

## Production Build

To build the application for production:
```bash
npm run build
```

To start the production version:
```bash
npm start
```
