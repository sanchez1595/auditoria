'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function crearRadicacion(formData: FormData) {
  const supabase = await createClient()

  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Extraer datos del formulario
  const datos = {
    eps_id: formData.get('eps_id') as string,
    numero_factura: formData.get('numero_factura') as string,
    numero_lote: formData.get('numero_lote') as string || null,
    fecha_radicacion: formData.get('fecha_radicacion') as string,
    valor_total: parseFloat(formData.get('valor_total') as string),
    cuv: formData.get('cuv') as string || null,
    estado: 'radicada',
    created_by: user.id
  }

  // Insertar en la base de datos
  const { error } = await supabase
    .from('facturas_radicadas')
    .insert(datos)

  if (error) {
    console.error('Error al crear radicación:', error)
    redirect('/facturas/nueva?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/facturas')
  redirect('/facturas')
}
