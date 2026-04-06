"use client"

import { cn } from "@/lib/utils.ts"
import { useEffect, useState } from "react"

type GaugeProps = {
  value: number
  max: number
  label?: string
  size?: "small" | "medium" | "large"
  showValue?: boolean
  color?: string
}

export function Gauge({ value, max, label, size = "medium", showValue = false, color = "#22c55e" }: GaugeProps) {
  const [displayValue, setDisplayValue] = useState(0)

  // Animación del valor
  useEffect(() => {
    const animationDuration = 500 // ms
    const steps = 20
    const stepDuration = animationDuration / steps
    const valueIncrement = (value - displayValue) / steps

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      if (currentStep >= steps) {
        setDisplayValue(value)
        clearInterval(interval)
      } else {
        setDisplayValue((prev) => prev + valueIncrement)
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [value])

  // Calcular el porcentaje y el ángulo para el gauge
  const percentage = (displayValue / max) * 100

  // Determinar el tamaño basado en la prop size
  const sizeClasses = {
    small: "w-24 h-12",
    medium: "w-32 h-16",
    large: "w-40 h-20",
  }

  return (
    <div className="flex flex-col items-center">
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        {/* Fondo del gauge (semicírculo) */}
        <svg className="w-full h-full" viewBox="0 0 100 50">
          <path
            d="M10,50 A40,40 0 0,1 90,50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted-foreground/30 dark:text-muted-foreground/20"
            strokeLinecap="round"
          />
          {/* Indicador del gauge (semicírculo) */}
          <path
            d="M10,50 A40,40 0 0,1 90,50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray="126"
            strokeDashoffset={126 - (percentage * 126) / 100}
            strokeLinecap="round"
          />
        </svg>

        {/* Valor en el centro */}
        {showValue && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span
              className={"font-bold text-foreground drop-shadow-lg text-md"}
            >
              {displayValue.toFixed(1)}
              {label && <span className="ml-1 text-xs">{label}</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
