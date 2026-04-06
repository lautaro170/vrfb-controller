"use client"

import { Card, CardContent } from "@/components/ui/card.tsx"

interface ConnectionIndicatorProps {
  isConnected: boolean
}

export function ConnectionIndicator({ isConnected }: ConnectionIndicatorProps) {
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs font-medium">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
} 