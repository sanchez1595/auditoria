import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Clock, DollarSign, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Obtener estadísticas de glosas
  const { data: glosas, error } = await supabase
    .from('glosas')
    .select('*')

  const totalGlosas = glosas?.length || 0
  const valorTotal = glosas?.reduce((acc, g) => acc + parseFloat(g.valor_glosado || 0), 0) || 0

  const glosasPorSemaforo = {
    verde: glosas?.filter(g => g.semaforo === 'verde').length || 0,
    amarillo: glosas?.filter(g => g.semaforo === 'amarillo').length || 0,
    rojo: glosas?.filter(g => g.semaforo === 'rojo').length || 0,
    negro: glosas?.filter(g => g.semaforo === 'negro').length || 0,
  }

  const glosasCriticas = glosasPorSemaforo.rojo + glosasPorSemaforo.negro

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
            <div className="text-2xl font-bold">{totalGlosas}</div>
            <p className="text-xs text-muted-foreground">
              Glosas en el sistema
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
            <div className="text-2xl font-bold">
              ${(valorTotal / 1000000).toFixed(1)}M
            </div>
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
            <div className="text-2xl font-bold text-destructive">{glosasCriticas}</div>
            <p className="text-xs text-muted-foreground">
              Rojas y negras (urgentes)
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
                <span className="text-sm">{glosasPorSemaforo.verde} glosas ({totalGlosas > 0 ? ((glosasPorSemaforo.verde / totalGlosas) * 100).toFixed(0) : 0}%)</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-sm font-medium">Amarillo</div>
              <div className="flex-1 h-8 bg-yellow-500/20 rounded-md flex items-center px-3">
                <span className="text-sm">{glosasPorSemaforo.amarillo} glosas ({totalGlosas > 0 ? ((glosasPorSemaforo.amarillo / totalGlosas) * 100).toFixed(0) : 0}%)</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-sm font-medium">Rojo</div>
              <div className="flex-1 h-8 bg-red-500/20 rounded-md flex items-center px-3">
                <span className="text-sm">{glosasPorSemaforo.rojo} glosas ({totalGlosas > 0 ? ((glosasPorSemaforo.rojo / totalGlosas) * 100).toFixed(0) : 0}%)</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-sm font-medium">Negro</div>
              <div className="flex-1 h-8 bg-gray-900/20 rounded-md flex items-center px-3">
                <span className="text-sm">{glosasPorSemaforo.negro} glosas ({totalGlosas > 0 ? ((glosasPorSemaforo.negro / totalGlosas) * 100).toFixed(0) : 0}%)</span>
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
                <p className="font-medium">{glosasCriticas} glosas críticas</p>
                <p className="text-sm text-muted-foreground">Requieren atención inmediata</p>
              </div>
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <p className="font-medium">{totalGlosas} glosas totales</p>
                <p className="text-sm text-muted-foreground">En el sistema</p>
              </div>
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
