
Este documento es la knowledge base de todo lo relacionado a la configuración de este proyecto.

# Cómo ver el dashboard? (Raspberry Pi local)

1. Enchufar la raspberry pi.
2. Conectarse a la red WiFi PMCD usando la contraseña pmcd2025.
3. Ingresar a 10.10.10.1:80


# Cómo enviar información al dashboard? (Raspberry Pi local)
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

---

# Despliegue en DigitalOcean Droplet

## 1. Requisitos del droplet
- Ubuntu LTS limpio.
- 1 vCPU / 1 GB RAM (probado con este plan).
- Docker + Docker Compose plugin instalados.
- Swap de al menos 1-2 GB, porque construir las imágenes consume más de 1 GB de RAM:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
# Hacerlo permanente:
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 2. Preparar el servidor

```bash
git clone <este-repositorio>
cd vrfb-controller
cp .env.example .env
# Editar .env con contraseñas fuertes:
#   POSTGRES_PASSWORD, API_KEY
# MQTT_USER/MQTT_PASSWORD no se usan mientras mosquitto esté en modo anónimo.
```

## 3. Firewall

Con UFW (o el firewall de DigitalOcean) permitir solo:
- SSH (22)
- HTTP (80)
- MQTT (1883) — solo si el dispositivo de borde publica directamente al droplet.

No abrir nunca el puerto 5432 (Postgres) ni el 3000 (API) al público; ambos están
restringidos a localhost en `docker-compose.yaml`.

## 4. Levantar la aplicación

```bash
docker compose up -d --build
```

Ver logs:

```bash
docker compose logs -f
```

## 5. Ver el dashboard

Desde cualquier navegador:

```
http://<IP_DEL_DROPLET>
```

La clave de API se ingresa desde el panel lateral inferior izquierdo.

## 6. Enviar telemetría al droplet (modo anónimo temporal)

El dispositivo de borde debe publicar al broker Mosquitto del droplet:

- Host: `<IP_DEL_DROPLET>:1883`
- Topic: `vrfb/telemetry/{deviceId}`
- Payload: JSON con los campos de telemetría

Ejemplo con `mosquitto_pub`:

```bash
mosquitto_pub -h <IP_DEL_DROPLET> \
  -t "vrfb/telemetry/vrfb1" -m '{"voltage_battery":12.5,"current_battery":1.2,"temp_tank_1":25.3}'
```

**Importante:** mientras `mosquitto.conf` tenga `allow_anonymous true`, cualquiera puede
publicar al broker. Habilitar autenticación (ver sección 8) antes de dejar el droplet
expuesto a internet.

## 7. Notas importantes

- El frontend se sirve en el puerto 80 y el nginx interno redirige `/api` y `/socket.io`
  al contenedor de la API. No es necesario exponer el puerto 3000.
- Postgres usa la imagen estándar `postgres:16` (no Alpine) y solo escucha en localhost.
- Mosquitto está corriendo sin autenticación (`allow_anonymous true`) durante las pruebas.
- El `web/dist` antiguo de la Raspberry Pi ya no se usa: la imagen de nginx se construye
  en varias etapas desde el código fuente de React.

## 8. Habilitar autenticación en Mosquitto (antes de producción pública)

1. Generar el archivo de contraseñas:

```bash
docker run --rm -v ./mosquitto:/mosquitto/config eclipse-mosquitto:2 \
  mosquitto_passwd -c -b /mosquitto/config/passwords vrfb1 TU_CONTRASEÑA_MQTT
```

2. En `mosquitto/mosquitto.conf` cambiar:
   - `allow_anonymous true` → `allow_anonymous false`
   - Descomentar `password_file /mosquitto/config/passwords`

3. En `docker-compose.yaml` descomentar la línea del `passwords` volume mount.

4. En `.env` poner `MQTT_USER=vrfb1` y `MQTT_PASSWORD=TU_CONTRASEÑA_MQTT`.

5. Recrear mosquitto y api:

```bash
docker compose up -d --force-recreate mosquitto api
```

6. Configurar el dispositivo de borde con usuario y contraseña.
