'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Eye } from "lucide-react"
import * as XLSX from 'xlsx'
import { parseExcelFile, importGlosas } from './actions'

interface ImportExcelFormProps {
  eps: Array<{ id: string; codigo: string; nombre: string }>
}

interface ParsedGlosa {
  numero_factura: string
  codigo_glosa: string
  descripcion: string
  valor_glosado: number
  fecha_glosa: string
  fecha_vencimiento?: string
  lote?: string
  status: 'valid' | 'warning' | 'error'
  message?: string
}

export function ImportExcelForm({ eps }: ImportExcelFormProps) {
  const [selectedEps, setSelectedEps] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedGlosa[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [stats, setStats] = useState<{ valid: number; warnings: number; errors: number } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setParsedData([])
      setStats(null)
      setMessage(null)
    }
  }

  const handleParse = async () => {
    if (!file || !selectedEps) {
      setMessage({ type: 'error', text: 'Selecciona una EPS y un archivo' })
      return
    }

    setParsing(true)
    setMessage(null)

    try {
      // Leer archivo Excel del lado del cliente
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // Convertir a JSON (asumiendo que la primera fila son headers)
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

      // Enviar al servidor para procesamiento y validación
      const result = await parseExcelFile(selectedEps, rawData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
        setParsedData([])
        setStats(null)
      } else if (result.data) {
        setParsedData(result.data)

        // Calcular estadísticas
        const valid = result.data.filter((g: ParsedGlosa) => g.status === 'valid').length
        const warnings = result.data.filter((g: ParsedGlosa) => g.status === 'warning').length
        const errors = result.data.filter((g: ParsedGlosa) => g.status === 'error').length

        setStats({ valid, warnings, errors })
        setMessage({
          type: 'success',
          text: `Archivo parseado: ${result.data.length} registros encontrados`
        })
      }
    } catch (error) {
      console.error('Error parsing Excel:', error)
      setMessage({ type: 'error', text: 'Error al leer el archivo Excel' })
    } finally {
      setParsing(false)
    }
  }

  const handleImport = async () => {
    if (!selectedEps || parsedData.length === 0) {
      setMessage({ type: 'error', text: 'No hay datos para importar' })
      return
    }

    // Solo importar registros válidos y con warnings
    const dataToImport = parsedData.filter(g => g.status !== 'error')

    if (dataToImport.length === 0) {
      setMessage({ type: 'error', text: 'No hay registros válidos para importar' })
      return
    }

    setImporting(true)
    setMessage(null)

    try {
      const result = await importGlosas(selectedEps, dataToImport)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({
          type: 'success',
          text: `${result.imported} glosas importadas exitosamente`
        })

        // Resetear formulario después de 2 segundos
        setTimeout(() => {
          setFile(null)
          setParsedData([])
          setStats(null)
          setSelectedEps('')
          // Reload para ver nuevas glosas
          window.location.href = '/glosas'
        }, 2000)
      }
    } catch (error) {
      console.error('Error importing:', error)
      setMessage({ type: 'error', text: 'Error al importar las glosas' })
    } finally {
      setImporting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Válido</Badge>
      case 'warning':
        return <Badge variant="default" className="bg-yellow-50 text-yellow-700 border-yellow-200">Advertencia</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Desconocido</Badge>
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

      {/* Formulario de carga */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Cargar Archivo Excel
          </CardTitle>
          <CardDescription>
            Selecciona la EPS y el archivo de glosas para importar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="eps">
                EPS <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedEps} onValueChange={setSelectedEps}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una EPS" />
                </SelectTrigger>
                <SelectContent>
                  {eps.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.codigo} - {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excel-file">
                Archivo Excel <span className="text-destructive">*</span>
              </Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={parsing || importing}
              />
              <p className="text-xs text-muted-foreground">
                Formatos: .xlsx, .xls
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleParse}
              disabled={!file || !selectedEps || parsing || importing}
              className="flex-1"
            >
              {parsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parseando...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Previsualizar
                </>
              )}
            </Button>

            {parsedData.length > 0 && (
              <Button
                onClick={handleImport}
                disabled={importing || stats?.valid === 0}
                variant="default"
                className="flex-1"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar {stats?.valid || 0} Glosas
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas de preview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Válidos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Advertencias</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.warnings}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Errores</p>
                  <p className="text-2xl font-bold text-destructive">{stats.errors}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview de datos */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Preview de Datos ({parsedData.length} registros)
            </CardTitle>
            <CardDescription>
              Revisa los datos antes de importar. Solo se importarán registros válidos y con advertencias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Fecha Glosa</TableHead>
                    <TableHead>Mensaje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((glosa, index) => (
                    <TableRow key={index}>
                      <TableCell>{getStatusBadge(glosa.status)}</TableCell>
                      <TableCell className="font-medium">{glosa.numero_factura}</TableCell>
                      <TableCell>{glosa.codigo_glosa}</TableCell>
                      <TableCell className="max-w-xs truncate">{glosa.descripcion}</TableCell>
                      <TableCell className="text-right">
                        ${glosa.valor_glosado.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell>{glosa.fecha_glosa}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {glosa.message || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsedData.length > 50 && (
              <p className="text-sm text-muted-foreground mt-2">
                Mostrando primeros 50 de {parsedData.length} registros
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
