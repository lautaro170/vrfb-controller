import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"

type ApiKeyRequiredProps = {
  invalid?: boolean
}

export function ApiKeyRequired({ invalid = false }: ApiKeyRequiredProps) {
  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>API key requerida</CardTitle>
        <CardDescription>
          {invalid
            ? "La API key no es valida. Ingresa una API key valida desde el panel lateral para continuar."
            : "Ingresa una API key valida desde el panel lateral para acceder a la telemetria."}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        El dashboard y los registros quedan ocultos hasta que la autenticacion sea correcta.
      </CardContent>
    </Card>
  )
}

