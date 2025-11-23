'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Calcula el semáforo según días hábiles hasta vencimiento
 * Verde: > 10 días hábiles
 * Amarillo: 6-10 días hábiles
 * Rojo: 1-5 días hábiles
 * Negro: Vencida o vence hoy
 */
async function calcularSemaforo(fechaVencimiento: string): Promise<string> {
  const supabase = await createClient()

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const vencimiento = new Date(fechaVencimiento)
  vencimiento.setHours(0, 0, 0, 0)

  // Si ya venció, es negro
  if (vencimiento < hoy) {
    return 'negro'
  }

  // Obtener festivos del calendario
  const { data: festivos } = await supabase
    .from('calendario_festivos')
    .select('fecha')
    .gte('fecha', hoy.toISOString().split('T')[0])
    .lte('fecha', vencimiento.toISOString().split('T')[0])

  const fechasFestivas = new Set(festivos?.map((f: any) => f.fecha) || [])

  // Contar días hábiles (excluyendo sábados, domingos y festivos)
  let diasHabiles = 0
  const fechaActual = new Date(hoy)

  while (fechaActual < vencimiento) {
    fechaActual.setDate(fechaActual.getDate() + 1)
    const diaSemana = fechaActual.getDay()
    const fechaStr = fechaActual.toISOString().split('T')[0]

    // No es sábado (6) ni domingo (0) ni festivo
    if (diaSemana !== 0 && diaSemana !== 6 && !fechasFestivas.has(fechaStr)) {
      diasHabiles++
    }
  }

  // Asignar color según días hábiles
  if (diasHabiles > 10) return 'verde'
  if (diasHabiles >= 6) return 'amarillo'
  if (diasHabiles >= 1) return 'rojo'
  return 'negro'
}

export async function crearGlosa(formData: FormData) {
  const supabase = await createClient()

  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const facturaId = formData.get('factura_id') as string
  const codigoGlosaCatalogoId = formData.get('codigo_glosa_catalogo_id') as string
  const descripcion = formData.get('descripcion') as string
  const valorGlosado = formData.get('valor_glosado') as string
  const fechaGlosa = formData.get('fecha_glosa') as string
  const fechaVencimiento = formData.get('fecha_vencimiento') as string
  const estado = formData.get('estado') as string

  // Obtener el código de glosa del catálogo
  const { data: catalogoGlosa } = await supabase
    .from('catalogos_codigos_glosa')
    .select('codigo')
    .eq('id', codigoGlosaCatalogoId)
    .single()

  if (!catalogoGlosa) {
    redirect('/glosas/nueva?error=' + encodeURIComponent('Código de glosa no encontrado'))
  }

  // Calcular semáforo automáticamente
  const semaforo = await calcularSemaforo(fechaVencimiento)

  // Preparar datos para inserción
  const datos = {
    factura_id: facturaId,
    codigo_glosa: catalogoGlosa.codigo,
    descripcion,
    valor_glosado: parseFloat(valorGlosado),
    fecha_glosa: fechaGlosa,
    fecha_vencimiento: fechaVencimiento,
    semaforo,
    estado,
    created_by: user.id
  }

  // Insertar en la base de datos
  const { error } = await supabase
    .from('glosas')
    .insert(datos)

  if (error) {
    console.error('Error al crear glosa:', error)
    redirect('/glosas/nueva?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/glosas')
  revalidatePath('/')
  redirect('/glosas')
}

export async function actualizarEstadoGlosa(glosaId: string, nuevoEstado: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('glosas')
    .update({
      estado: nuevoEstado,
      updated_at: new Date().toISOString()
    })
    .eq('id', glosaId)

  if (error) {
    console.error('Error al actualizar estado:', error)
    return { error: error.message }
  }

  revalidatePath('/glosas')
  revalidatePath(`/glosas/${glosaId}`)
  revalidatePath('/')

  return { success: true }
}

export async function recalcularSemaforos() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener todas las glosas pendientes y en proceso
  const { data: glosas } = await supabase
    .from('glosas')
    .select('id, fecha_vencimiento')
    .in('estado', ['pendiente', 'en_proceso'])

  if (!glosas) return

  // Actualizar semáforo de cada glosa
  for (const glosa of glosas) {
    const nuevoSemaforo = await calcularSemaforo(glosa.fecha_vencimiento)

    await supabase
      .from('glosas')
      .update({ semaforo: nuevoSemaforo })
      .eq('id', glosa.id)
  }

  revalidatePath('/glosas')
  revalidatePath('/')

  return { success: true, actualizadas: glosas.length }
}
