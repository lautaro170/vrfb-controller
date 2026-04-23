import { useEffect, useState } from "react"
import { KeyRound } from "lucide-react"
import { Badge } from "@/components/ui/badge.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Input } from "@/components/ui/input.tsx"
import { useTelemetry } from "@/contexts/telemetry-context.tsx"

const STATUS_LABEL: Record<string, string> = {
  missing: "Falta key",
  validating: "Validando",
  valid: "Conectado",
  invalid: "Invalida",
}

export function ApiKeyPanel() {
  const { apiKey, setApiKey, authStatus } = useTelemetry()
  const [draft, setDraft] = useState(apiKey)

  useEffect(() => {
    setDraft(apiKey)
  }, [apiKey])

  return (
    <div className="space-y-2 rounded-lg border border-sidebar-border p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <KeyRound className="h-4 w-4" />
          <span>API key</span>
        </div>
        <Badge variant={authStatus === "invalid" ? "destructive" : "secondary"}>{STATUS_LABEL[authStatus]}</Badge>
      </div>
      <Input
        type="password"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Ingresa tu API key"
      />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => setApiKey(draft)}>
          Guardar
        </Button>
        <Button size="sm" variant="outline" onClick={() => setApiKey("")}>
          Limpiar
        </Button>
      </div>
    </div>
  )
}

