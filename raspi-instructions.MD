
Este documento es la knowldege base de todo lo relacionado a la configuración de este proyecto. 

# Cómo ver el dashboard? 

1. Enchufar la raspberry pi.
2. Conectarse a la red WiFi PMCD usando la contraseña pmcd2025.
3. Ingresar a 10.10.10.1:80


# Cómo enviar información al dashboard?
1. Enchufar la raspberry pi.
2. Conectarse a la red WiFi PMCD usando la contraseña pmcd2025.
3. Enviar información al servidor MQTT de la raspi en 10.10.10.1:1883 con el topic vrfb/telemetry/{deviceId} y un payload JSON con los datos de telemetría. Por ejemplo:

```json
{
  "voltage_battery": 12.5,
  "current_battery": 1.2,
  "temp_tank_1": 25.3,
  "time": "2024-06-01T12:00:00Z"
}
```

# Datos de la raspi: 
- SSID: PMCD
- Contraseña: pmcd2025
- IP: 10.10.10.1
- Nombre: pmcd.local
- user: pmcd
- pass pmcd 