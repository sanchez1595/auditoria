import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Clock, DollarSign, FileText } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del sistema de gestión de glosas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Glosas
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">577</div>
            <p className="text-xs text-muted-foreground">
              Glosas pendientes de respuesta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor en Riesgo
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$354.5M</div>
            <p className="text-xs text-muted-foreground">
              COP en glosas pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Glosas Críticas
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">151</div>
            <p className="text-xs text-muted-foreground">
              Vencen en 1-3 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tiempo Promedio
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">60 min</div>
            <p className="text-xs text-muted-foreground">
              Por glosa (objetivo: 5 min)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Semáforo de Glosas</CardTitle>
            <CardDescription>
              Distribución por urgencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <div className="w-32 text-sm font-medium">Verde</div>
              <div className="flex-1 h-8 bg-green-500/20 rounded-md flex items-center px-3">
                <span className="text-sm">120 glosas (21%)</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-sm font-medium">Amarillo</div>
              <div className="flex-1 h-8 bg-yellow-500/20 rounded-md flex items-center px-3">
                <span className="text-sm">189 glosas (33%)</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-sm font-medium">Rojo</div>
              <div className="flex-1 h-8 bg-red-500/20 rounded-md flex items-center px-3">
                <span className="text-sm">151 glosas (26%)</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-sm font-medium">Negro</div>
              <div className="flex-1 h-8 bg-gray-900/20 rounded-md flex items-center px-3">
                <span className="text-sm">117 glosas (20%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Tareas prioritarias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <p className="font-medium">151 glosas críticas</p>
                <p className="text-sm text-muted-foreground">Requieren atención inmediata</p>
              </div>
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <p className="font-medium">Sistema de validación</p>
                <p className="text-sm text-muted-foreground">Listo para usar</p>
              </div>
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
