'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

/**
 * Mapeo por defecto de columnas de Excel
 * Este es el formato estándar, pero puede ser customizado por EPS
 */
const DEFAULT_COLUMN_MAPPING = {
  numero_factura: ['numero_factura', 'factura', 'nro_factura', 'no_factura', 'numero factura'],
  codigo_glosa: ['codigo_glosa', 'codigo', 'cod_glosa', 'glosa', 'código glosa'],
  descripcion: ['descripcion', 'descripción', 'detalle', 'observacion', 'observación'],
  valor_glosado: ['valor_glosado', 'valor', 'valor glosado', 'monto', 'valor_objecion'],
  fecha_glosa: ['fecha_glosa', 'fecha', 'fecha glosa', 'fec_glosa'],
  fecha_vencimiento: ['fecha_vencimiento', 'vencimiento', 'fecha_limite', 'fecha límite'],
  lote: ['lote', 'numero_lote', 'nro_lote']
}

function findColumn(row: any, possibleNames: string[]): any {
  // Buscar coincidencia exacta primero (case insensitive)
  for (const key of Object.keys(row)) {
    if (possibleNames.some(name => key.toLowerCase() === name.toLowerCase())) {
      return row[key]
    }
  }

  // Buscar coincidencia parcial
  for (const key of Object.keys(row)) {
    if (possibleNames.some(name => key.toLowerCase().includes(name.toLowerCase()))) {
      return row[key]
    }
  }

  return null
}

function parseDate(value: any): string | null {
  if (!value) return null

  try {
    // Si es número (Excel serial date)
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000)
      return date.toISOString().split('T')[0]
    }

    // Si es string
    if (typeof value === 'string') {
      // Intentar varios formatos
      const formats = [
        /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
        /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
        /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
      ]

      for (const format of formats) {
        const match = value.match(format)
        if (match) {
          if (format === formats[0]) {
            // Ya está en formato correcto
            return value
          } else {
            // Convertir DD/MM/YYYY o DD-MM-YYYY a YYYY-MM-DD
            const [, day, month, year] = match
            return `${year}-${month}-${day}`
          }
        }
      }
    }

    // Si es objeto Date
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]
    }
  } catch (error) {
    console.error('Error parsing date:', error)
  }

  return null
}

function parseNumber(value: any): number {
  if (typeof value === 'number') return value

  if (typeof value === 'string') {
    // Remover símbolos de moneda y separadores de miles
    const cleaned = value.replace(/[$,]/g, '').trim()
    const number = parseFloat(cleaned)
    return isNaN(number) ? 0 : number
  }

  return 0
}

function calcularFechaVencimiento(fechaGlosa: string): string {
  // Agregar 20 días hábiles (simplificado: 30 días calendario)
  const fecha = new Date(fechaGlosa)
  fecha.setDate(fecha.getDate() + 30)
  return fecha.toISOString().split('T')[0]
}

