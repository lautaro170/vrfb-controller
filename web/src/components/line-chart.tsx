"use client"

import { useEffect, useRef } from "react"

type LineChartProps = {
  data: number[]
  color?: string
  height?: number
}

export function LineChart({ data, color = "#3b82f6", height = 120 }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (data.length < 2) return

    // Encontrar los valores mínimos y máximos para escalar
    const minValue = Math.min(...data) * 0.9
    const maxValue = Math.max(...data) * 1.1

    // Calcular dimensiones
    const padding = 10
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2

    // Dibujar la línea
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2

    // Mover al primer punto
    const xStep = chartWidth / (data.length - 1)

    data.forEach((value, index) => {
      const x = padding + index * xStep
      const normalizedValue = (value - minValue) / (maxValue - minValue)
      const y = canvas.height - padding - normalizedValue * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Área bajo la curva con gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, `${color}40`) // 25% opacidad
    gradient.addColorStop(1, `${color}00`) // 0% opacidad

    ctx.lineTo(padding + (data.length - 1) * xStep, canvas.height - padding)
    ctx.lineTo(padding, canvas.height - padding)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
  }, [data, color])

  return <canvas ref={canvasRef} width={300} height={height} className="w-full h-full" />
}
