'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'No autenticado' }
  }

  const facturaId = formData.get('factura_id') as string
  const tipoDocumento = formData.get('tipo_documento') as string
  const file = formData.get('file') as File

  if (!file || !facturaId || !tipoDocumento) {
    return { error: 'Datos incompletos' }
  }

  try {
    // Determinar el bucket según el tipo de documento
    let bucket = ''
    let columnaDB = ''

    switch (tipoDocumento) {
      case 'rips':
        bucket = 'rips-json'
        columnaDB = 'rips_json_url'
        break
      case 'fev':
        bucket = 'fev-xml'
        columnaDB = 'fev_xml_url'
        break
      case 'cuv':
        bucket = 'cuv'
        columnaDB = 'certificado_url'
        break
      case 'soporte':
        bucket = 'soportes'
        columnaDB = 'soportes_urls'
        break
      default:
        return { error: 'Tipo de documento no válido' }
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const fileName = `${facturaId}/${tipoDocumento}_${timestamp}_${file.name}`

    // Subir archivo a Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return { error: `Error al subir archivo: ${uploadError.message}` }
    }

    // Obtener la URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    // Actualizar la base de datos según el tipo de documento
    if (tipoDocumento === 'soporte') {
      // Para soportes, agregamos a un array
      const { data: facturaActual } = await supabase
        .from('facturas_radicadas')
        .select('soportes_urls')
        .eq('id', facturaId)
        .single()

      const soportesActuales = facturaActual?.soportes_urls || []
      const nuevosSoportes = [...soportesActuales, publicUrl]

      const { error: updateError } = await supabase
        .from('facturas_radicadas')
        .update({
          soportes_urls: nuevosSoportes,
          updated_at: new Date().toISOString()
        })
        .eq('id', facturaId)

      if (updateError) {
        console.error('Error updating database:', updateError)
        return { error: 'Error al actualizar la base de datos' }
      }
    } else {
      // Para RIPS, FEV y CUV, reemplazamos el valor
      const { error: updateError } = await supabase
        .from('facturas_radicadas')
        .update({
          [columnaDB]: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', facturaId)

      if (updateError) {
        console.error('Error updating database:', updateError)
        return { error: 'Error al actualizar la base de datos' }
      }
    }

    // Revalidar las páginas
    revalidatePath(`/facturas/${facturaId}`)
    revalidatePath(`/facturas/${facturaId}/documentos`)

    return { success: true, url: publicUrl }

  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'Error inesperado al procesar el archivo' }
  }
}

export async function deleteDocument(facturaId: string, tipoDocumento: string, url?: string) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'No autenticado' }
  }

  try {
    let columnaDB = ''

    switch (tipoDocumento) {
      case 'rips':
        columnaDB = 'rips_json_url'
        break
      case 'fev':
        columnaDB = 'fev_xml_url'
        break
      case 'cuv':
        columnaDB = 'certificado_url'
        break
      case 'soporte':
        if (!url) {
          return { error: 'URL requerida para eliminar soporte' }
        }
        columnaDB = 'soportes_urls'
        break
      default:
        return { error: 'Tipo de documento no válido' }
    }

    if (tipoDocumento === 'soporte' && url) {
      // Eliminar soporte específico del array
      const { data: facturaActual } = await supabase
        .from('facturas_radicadas')
        .select('soportes_urls')
        .eq('id', facturaId)
        .single()

      const soportesActuales = facturaActual?.soportes_urls || []
      const nuevosSoportes = soportesActuales.filter((s: string) => s !== url)

      const { error: updateError } = await supabase
        .from('facturas_radicadas')
        .update({
          soportes_urls: nuevosSoportes,
          updated_at: new Date().toISOString()
        })
        .eq('id', facturaId)

      if (updateError) {
        return { error: 'Error al actualizar la base de datos' }
      }
    } else {
      // Eliminar RIPS, FEV o CUV
      const { error: updateError } = await supabase
        .from('facturas_radicadas')
        .update({
          [columnaDB]: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', facturaId)

      if (updateError) {
        return { error: 'Error al actualizar la base de datos' }
      }
    }

    // Revalidar las páginas
    revalidatePath(`/facturas/${facturaId}`)
    revalidatePath(`/facturas/${facturaId}/documentos`)

    return { success: true }

  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'Error inesperado al eliminar el archivo' }
  }
}
