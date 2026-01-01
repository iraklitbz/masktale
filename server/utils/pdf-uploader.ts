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
    console.log(`[uploadPdfToStrapi] Subiendo PDF a Strapi: ${fileName} (${pdfBuffer.length} bytes)`)

    // Crear un Blob/File desde el Buffer
    // En Node.js 18+, tenemos acceso a File y Blob
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
    const file = new File([blob], fileName, { type: 'application/pdf' })

    // Crear FormData nativa de Node.js (no form-data package)
    const formData = new FormData()
    formData.append('files', file)

    console.log(`[uploadPdfToStrapi] FormData creado con File: ${fileName}`)

    // Usar $fetch en lugar de fetch nativo para mejor compatibilidad
    const result = await $fetch<any[]>(`${strapiUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
      body: formData,
    })

    console.log('[uploadPdfToStrapi] Strapi response:', JSON.stringify(result, null, 2))

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
    console.error('[uploadPdfToStrapi] Error details:', error.response || error.data || error.message)
    throw error
  }
}

/**
 * Genera un PDF desde una sesión y lo sube a Strapi
 *
 * @param sessionId - ID de la sesión
 * @returns URL del PDF en Strapi
 */
export async function generateAndUploadPdf(
  sessionId: string
): Promise<string> {
  try {
    console.log(`[generateAndUploadPdf] Generando PDF para sesión ${sessionId}`)

    // 1. Leer sesión y estado
    const { session, currentState } = await readSession(sessionId)

    // 2. Generar el PDF con PDFKit
    const pdfBuffer = await generatePdfWithPDFKit(sessionId, session, currentState)

    // 3. Preparar nombre del archivo
    const childName = session.characterSettings?.name || 'Cuento'
    const sanitizedChildName = childName.replace(/[^a-zA-Z0-9]/g, '_')
    const fileName = `${sanitizedChildName}_${session.storyId}_${Date.now()}.pdf`

    // 4. Subir a Strapi
    const pdfUrl = await uploadPdfToStrapi(pdfBuffer, fileName)

    console.log(`[generateAndUploadPdf] PDF generado y subido exitosamente: ${pdfUrl}`)

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
 * Genera un PDF usando PDFKit en el backend
 */
export async function generatePdfWithPDFKit(
  sessionId: string,
  session: Session,
  currentState: CurrentState
): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default
  const { loadStoryConfig } = await import('./story-loader')
  const { getGeneratedImagePath } = await import('./session-manager')

  try {
    console.log(`[generatePdfWithPDFKit] Iniciando generación de PDF para sesión ${sessionId}`)

    // Cargar configuración del cuento
    const storyConfig = await loadStoryConfig(session.storyId)

    // Crear documento PDF (A4 size)
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    })

    // Capturar el PDF en memoria
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('error', (error) => {
      console.error('[generatePdfWithPDFKit] Error en stream:', error)
    })

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks)
        console.log(`[generatePdfWithPDFKit] PDF generado, tamaño: ${pdfBuffer.length} bytes`)
        resolve(pdfBuffer)
      })
      doc.on('error', reject)
    })

    const pageWidth = doc.page.width
    const pageHeight = doc.page.height
    const margin = 50

    // === PORTADA ===
    await generateCoverPagePDFKit(doc, session, storyConfig, pageWidth, pageHeight, margin)

    // === PÁGINAS DEL CUENTO ===
    const selectedVersions = currentState.selectedVersions
    const favoriteVersions = currentState.favoriteVersions || {}

    const pageNumbers = Object.keys(selectedVersions)
      .map(Number)
      .sort((a, b) => a - b)

    for (let i = 0; i < pageNumbers.length; i++) {
      const pageNumber = pageNumbers[i]
      const pageData = storyConfig.pages.find(p => p.pageNumber === pageNumber)

      if (!pageData) {
        console.warn(`[generatePdfWithPDFKit] Página ${pageNumber} no encontrada en configuración`)
        continue
      }

      // Determinar qué versión usar (favorita o seleccionada)
      let versionToUse = selectedVersions[pageNumber].version
      if (favoriteVersions[pageNumber]) {
        versionToUse = favoriteVersions[pageNumber]
      }

      // Agregar nueva página
      doc.addPage()

      // Cargar y agregar imagen
      try {
        const imagePath = getGeneratedImagePath(sessionId, pageNumber, versionToUse)
        const imageBuffer = await fs.readFile(imagePath)

        // Calcular dimensiones manteniendo aspect ratio
        const maxWidth = pageWidth - (margin * 2)
        const maxHeight = pageHeight * 0.6

        // Agregar imagen centrada
        const imageX = margin
        const imageY = margin

        doc.image(imageBuffer, imageX, imageY, {
          fit: [maxWidth, maxHeight],
          align: 'center',
          valign: 'top',
        })

        // Calcular posición del texto (debajo de la imagen)
        const textY = imageY + maxHeight + 20
        const textMaxWidth = pageWidth - (margin * 2)

        // Agregar texto de la página
        doc
          .fontSize(12)
          .font('Helvetica')
          .text(pageData.text, margin, textY, {
            width: textMaxWidth,
            align: 'left',
          })

        // Número de página al pie
        doc
          .fontSize(10)
          .font('Helvetica-Oblique')
          .text(`${i + 1}`, margin, pageHeight - margin, {
            width: pageWidth - (margin * 2),
            align: 'center',
          })

      } catch (error: any) {
        console.error(`[generatePdfWithPDFKit] Error cargando imagen página ${pageNumber}:`, error)
        // Continuar con las demás páginas
      }
    }

    // === CONTRAPORTADA ===
    await generateBackCoverPDFKit(doc, session, storyConfig, pageWidth, pageHeight, margin)

    // Finalizar el documento
    doc.end()

    // Esperar a que el PDF se complete
    return await pdfPromise
  } catch (error: any) {
    console.error('[generatePdfWithPDFKit] Error:', error)
    throw error
  }
}

/**
 * Genera la portada del PDF
 */
async function generateCoverPagePDFKit(
  doc: any,
  session: Session,
  storyConfig: StoryConfig,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  // Fondo de color (rectángulo superior)
  doc
    .rect(0, 0, pageWidth, pageHeight / 3)
    .fill('#7C3AED') // Purple

  // Título del cuento
  doc
    .fillColor('#FFFFFF')
    .fontSize(28)
    .font('Helvetica-Bold')
    .text(storyConfig.title || 'Cuento Personalizado', margin, pageHeight / 6, {
      width: pageWidth - (margin * 2),
      align: 'center',
    })

  // Nombre del niño
  const childName = session.characterSettings?.name || 'ti'
  doc
    .fillColor('#000000')
    .fontSize(18)
    .font('Helvetica')
    .text(`Para ${childName}`, margin, pageHeight / 2, {
      width: pageWidth - (margin * 2),
      align: 'center',
    })

  // Tema del cuento
  doc
    .fontSize(14)
    .font('Helvetica-Oblique')
    .text(storyConfig.theme || 'Aventura', margin, pageHeight / 2 + 30, {
      width: pageWidth - (margin * 2),
      align: 'center',
    })

  // Fecha de creación
  const createdDate = new Date(session.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc
    .fontSize(10)
    .fillColor('#666666')
    .text(`Creado el ${createdDate}`, margin, pageHeight - margin, {
      width: pageWidth - (margin * 2),
      align: 'center',
    })
}

/**
 * Genera la contraportada del PDF
 */
async function generateBackCoverPDFKit(
  doc: any,
  session: Session,
  storyConfig: StoryConfig,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  doc.addPage()

  // Fondo gris claro
  doc
    .rect(0, 0, pageWidth, pageHeight)
    .fill('#FAFAFA')

  // Mensaje final
  const childName = session.characterSettings?.name || 'ti'
  const message = [
    'Este cuento fue creado especialmente',
    `para ${childName}`,
    '',
    'con amor y magia digital.',
  ]

  let y = pageHeight / 2 - 40
  doc.fillColor('#666666').fontSize(12).font('Helvetica-Oblique')

  message.forEach(line => {
    doc.text(line, margin, y, {
      width: pageWidth - (margin * 2),
      align: 'center',
    })
    y += 20
  })

  // Pie decorativo
  doc
    .fontSize(10)
    .text('✨ Fin ✨', margin, pageHeight - margin, {
      width: pageWidth - (margin * 2),
      align: 'center',
    })
}