export async function parseExcelFile(epsId: string, rawData: any[]) {
  const supabase = await createClient()

  try {
    // Obtener facturas existentes para hacer matching
    const { data: facturas } = await supabase
      .from('facturas_radicadas')
      .select('id, numero_factura, eps_id')
      .eq('eps_id', epsId)

    const facturasMap = new Map(
      facturas?.map(f => [f.numero_factura, f.id]) || []
    )

    // Parsear cada fila
    const parsed: ParsedGlosa[] = rawData.map((row, index) => {
      // Extraer valores usando mapeo flexible
      const numero_factura = findColumn(row, DEFAULT_COLUMN_MAPPING.numero_factura)
      const codigo_glosa = findColumn(row, DEFAULT_COLUMN_MAPPING.codigo_glosa)
      const descripcion = findColumn(row, DEFAULT_COLUMN_MAPPING.descripcion) || ''
      const valor_raw = findColumn(row, DEFAULT_COLUMN_MAPPING.valor_glosado)
      const fecha_glosa_raw = findColumn(row, DEFAULT_COLUMN_MAPPING.fecha_glosa)
      const fecha_vencimiento_raw = findColumn(row, DEFAULT_COLUMN_MAPPING.fecha_vencimiento)
      const lote = findColumn(row, DEFAULT_COLUMN_MAPPING.lote)

      // Validar campos obligatorios
      if (!numero_factura) {
        return {
          numero_factura: '(vacío)',
          codigo_glosa: codigo_glosa || '',
          descripcion,
          valor_glosado: 0,
          fecha_glosa: '',
          status: 'error' as const,
          message: 'Número de factura no encontrado'
        }
      }

      if (!codigo_glosa) {
        return {
          numero_factura,
          codigo_glosa: '(vacío)',
          descripcion,
          valor_glosado: 0,
          fecha_glosa: '',
          status: 'error' as const,
          message: 'Código de glosa no encontrado'
        }
      }

      if (!valor_raw) {
        return {
          numero_factura,
          codigo_glosa,
          descripcion,
          valor_glosado: 0,
          fecha_glosa: '',
          status: 'error' as const,
          message: 'Valor glosado no encontrado'
        }
      }

      if (!fecha_glosa_raw) {
        return {
          numero_factura,
          codigo_glosa,
          descripcion,
          valor_glosado: parseNumber(valor_raw),
          fecha_glosa: '',
          status: 'error' as const,
          message: 'Fecha de glosa no encontrada'
        }
      }

      // Parsear valores
      const valor_glosado = parseNumber(valor_raw)
      const fecha_glosa = parseDate(fecha_glosa_raw)
      const fecha_vencimiento = fecha_vencimiento_raw
        ? parseDate(fecha_vencimiento_raw)
        : (fecha_glosa ? calcularFechaVencimiento(fecha_glosa) : null)

      if (!fecha_glosa) {
        return {
          numero_factura,
          codigo_glosa,
          descripcion,
          valor_glosado,
          fecha_glosa: '',
          status: 'error' as const,
          message: 'Fecha de glosa inválida'
        }
      }

      // Verificar si la factura existe
      const facturaId = facturasMap.get(numero_factura)

      if (!facturaId) {
        return {
          numero_factura,
          codigo_glosa,
          descripcion,
          valor_glosado,
          fecha_glosa,
          fecha_vencimiento: fecha_vencimiento || undefined,
          lote: lote || undefined,
          status: 'warning' as const,
          message: 'Factura no encontrada - se creará sin vínculo'
        }
      }

      return {
        numero_factura,
        codigo_glosa,
        descripcion,
        valor_glosado,
        fecha_glosa,
        fecha_vencimiento: fecha_vencimiento || undefined,
        lote: lote || undefined,
        status: 'valid' as const,
        message: 'Listo para importar'
      }
    })

    return { data: parsed }

  } catch (error) {
    console.error('Error parsing Excel:', error)
    return { error: 'Error al procesar el archivo' }
  }
}

export async function importGlosas(epsId: string, glosas: ParsedGlosa[]) {
  const supabase = await createClient()

  try {
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'No autenticado' }
    }

    // Obtener facturas existentes
    const { data: facturas } = await supabase
      .from('facturas_radicadas')
      .select('id, numero_factura, eps_id')
      .eq('eps_id', epsId)

    const facturasMap = new Map(
      facturas?.map(f => [f.numero_factura, f.id]) || []
    )

    // Preparar datos para inserción
    const glosasParaInsertar = []

    for (const glosa of glosas) {
      const facturaId = facturasMap.get(glosa.numero_factura)

      // Calcular semáforo básico (simplificado)
      const diasRestantes = glosa.fecha_vencimiento
        ? Math.ceil((new Date(glosa.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 20

      let semaforo = 'verde'
      if (diasRestantes <= 0) semaforo = 'negro'
      else if (diasRestantes <= 5) semaforo = 'rojo'
      else if (diasRestantes <= 10) semaforo = 'amarillo'

      glosasParaInsertar.push({
        factura_id: facturaId || null,
        codigo_glosa: glosa.codigo_glosa,
        descripcion: glosa.descripcion,
        valor_glosado: glosa.valor_glosado,
        fecha_glosa: glosa.fecha_glosa,
        fecha_vencimiento: glosa.fecha_vencimiento || calcularFechaVencimiento(glosa.fecha_glosa),
        dias_restantes: diasRestantes,
        semaforo,
        estado: 'pendiente',
        created_at: new Date().toISOString()
      })
    }

    // Insertar en lote
    const { error: insertError, count } = await supabase
      .from('glosas')
      .insert(glosasParaInsertar)

    if (insertError) {
      console.error('Error inserting glosas:', insertError)
      return { error: 'Error al importar las glosas: ' + insertError.message }
    }

    // Revalidar páginas
    revalidatePath('/glosas')
    revalidatePath('/')

    return { success: true, imported: count || glosasParaInsertar.length }

  } catch (error) {
    console.error('Error importing glosas:', error)
    return { error: 'Error inesperado al importar' }
  }
}
