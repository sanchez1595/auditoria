import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, FileText, Calendar, DollarSign } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function DetalleFacturaPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Obtener factura con EPS y glosas
  const { data: factura, error } = await supabase
    .from('facturas_radicadas')
    .select(`
      *,
      entidades_eps (
        codigo,
        nombre,
        nit
      ),
      glosas (
        id,
        codigo_glosa,
        descripcion,
        valor_glosado,
        fecha_glosa,
        fecha_vencimiento,
        semaforo,
        estado
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !factura) {
    notFound()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'radicada': 'default',
      'aceptada': 'outline',
      'con_glosas': 'destructive',
      'resuelta': 'secondary'
    }
    return badges[estado as keyof typeof badges] || 'default'
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

  const totalGlosado = factura.glosas?.reduce((acc: number, g: any) => acc + parseFloat(g.valor_glosado), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/facturas">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Factura {factura.numero_factura}
          </h1>
          <p className="text-muted-foreground">
            Detalles de la radicación
          </p>
        </div>
        <Badge variant={getEstadoBadge(factura.estado) as any} className="text-sm">
          {factura.estado.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Número de Factura</p>
              <p className="font-medium">{factura.numero_factura}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Número de Lote</p>
              <p className="font-medium">{factura.numero_lote || 'N/A'}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">EPS</p>
              <p className="font-medium">{factura.entidades_eps?.nombre}</p>
              <p className="text-xs text-muted-foreground">
                NIT: {factura.entidades_eps?.nit || 'N/A'}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">CUV</p>
              <p className="font-medium">{factura.cuv || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Información Financiera */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Información Financiera
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor Total Facturado</p>
              <p className="text-2xl font-bold">
                {formatCurrency(parseFloat(factura.valor_total))}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Valor Glosado</p>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(totalGlosado)}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Valor Neto</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(parseFloat(factura.valor_total) - totalGlosado)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Glosas */}
      <Card>
        <CardHeader>
          <CardTitle>Glosas Asociadas</CardTitle>
          <CardDescription>
            {factura.glosas?.length || 0} glosas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {factura.glosas && factura.glosas.length > 0 ? (
            <div className="space-y-4">
              {factura.glosas.map((glosa: any) => (
                <div key={glosa.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Código: {glosa.codigo_glosa}</p>
                      <Badge variant={getSemaforoBadge(glosa.semaforo) as any}>
                        {glosa.semaforo}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {glosa.descripcion}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span>
                        Fecha glosa: {new Date(glosa.fecha_glosa).toLocaleDateString('es-CO')}
                      </span>
                      <span>
                        Vencimiento: {new Date(glosa.fecha_vencimiento).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-destructive">
                      {formatCurrency(parseFloat(glosa.valor_glosado))}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {glosa.estado}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay glosas asociadas a esta factura
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
