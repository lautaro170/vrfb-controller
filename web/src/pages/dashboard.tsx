"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { Gauge } from "@/components/gauge.tsx"
import { Thermometer } from "lucide-react"
import mqtt from 'mqtt'
import { useConnection } from "@/contexts/connection-context.tsx"

  const topics = ["pamb", "temp", "hum", "pdif", "pabs1", "pabs2", "pabs3", "fanduty"]


export default function Dashboard() {
  // Estado para la temperatura
  const [temperature, setTemperature] = useState<number>(0)
  // Estado para la humedad
  const [humidity, setHumidity] = useState<number>(0)
  // Estado para presión ambiente
  const [pressureAmb, setPressureAmb] = useState<number>(0)
  // Estado para presión diferencial
  const [pressureDif, setPressureDif] = useState<number>(0)
  // Estado para presiones absolutas (3 sensores)
  const [pressureAbs, setPressureAbs] = useState<number[]>([0, 0, 0])
  // Estado para ciclo de trabajo del ventilador
  const [fanDutyCycle, setFanDutyCycle] = useState<number>(0)
  // Estado de conexión desde el contexto
  const { isConnected, setIsConnected } = useConnection()
  // Estado para debugging
  const [debugInfo, setDebugInfo] = useState<{messages: number, lastTopic?: string, lastValue?: string}>({messages: 0})

  useEffect(() => {
    // Conectar al broker MQTT
    const brokerHost = import.meta.env.DEV ? 'pmcd.local' : window.location.hostname
    const brokerPort = 30091
    const brokerUrl = `ws://${brokerHost}:${brokerPort}`

    console.log('🔌 Intentando conectar a:', brokerUrl)
    const client = mqtt.connect(brokerUrl, {
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    })

    client.on('connect', () => {
      console.log('✅ Conectado al broker MQTT en:', brokerUrl)
      setIsConnected(true)
      // Suscribirse a todos los tópicos (sin prefijo y con prefijo pmcd/)
      const allTopics = [
        ...topics,
        ...topics.map(t => `pmcd/${t}`)
      ]
      console.log('📡 Suscribiéndose a tópicos:', allTopics)
      client.subscribe(allTopics, (err) => {
        if (err) {
          console.error('❌ Error al suscribirse a los tópicos:', err)
        } else {
          console.log('✅ Suscripción exitosa a', allTopics.length, 'tópicos')
        }
      })
    })

    client.on('reconnect', () => {
      console.log('Reconectando al broker MQTT...')
      // No cambiar el estado aquí, esperar a que se complete la reconexión
    })

    client.on('offline', () => {
      console.log('Cliente MQTT desconectado')
      setIsConnected(false)
    })

    client.on('close', () => {
      console.log('Conexión MQTT cerrada')
      // Solo marcar como desconectado si realmente está desconectado
      if (!client.connected) {
        setIsConnected(false)
      }
    })

    client.on('disconnect', () => {
      console.log('Desconectado del broker MQTT')
      setIsConnected(false)
    })

    client.on('error', (error) => {
      console.error('Error en la conexión MQTT:', error)
      // Solo marcar como desconectado si realmente está desconectado
      if (!client.connected) {
        setIsConnected(false)
      }
    })

    client.on('message', (topic, message) => {
      // Si estamos recibiendo mensajes, definitivamente estamos conectados
      // Verificar el estado real del cliente para sincronizar el indicador
      if (client.connected) {
        setIsConnected(true)
      }
      
      const data = message.toString()
      console.log('📨 Mensaje recibido - Tópico:', topic, 'Datos:', data)
      
      // Actualizar información de debug
      setDebugInfo(prev => ({
        messages: prev.messages + 1,
        lastTopic: topic,
        lastValue: data
      }))
      
      // Extraer el nombre del tópico sin prefijo pmcd/ si existe
      const topicName = topic.startsWith('pmcd/') ? topic.replace('pmcd/', '') : topic
      
      // Intentar parsear como JSON primero, si falla usar como número directo
      let numericValue: number
      try {
        const jsonData = JSON.parse(data)
        // Si es JSON, extraer el valor
        if (typeof jsonData === 'object' && jsonData !== null && 'value' in jsonData) {
          numericValue = Number(jsonData.value)
        } else if (typeof jsonData === 'number') {
          numericValue = jsonData
        } else {
          numericValue = Number(data)
        }
      } catch {
        // No es JSON, intentar parsear como número directo
        numericValue = Number(data)
      }
      
      // Validar que el valor sea un número válido
      if (isNaN(numericValue)) {
        console.warn('⚠️ Valor no numérico recibido en tópico', topic, ':', data)
        return
      }
      
      console.log('✅ Valor procesado:', topicName, '=', numericValue)
      
      switch (topicName) {
        case 'pamb':
          setPressureAmb(numericValue)
          break
        case 'temp':
          setTemperature(numericValue)
          break
        case 'hum':
          setHumidity(numericValue)
          break
        case 'pdif':
          setPressureDif(numericValue)
          break
        case 'pabs1':
          setPressureAbs(prev => [numericValue, prev[1], prev[2]])
          break
        case 'pabs2':
          setPressureAbs(prev => [prev[0], numericValue, prev[2]])
          break
        case 'pabs3':
          setPressureAbs(prev => [prev[0], prev[1], numericValue])
          break
        case 'fanduty':
          setFanDutyCycle(numericValue)
          break
        default:
          console.log('⚠️ Tópico desconocido:', topic, '(nombre procesado:', topicName, ')')
      }
    })

    // Verificación periódica del estado de conexión para mantener sincronizado el indicador
    const connectionCheckInterval = setInterval(() => {
      // Actualizar el estado basado en el estado real del cliente
      setIsConnected(client.connected)
    }, 1000) // Verificar cada segundo

    // Limpiar la conexión al desmontar el componente
    return () => {
      clearInterval(connectionCheckInterval)
      client.end()
    }
  }, [setIsConnected])

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Indicador de estado de conexión */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 dark:bg-green-500' : 'bg-red-500 dark:bg-red-500'}`}></div>
              <span className="text-sm font-medium text-foreground">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            {debugInfo.messages > 0 && (
              <div className="text-xs text-muted-foreground">
                Mensajes recibidos: {debugInfo.messages} | Último: {debugInfo.lastTopic} = {debugInfo.lastValue}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Grid principal para las cards de sensores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Card para temperatura */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Temperatura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                  <Thermometer className="h-6 w-6 text-orange-600 dark:text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Temperatura</p>
                  <h3 className="text-2xl font-bold text-foreground">{temperature.toFixed(1)}°C</h3>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card para humedad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Humedad Relativa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full flex items-center justify-center w-12 h-12">
                  <span className="text-2xl leading-none">💧</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Humedad Relativa</p>
                  <h3 className="text-2xl font-bold text-foreground">{humidity.toFixed(1)}%</h3>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card para presión ambiente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Presión Ambiente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full flex items-center justify-center w-12 h-12">
                  <span className="text-2xl leading-none">📊</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Presión Ambiente</p>
                  <h3 className="text-2xl font-bold text-foreground">{pressureAmb.toFixed(1)} hPa</h3>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card para presión diferencial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Presión Diferencial</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full flex items-center justify-center w-12 h-12">
                  <span className="text-2xl leading-none">⚡</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Presión Diferencial</p>
                  <h3 className="text-2xl font-bold text-foreground">{pressureDif.toFixed(1)} Pa</h3>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card para ciclo de trabajo del ventilador */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Ventilador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full flex items-center justify-center w-12 h-12">
                  <span className="text-2xl leading-none">🌀</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ciclo de Trabajo (PWM)</p>
                  <h3 className="text-2xl font-bold text-foreground">{fanDutyCycle}%</h3>
                </div>
              </div>
            </div>
            {/* Barra de progreso visual */}
            <div className="w-full bg-muted rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, fanDutyCycle))}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      </div>

      {/* Card para presiones absolutas - ocupa ancho completo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Presiones Absolutas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pressureAbs.map((pressure, index) => (
              <div key={`pabs-${index}`} className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-4">Sensor {index + 1}</p>
                <Gauge
                  value={pressure}
                  max={100}
                  label="Pa"
                  size="medium"
                  showValue
                  color="#3b82f6"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
