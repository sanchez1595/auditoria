import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, FileText, Calendar, DollarSign, Clock, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function DetalleGlosaPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Obtener glosa con factura y EPS
  const { data: glosa, error } = await supabase
    .from('glosas')
    .select(`
      *,
      facturas_radicadas (
        id,
        numero_factura,
        numero_lote,
        valor_total,
        cuv,
        estado,
        fecha_radicacion,
        entidades_eps (
          codigo,
          nombre,
          nit
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !glosa) {
    notFound()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getSemaforoBadge = (semaforo: string) => {
    const badges = {
      'verde': 'outline',
      'amarillo': 'default',
      'rojo': 'destructive',
      'negro': 'secondary'
    }
    return badges[semaforo as keyof typeof badges] || 'default'
  }

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'pendiente': 'destructive',
      'en_proceso': 'default',
      'resuelta': 'outline',
      'rechazada': 'secondary'
    }
    return badges[estado as keyof typeof badges] || 'default'
  }

  // Calcular días para vencimiento
  const hoy = new Date()
  const fechaVencimiento = new Date(glosa.fecha_vencimiento)
  const diasParaVencimiento = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/glosas">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Glosa {glosa.codigo_glosa}
          </h1>
          <p className="text-muted-foreground">
            Detalles de la glosa
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={getSemaforoBadge(glosa.semaforo) as any} className="text-sm">
            {glosa.semaforo}
          </Badge>
          <Badge variant={getEstadoBadge(glosa.estado) as any} className="text-sm">
            {glosa.estado.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información de la Glosa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Información de la Glosa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Código de Glosa</p>
              <p className="font-medium">{glosa.codigo_glosa}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Descripción</p>
              <p className="font-medium">{glosa.descripcion}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Valor Glosado</p>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(parseFloat(glosa.valor_glosado))}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <Badge variant={getEstadoBadge(glosa.estado) as any}>
                {glosa.estado.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Información de Fechas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fechas y Plazos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Glosa</p>
              <p className="font-medium">
                {new Date(glosa.fecha_glosa).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
              <p className="font-medium">
                {new Date(glosa.fecha_vencimiento).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Días para Vencimiento</p>
              <p className={`text-2xl font-bold ${
                diasParaVencimiento < 0 ? 'text-destructive' :
                diasParaVencimiento <= 5 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {diasParaVencimiento < 0 ? 'Vencida' : `${diasParaVencimiento} días`}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Semáforo</p>
              <Badge variant={getSemaforoBadge(glosa.semaforo) as any} className="text-base">
                {glosa.semaforo.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información de la Factura Asociada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Factura Asociada
          </CardTitle>
          <CardDescription>
            Información de la factura radicada relacionada con esta glosa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {glosa.facturas_radicadas ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Número de Factura</p>
                  <p className="font-medium">{glosa.facturas_radicadas.numero_factura}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">EPS</p>
                  <p className="font-medium">{glosa.facturas_radicadas.entidades_eps?.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    NIT: {glosa.facturas_radicadas.entidades_eps?.nit || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total Factura</p>
                  <p className="font-medium">
                    {formatCurrency(parseFloat(glosa.facturas_radicadas.valor_total))}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Número de Lote</p>
                  <p className="font-medium">{glosa.facturas_radicadas.numero_lote || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CUV</p>
                  <p className="font-medium">{glosa.facturas_radicadas.cuv || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Radicación</p>
                  <p className="font-medium">
                    {new Date(glosa.facturas_radicadas.fecha_radicacion).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button variant="outline" asChild>
                  <Link href={`/facturas/${glosa.facturas_radicadas.id}`}>
                    Ver Factura Completa
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay factura asociada a esta glosa
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
          <CardDescription>
            Gestiona el estado de la glosa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="default">
              Marcar como En Proceso
            </Button>
            <Button variant="outline">
              Marcar como Resuelta
            </Button>
            <Button variant="destructive">
              Rechazar Glosa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
