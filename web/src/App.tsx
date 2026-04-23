import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Toaster } from "@/components/ui/sonner.tsx"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import DashboardLayout from "@/components/layouts/dashboard-layout.tsx"
import Dashboard from "@/pages/dashboard.tsx"
import LogsPage from "@/pages/logs.tsx"
import { TelemetryProvider } from "@/contexts/telemetry-context.tsx"

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <TelemetryProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="/logs" element={<LogsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TelemetryProvider>
    </ThemeProvider>
  )
}

export default App
