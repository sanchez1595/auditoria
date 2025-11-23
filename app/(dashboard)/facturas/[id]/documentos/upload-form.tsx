'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { uploadDocument } from './actions'

interface UploadDocumentFormProps {
  facturaId: string
  documentosExistentes: {
    rips: boolean
    fev: boolean
    cuv: boolean
    soportes: number
  }
}

export function UploadDocumentForm({ facturaId, documentosExistentes }: UploadDocumentFormProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadType, setUploadType] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleUpload = async (formData: FormData, type: string) => {
    setUploading(true)
    setUploadType(type)
    setMessage(null)

    try {
      const result = await uploadDocument(formData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `${type} subido exitosamente` })
        // Reload the page to show updated documents
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al subir el archivo' })
    } finally {
      setUploading(false)
      setUploadType(null)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Upload RIPS JSON */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            RIPS JSON
          </CardTitle>
          <CardDescription>
            Archivo JSON con los Registros Individuales de Prestación de Servicios (Resolución 1036/2022)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={(formData) => handleUpload(formData, 'RIPS')} className="space-y-4">
            <input type="hidden" name="factura_id" value={facturaId} />
            <input type="hidden" name="tipo_documento" value="rips" />

            <div className="space-y-2">
              <Label htmlFor="rips-file">
                Archivo RIPS (JSON) {documentosExistentes.rips && '- Reemplazar archivo existente'}
              </Label>
              <Input
                id="rips-file"
                name="file"
                type="file"
                accept=".json,application/json"
                required
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Tamaño máximo: 50MB. Solo archivos .json
              </p>
            </div>

            <Button
              type="submit"
              disabled={uploading}
              className="w-full"
            >
              {uploading && uploadType === 'RIPS' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {documentosExistentes.rips ? 'Reemplazar RIPS' : 'Subir RIPS'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Upload FEV XML */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            FEV XML
          </CardTitle>
          <CardDescription>
            Factura Electrónica de Venta en formato XML (UBL 2.1 - DIAN)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={(formData) => handleUpload(formData, 'FEV')} className="space-y-4">
            <input type="hidden" name="factura_id" value={facturaId} />
            <input type="hidden" name="tipo_documento" value="fev" />

            <div className="space-y-2">
              <Label htmlFor="fev-file">
                Archivo FEV (XML) {documentosExistentes.fev && '- Reemplazar archivo existente'}
              </Label>
              <Input
                id="fev-file"
                name="file"
                type="file"
                accept=".xml,application/xml,text/xml"
                required
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Tamaño máximo: 50MB. Solo archivos .xml
              </p>
            </div>

            <Button
              type="submit"
              disabled={uploading}
              className="w-full"
            >
              {uploading && uploadType === 'FEV' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {documentosExistentes.fev ? 'Reemplazar FEV' : 'Subir FEV'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Upload CUV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CUV / Certificado
          </CardTitle>
          <CardDescription>
            Código Único de Validación del MinSalud o certificado de radicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={(formData) => handleUpload(formData, 'CUV')} className="space-y-4">
            <input type="hidden" name="factura_id" value={facturaId} />
            <input type="hidden" name="tipo_documento" value="cuv" />

            <div className="space-y-2">
              <Label htmlFor="cuv-file">
                Archivo CUV (PDF/Imagen) {documentosExistentes.cuv && '- Reemplazar archivo existente'}
              </Label>
              <Input
                id="cuv-file"
                name="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                required
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Tamaño máximo: 10MB. Formatos: PDF, JPG, PNG
              </p>
            </div>

            <Button
              type="submit"
              disabled={uploading}
              className="w-full"
            >
              {uploading && uploadType === 'CUV' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {documentosExistentes.cuv ? 'Reemplazar CUV' : 'Subir CUV'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Upload Soportes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Soportes Clínicos
          </CardTitle>
          <CardDescription>
            Documentos adicionales: FEV, OPF, CRC, PDX, PDE, epicrisis, autorizaciones, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={(formData) => handleUpload(formData, 'Soporte')} className="space-y-4">
            <input type="hidden" name="factura_id" value={facturaId} />
            <input type="hidden" name="tipo_documento" value="soporte" />

            <div className="space-y-2">
              <Label htmlFor="soporte-file">
                Archivos de Soporte (PDF/Imágenes)
              </Label>
              <Input
                id="soporte-file"
                name="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                required
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Tamaño máximo: 50MB por archivo. Formatos: PDF, JPG, PNG
              </p>
            </div>

            <Button
              type="submit"
              disabled={uploading}
              className="w-full"
            >
              {uploading && uploadType === 'Soporte' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Agregar Soporte ({documentosExistentes.soportes} existentes)
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
