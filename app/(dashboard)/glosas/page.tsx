import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, AlertCircle, Clock, FileSpreadsheet } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function GlosasPage() {
  const supabase = await createClient()

  // Obtener glosas con factura y EPS
  const { data: glosas, error } = await supabase
    .from('glosas')
    .select(`
      *,
      facturas_radicadas (
        numero_factura,
        entidades_eps (
          codigo,
          nombre
        )
      )
    `)
    .order('fecha_glosa', { ascending: false })

  if (error) {
    console.error('Error fetching glosas:', error)
  }

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numValue)
  }

  const getSemaforoBadge = (semaforo: string) => {
    const variants = {
      'verde': 'outline',
      'amarillo': 'default',
      'rojo': 'destructive',
      'negro': 'secondary'
    }
    return variants[semaforo as keyof typeof variants] || 'default'
  }

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'pendiente': 'destructive',
      'en_proceso': 'default',
      'resuelta': 'outline',
      'rechazada': 'secondary'
    }
    return variants[estado as keyof typeof variants] || 'default'
  }

  // Calcular estadísticas
  const totalGlosas = glosas?.length || 0
  const valorTotal = glosas?.reduce((acc: number, g: any) => acc + parseFloat(g.valor_glosado || 0), 0) || 0
  const glosasCriticas = glosas?.filter((g: any) => g.semaforo === 'rojo' || g.semaforo === 'negro').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Glosas</h1>
          <p className="text-muted-foreground">
            Administra y da seguimiento a todas las glosas del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/glosas/importar">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Importar Excel
            </Link>
          </Button>
          <Button asChild>
            <Link href="/glosas/nueva">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Glosa
            </Link>
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Glosas</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGlosas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Glosado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(valorTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Glosas Críticas</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{glosasCriticas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de glosas */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Glosas</CardTitle>
          <CardDescription>
            {totalGlosas} glosas registradas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>EPS</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Valor Glosado</TableHead>
                <TableHead>Semáforo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Glosa</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {glosas && glosas.length > 0 ? (
                glosas.map((glosa: any) => (
                  <TableRow key={glosa.id}>
                    <TableCell className="font-medium">{glosa.codigo_glosa}</TableCell>
                    <TableCell>{glosa.facturas_radicadas?.numero_factura || 'N/A'}</TableCell>
                    <TableCell>{glosa.facturas_radicadas?.entidades_eps?.nombre || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{glosa.descripcion}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(glosa.valor_glosado)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSemaforoBadge(glosa.semaforo) as any}>
                        {glosa.semaforo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEstadoBadge(glosa.estado) as any}>
                        {glosa.estado.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(glosa.fecha_glosa).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      {new Date(glosa.fecha_vencimiento).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/glosas/${glosa.id}`}>
                          Ver
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No hay glosas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
