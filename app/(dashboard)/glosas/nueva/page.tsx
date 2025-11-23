import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { crearGlosa } from "./actions"

export default async function NuevaGlosaPage() {
  const supabase = await createClient()

  // Obtener facturas para el selector
  const { data: facturas } = await supabase
    .from('facturas_radicadas')
    .select(`
      id,
      numero_factura,
      entidades_eps (
        nombre
      )
    `)
    .order('created_at', { ascending: false })

  // Obtener códigos de glosa del catálogo
  const { data: codigosGlosa } = await supabase
    .from('catalogos_codigos_glosa')
    .select('id, codigo, descripcion, categoria')
    .order('codigo', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/glosas">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Glosa</h1>
          <p className="text-muted-foreground">
            Registra una nueva glosa en el sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Glosa</CardTitle>
          <CardDescription>
            Completa todos los campos obligatorios para registrar la glosa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={crearGlosa} className="space-y-6">
            {/* Factura */}
            <div className="space-y-2">
              <Label htmlFor="factura_id">
                Factura Asociada <span className="text-destructive">*</span>
              </Label>
              <Select name="factura_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una factura" />
                </SelectTrigger>
                <SelectContent>
                  {facturas?.map((factura: any) => (
                    <SelectItem key={factura.id} value={factura.id}>
                      {factura.numero_factura} - {factura.entidades_eps?.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Código de Glosa */}
            <div className="space-y-2">
              <Label htmlFor="codigo_glosa_catalogo_id">
                Código de Glosa <span className="text-destructive">*</span>
              </Label>
              <Select name="codigo_glosa_catalogo_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el código de glosa" />
                </SelectTrigger>
                <SelectContent>
                  {codigosGlosa?.map((codigo: any) => (
                    <SelectItem key={codigo.id} value={codigo.id}>
                      {codigo.codigo} - {codigo.descripcion} ({codigo.categoria})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                El código de glosa se tomará del catálogo seleccionado
              </p>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                placeholder="Describe detalladamente la glosa..."
                required
                rows={4}
              />
            </div>

            {/* Valor Glosado */}
            <div className="space-y-2">
              <Label htmlFor="valor_glosado">
                Valor Glosado (COP) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="valor_glosado"
                name="valor_glosado"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Fecha de Glosa */}
              <div className="space-y-2">
                <Label htmlFor="fecha_glosa">
                  Fecha de Glosa <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fecha_glosa"
                  name="fecha_glosa"
                  type="date"
                  required
                />
              </div>

              {/* Fecha de Vencimiento */}
              <div className="space-y-2">
                <Label htmlFor="fecha_vencimiento">
                  Fecha de Vencimiento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fecha_vencimiento"
                  name="fecha_vencimiento"
                  type="date"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  El semáforo se calculará automáticamente según esta fecha
                </p>
              </div>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado">
                Estado <span className="text-destructive">*</span>
              </Label>
              <Select name="estado" defaultValue="pendiente" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="resuelta">Resuelta</SelectItem>
                  <SelectItem value="rechazada">Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botones */}
            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href="/glosas">
                  Cancelar
                </Link>
              </Button>
              <Button type="submit">
                Crear Glosa
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
