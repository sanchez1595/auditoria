import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { crearRadicacion } from "./actions"

export default async function NuevaRadicacionPage() {
  const supabase = await createClient()

  // Obtener lista de EPS
  const { data: eps } = await supabase
    .from('entidades_eps')
    .select('id, codigo, nombre')
    .eq('activo', true)
    .order('nombre')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/facturas">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Radicación</h1>
          <p className="text-muted-foreground">
            Crear una nueva factura radicada ante la EPS
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Radicación</CardTitle>
          <CardDescription>
            Complete los datos de la factura a radicar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={crearRadicacion} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* EPS */}
              <div className="space-y-2">
                <Label htmlFor="eps_id">EPS *</Label>
                <Select name="eps_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una EPS" />
                  </SelectTrigger>
                  <SelectContent>
                    {eps?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Número de Factura */}
              <div className="space-y-2">
                <Label htmlFor="numero_factura">Número de Factura *</Label>
                <Input
                  id="numero_factura"
                  name="numero_factura"
                  placeholder="FAC-2024-0001"
                  required
                />
              </div>

              {/* Número de Lote */}
              <div className="space-y-2">
                <Label htmlFor="numero_lote">Número de Lote</Label>
                <Input
                  id="numero_lote"
                  name="numero_lote"
                  placeholder="LOTE-NOV-01"
                />
              </div>

              {/* Fecha de Radicación */}
              <div className="space-y-2">
                <Label htmlFor="fecha_radicacion">Fecha de Radicación *</Label>
                <Input
                  id="fecha_radicacion"
                  name="fecha_radicacion"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Valor Total */}
              <div className="space-y-2">
                <Label htmlFor="valor_total">Valor Total (COP) *</Label>
                <Input
                  id="valor_total"
                  name="valor_total"
                  type="number"
                  step="0.01"
                  placeholder="1000000"
                  required
                />
              </div>

              {/* CUV */}
              <div className="space-y-2">
                <Label htmlFor="cuv">CUV (Código Único de Validación)</Label>
                <Input
                  id="cuv"
                  name="cuv"
                  placeholder="CUV-123456"
                />
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href="/facturas">
                  Cancelar
                </Link>
              </Button>
              <Button type="submit">
                Crear Radicación
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
