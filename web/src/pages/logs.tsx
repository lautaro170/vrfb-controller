"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Input } from "@/components/ui/input.tsx"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx"
import { Badge } from "@/components/ui/badge.tsx"
import { Download, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx"

// Tipo para los registros de sensores
type SensorLog = {
  id: string
  timestamp: Date
  sensorId: string
  sensorType: "pressure" | "humidity" | "temperature"
  value: number
  status: "normal" | "warning" | "critical"
}

// Función para generar datos de ejemplo
const generateMockData = (count: number): SensorLog[] => {
  const logs: SensorLog[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - i * 1000 * 60 * 5) // Cada 5 minutos
    const sensorType = ["pressure", "humidity", "temperature"][Math.floor(Math.random() * 3)] as
      | "pressure"
      | "humidity"
      | "temperature"

    let value: number
    if (sensorType === "pressure") {
      value = 40 + Math.random() * 40
    } else if (sensorType === "humidity") {
      value = 30 + Math.random() * 50
    } else {
      value = 15 + Math.random() * 25
    }

    let status: "normal" | "warning" | "critical"
    if (sensorType === "pressure") {
      status = value > 70 ? "critical" : value > 60 ? "warning" : "normal"
    } else if (sensorType === "humidity") {
      status = value < 20 ? "critical" : value < 30 ? "warning" : "normal"
    } else {
      status = value > 35 ? "critical" : value > 30 ? "warning" : "normal"
    }

    logs.push({
      id: `log-${i}`,
      timestamp,
      sensorId: `sensor-${sensorType}-${Math.floor(Math.random() * 3) + 1}`,
      sensorType,
      value,
      status,
    })
  }

  return logs
}

export default function LogsPage() {
  // Estado para los datos y filtros
  const [logs, setLogs] = useState<SensorLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<SensorLog[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["pressure", "humidity", "temperature"])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["normal", "warning", "critical"])

  const logsPerPage = 10

  // Cargar datos de ejemplo
  useEffect(() => {
    setLogs(generateMockData(100))
  }, [])

  // Filtrar logs cuando cambian los filtros
  useEffect(() => {
    let filtered = logs

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.sensorId.toLowerCase().includes(searchTerm.toLowerCase()) || log.value.toString().includes(searchTerm),
      )
    }

    // Filtrar por tipo de sensor
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((log) => selectedTypes.includes(log.sensorType))
    }

    // Filtrar por estado
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((log) => selectedStatuses.includes(log.status))
    }

    setFilteredLogs(filtered)
    setCurrentPage(1) // Resetear a la primera página cuando cambian los filtros
  }, [logs, searchTerm, selectedTypes, selectedStatuses])

  // Calcular logs para la página actual
  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

  // Función para exportar a CSV
  const exportToCSV = () => {
    // Crear encabezados CSV
    const headers = ["ID", "Timestamp", "Sensor ID", "Sensor Type", "Value", "Status"]

    // Convertir datos a filas CSV
    const csvRows = filteredLogs.map((log) => [
      log.id,
      log.timestamp.toLocaleString(),
      log.sensorId,
      log.sensorType,
      log.value.toString(),
      log.status,
    ])

    // Combinar encabezados y filas
    const csvContent = headers.join(",") + "\n" + csvRows.map((row) => row.join(",")).join("\n")

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `sensor_logs_${new Date().toISOString()}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <Input
                placeholder="Buscar por ID o valor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Tipo de Sensor</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Tipo de Sensor</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={selectedTypes.includes("pressure")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTypes([...selectedTypes, "pressure"])
                      } else {
                        setSelectedTypes(selectedTypes.filter((t) => t !== "pressure"))
                      }
                    }}
                  >
                    Presión
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedTypes.includes("humidity")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTypes([...selectedTypes, "humidity"])
                      } else {
                        setSelectedTypes(selectedTypes.filter((t) => t !== "humidity"))
                      }
                    }}
                  >
                    Humedad
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedTypes.includes("temperature")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTypes([...selectedTypes, "temperature"])
                      } else {
                        setSelectedTypes(selectedTypes.filter((t) => t !== "temperature"))
                      }
                    }}
                  >
                    Temperatura
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Estado</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Estado</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={selectedStatuses.includes("normal")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStatuses([...selectedStatuses, "normal"])
                      } else {
                        setSelectedStatuses(selectedStatuses.filter((s) => s !== "normal"))
                      }
                    }}
                  >
                    Normal
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedStatuses.includes("warning")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStatuses([...selectedStatuses, "warning"])
                      } else {
                        setSelectedStatuses(selectedStatuses.filter((s) => s !== "warning"))
                      }
                    }}
                  >
                    Advertencia
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedStatuses.includes("critical")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStatuses([...selectedStatuses, "critical"])
                      } else {
                        setSelectedStatuses(selectedStatuses.filter((s) => s !== "critical"))
                      }
                    }}
                  >
                    Crítico
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" className="flex items-center gap-2" onClick={exportToCSV}>
                <Download className="h-4 w-4" />
                <span>Exportar CSV</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableCaption>
              Mostrando {indexOfFirstLog + 1} a {Math.min(indexOfLastLog, filteredLogs.length)} de {filteredLogs.length}{" "}
              registros
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>ID del Sensor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.timestamp.toLocaleString()}</TableCell>
                  <TableCell>{log.sensorId}</TableCell>
                  <TableCell>
                    {log.sensorType === "pressure"
                      ? "Presión"
                      : log.sensorType === "humidity"
                        ? "Humedad"
                        : "Temperatura"}
                  </TableCell>
                  <TableCell>
                    {log.value.toFixed(2)}{" "}
                    {log.sensorType === "pressure" ? "PSI" : log.sensorType === "humidity" ? "%" : "°C"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.status === "critical" ? "destructive" : log.status === "warning" ? "secondary" : "default"
                      }
                    >
                      {log.status === "critical" ? "Crítico" : log.status === "warning" ? "Advertencia" : "Normal"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}

              {currentLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No se encontraron registros con los filtros aplicados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
          Anterior
        </Button>
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
