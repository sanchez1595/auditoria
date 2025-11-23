import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Upload, FileText, FileJson, FileCode, File, Check, X } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { UploadDocumentForm } from "./upload-form"

export default async function DocumentosFacturaPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Obtener factura
  const { data: factura, error } = await supabase
    .from('facturas_radicadas')
    .select(`
      *,
      entidades_eps (
        codigo,
        nombre,
        nit
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

  // Determinar qué documentos ya están cargados
  const documentos = {
    rips: !!factura.rips_json_url,
    fev: !!factura.fev_xml_url,
    cuv: !!factura.certificado_url,
    soportes: factura.soportes_urls?.length || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/facturas/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de Documentos
          </h1>
          <p className="text-muted-foreground">
            Factura {factura.numero_factura} - {factura.entidades_eps?.nombre}
          </p>
        </div>
      </div>

      {/* Resumen de Factura */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Factura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Número de Factura</p>
              <p className="font-medium">{factura.numero_factura}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lote</p>
              <p className="font-medium">{factura.numero_lote || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="font-medium">{formatCurrency(parseFloat(factura.valor_total))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CUV</p>
              <p className="font-medium">{factura.cuv || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Documentos</CardTitle>
          <CardDescription>
            Resumen de los documentos cargados para esta factura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileJson className={`h-8 w-8 ${documentos.rips ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">RIPS JSON</p>
                  <p className="text-xs text-muted-foreground">Obligatorio</p>
                </div>
              </div>
              {documentos.rips ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-destructive" />
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileCode className={`h-8 w-8 ${documentos.fev ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">FEV XML</p>
                  <p className="text-xs text-muted-foreground">Obligatorio</p>
                </div>
              </div>
              {documentos.fev ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-destructive" />
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className={`h-8 w-8 ${documentos.cuv ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">CUV</p>
                  <p className="text-xs text-muted-foreground">Obligatorio</p>
                </div>
              </div>
              {documentos.cuv ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-destructive" />
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <File className={`h-8 w-8 ${documentos.soportes > 0 ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">Soportes</p>
                  <p className="text-xs text-muted-foreground">
                    {documentos.soportes} archivo{documentos.soportes !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {documentos.soportes > 0 ? (
                <Badge variant="outline">{documentos.soportes}</Badge>
              ) : (
                <X className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formularios de Upload */}
      <UploadDocumentForm facturaId={params.id} documentosExistentes={documentos} />

      {/* Documentos Actuales */}
      {(factura.rips_json_url || factura.fev_xml_url || factura.certificado_url || factura.soportes_urls?.length) && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos Cargados</CardTitle>
            <CardDescription>
              Archivos disponibles para esta factura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {factura.rips_json_url && (
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <FileJson className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">RIPS JSON</p>
                    <p className="text-xs text-muted-foreground">{factura.rips_json_url}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm">
                    Descargar
                  </Button>
                </div>
              </div>
            )}

            {factura.fev_xml_url && (
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <FileCode className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">FEV XML</p>
                    <p className="text-xs text-muted-foreground">{factura.fev_xml_url}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm">
                    Descargar
                  </Button>
                </div>
              </div>
            )}

            {factura.certificado_url && (
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">CUV / Certificado</p>
                    <p className="text-xs text-muted-foreground">{factura.certificado_url}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm">
                    Descargar
                  </Button>
                </div>
              </div>
            )}

            {factura.soportes_urls && factura.soportes_urls.map((url: string, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Soporte #{index + 1}</p>
                    <p className="text-xs text-muted-foreground">{url}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm">
                    Descargar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
