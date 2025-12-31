/**
 * PDF Uploader - Genera y sube PDFs a Strapi
 *
 * Este módulo se encarga de:
 * 1. Generar PDFs desde sesiones de cuentos
 * 2. Subirlos a Strapi Media Library
 * 3. Retornar la URL pública del PDF
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import FormData from 'form-data'
import type { Session, CurrentState } from '~/types/session'
import type { StoryConfig } from '~/types/story'

/**
 * Sube un archivo PDF a Strapi Media Library
 *
 * @param pdfBuffer - Buffer del PDF generado
 * @param fileName - Nombre del archivo (ej: "Maria_PrimerDia.pdf")
 * @returns URL pública del PDF en Strapi
 */
export async function uploadPdfToStrapi(
  pdfBuffer: Buffer,
  fileName: string
): Promise<string> {
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl
  const apiToken = config.strapiApiToken

  if (!strapiUrl || !apiToken) {
    throw new Error('Configuración de Strapi incompleta')
  }

  try {
    // Crear FormData para subir el archivo
    const formData = new FormData()
    formData.append('files', pdfBuffer, {
      filename: fileName,
      contentType: 'application/pdf',
    })

    // Subir a Strapi
    const response = await fetch(`${strapiUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        ...formData.getHeaders(),
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[uploadPdfToStrapi] Error:', errorText)
      throw new Error(`Error al subir PDF a Strapi: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result || result.length === 0) {
      throw new Error('Strapi no retornó información del archivo subido')
    }

    // Strapi retorna array de archivos subidos
    const uploadedFile = result[0]
    const pdfUrl = uploadedFile.url

    // Si es URL relativa, convertir a absoluta
    const fullUrl = pdfUrl.startsWith('http') ? pdfUrl : `${strapiUrl}${pdfUrl}`

    console.log(`[uploadPdfToStrapi] PDF subido exitosamente: ${fullUrl}`)

    return fullUrl
  } catch (error: any) {
    console.error('[uploadPdfToStrapi] Error al subir PDF:', error)
    throw error
  }
}

/**
 * Genera un PDF desde una sesión y lo sube a Strapi
 *
 * NOTA: Por ahora, esta función asume que los PDFs se generan en el frontend.
 * En el futuro, podemos implementar generación de PDFs en el backend usando PDFKit.
 *
 * Estrategia actual:
 * - Almacenamos el sessionId en OrderItem
 * - El PDF se puede generar bajo demanda desde el frontend
 * - Opcionalmente, podemos implementar un endpoint que genere el PDF en backend
 *
 * @param sessionId - ID de la sesión
 * @returns URL del PDF (puede ser una URL de descarga dinámica)
 */
export async function generateAndUploadPdf(
  sessionId: string
): Promise<string> {
  try {
    // TODO: Implementar generación de PDF en backend con PDFKit
    // Por ahora, retornamos una URL que permitirá descargar el PDF bajo demanda

    const config = useRuntimeConfig()
    const baseUrl = config.public.strapiUrl?.replace('/api', '') || 'http://localhost:3000'

    // URL que generará el PDF bajo demanda
    const pdfUrl = `${baseUrl}/api/session/${sessionId}/download-pdf`

    console.log(`[generateAndUploadPdf] PDF URL generada para sesión ${sessionId}: ${pdfUrl}`)

    return pdfUrl
  } catch (error: any) {
    console.error('[generateAndUploadPdf] Error:', error)
    throw error
  }
}

/**
 * Procesa PDFs para todos los items de una orden
 *
 * @param orderItems - Array de items de la orden con sus sessionIds
 * @returns Map de itemId → pdfUrl
 */
export async function processPdfsForOrder(
  orderItems: Array<{ id: number; sessionId: string; childName: string; bookTitle: string }>
): Promise<Map<number, string>> {
  const pdfUrls = new Map<number, string>()

  for (const item of orderItems) {
    try {
      console.log(`[processPdfsForOrder] Procesando PDF para item ${item.id} (sesión: ${item.sessionId})`)

      // Por ahora, solo generamos la URL de descarga
      const pdfUrl = await generateAndUploadPdf(item.sessionId)

      pdfUrls.set(item.id, pdfUrl)

      // Actualizar el OrderItem con la URL del PDF
      await updateOrderItemPdfUrl(item.id, pdfUrl)

      console.log(`[processPdfsForOrder] PDF procesado para item ${item.id}: ${pdfUrl}`)
    } catch (error: any) {
      console.error(`[processPdfsForOrder] Error procesando PDF para item ${item.id}:`, error)
      // Continuar con los demás items aunque uno falle
    }
  }

  return pdfUrls
}

/**
 * Lee una sesión del sistema de archivos
 */
async function readSession(sessionId: string): Promise<{ session: Session; currentState: CurrentState }> {
  const sessionDir = path.join(process.cwd(), 'data', 'sessions', sessionId)

  try {
    const metadataPath = path.join(sessionDir, 'metadata.json')
    const statePath = path.join(sessionDir, 'current-state.json')

    const [metadataContent, stateContent] = await Promise.all([
      fs.readFile(metadataPath, 'utf-8'),
      fs.readFile(statePath, 'utf-8'),
    ])

    const session: Session = JSON.parse(metadataContent)
    const currentState: CurrentState = JSON.parse(stateContent)

    return { session, currentState }
  } catch (error: any) {
    console.error(`[readSession] Error leyendo sesión ${sessionId}:`, error)
    throw new Error(`No se pudo leer la sesión ${sessionId}`)
  }
}

/**
 * FUTURO: Genera un PDF usando PDFKit en el backend
 *
 * Esta función se puede implementar más adelante si necesitamos
 * generar PDFs en el servidor en lugar del cliente.
 *
 * Requerirá:
 * 1. Instalar: pnpm add pdfkit @types/pdfkit
 * 2. Implementar lógica similar a usePdfGenerator.ts pero en Node.js
 * 3. Manejar imágenes desde el sistema de archivos
 */
export async function generatePdfWithPDFKit(
  sessionId: string
): Promise<Buffer> {
  // TODO: Implementar con PDFKit
  throw new Error('Generación de PDF en backend no implementada aún')

  /*
  Ejemplo de implementación:

  import PDFDocument from 'pdfkit'

  const { session, currentState } = await readSession(sessionId)
  const storyConfig = await loadStoryConfig(session.storyId)

  const doc = new PDFDocument({ size: 'A4' })
  const chunks: Buffer[] = []

  doc.on('data', (chunk) => chunks.push(chunk))
  doc.on('end', () => {})

  // Cover page
  doc.fontSize(24).text(storyConfig.title)
  // ... más contenido

  // Story pages
  for (const pageNumber of Object.keys(currentState.selectedVersions)) {
    // Cargar imagen
    // Agregar al PDF
    // Agregar texto
  }

  doc.end()

  return Buffer.concat(chunks)
  */
}
