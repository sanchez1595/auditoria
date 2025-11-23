import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, FileSpreadsheet, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ImportExcelForm } from "./import-form"

export default async function ImportarGlosasPage() {
  const supabase = await createClient()

  // Obtener lista de EPS para el selector
  const { data: eps } = await supabase
    .from('entidades_eps')
    .select('id, codigo, nombre')
    .eq('activo', true)
    .order('nombre', { ascending: true })

  // Obtener configuraciones existentes
  const { data: configuraciones } = await supabase
    .from('configuracion_eps')
    .select(`
      *,
      entidades_eps (
        codigo,
        nombre
      )
    `)

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
            Importación Masiva de Glosas
          </h1>
          <p className="text-muted-foreground">
            Carga glosas desde archivos Excel con mapeo configurable por EPS
          </p>
        </div>
      </div>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Instrucciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Paso 1:</strong> Selecciona la EPS de la que recibes el archivo
            </p>
            <p className="text-sm">
              <strong>Paso 2:</strong> Sube el archivo Excel (.xlsx) con las glosas
            </p>
            <p className="text-sm">
              <strong>Paso 3:</strong> El sistema parseará automáticamente según la configuración de la EPS
            </p>
            <p className="text-sm">
              <strong>Paso 4:</strong> Revisa la preview y confirma la importación
            </p>
          </div>

          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm font-medium mb-2">Formato esperado del Excel:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Primera fila: encabezados (se ignoran)</li>
              <li>Columnas requeridas: Número de factura, código de glosa, valor glosado, fecha de glosa</li>
              <li>El sistema intentará hacer matching automático con facturas existentes</li>
              <li>Si no hay configuración para la EPS, usará mapeo por defecto</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Configuraciones existentes */}
      {configuraciones && configuraciones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuraciones de Parser por EPS
            </CardTitle>
            <CardDescription>
              {configuraciones.length} EPS con configuración personalizada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {configuraciones.map((config: any) => (
                <div key={config.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{config.entidades_eps?.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Código: {config.entidades_eps?.codigo}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        Validación: {config.validacion_activa ? 'Activa' : 'Inactiva'}
                      </p>
                      {config.tolerancia_precio && (
                        <p className="text-muted-foreground">
                          Tolerancia: ±{config.tolerancia_precio}%
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario de importación */}
      <ImportExcelForm eps={eps || []} />
    </div>
  )
}
