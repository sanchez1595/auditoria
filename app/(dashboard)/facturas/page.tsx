import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function FacturasPage() {
  const supabase = await createClient()

  // Obtener facturas con información de EPS
  const { data: facturas, error } = await supabase
    .from('facturas_radicadas')
    .select(`
      *,
      entidades_eps (
        codigo,
        nombre
      )
    `)
    .order('created_at', { ascending: false })

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Radicaciones</h1>
          <p className="text-muted-foreground">
            Gestión de facturas radicadas ante las EPS
          </p>
        </div>
        <Button asChild>
          <Link href="/facturas/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Radicación
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facturas Radicadas</CardTitle>
          <CardDescription>
            Total: {facturas?.length || 0} radicaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Factura</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>EPS</TableHead>
                <TableHead>Fecha Radicación</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturas && facturas.length > 0 ? (
                facturas.map((factura) => (
                  <TableRow key={factura.id}>
                    <TableCell className="font-medium">
                      {factura.numero_factura}
                    </TableCell>
                    <TableCell>{factura.numero_lote}</TableCell>
                    <TableCell>
                      {factura.entidades_eps?.nombre || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {new Date(factura.fecha_radicacion).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(parseFloat(factura.valor_total))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEstadoBadge(factura.estado) as any}>
                        {factura.estado.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/facturas/${factura.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay facturas radicadas aún.
                    <br />
                    <Button variant="link" asChild className="mt-2">
                      <Link href="/facturas/nueva">
                        Crear primera radicación
                      </Link>
                    </Button>
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
