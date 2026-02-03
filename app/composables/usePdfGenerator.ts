/**
 * Composable for generating professional PDF from story session
 * DISEÑO IDÉNTICO A BookPreview.vue - 1000mm x 500mm spread
 */
import { jsPDF } from 'jspdf'
import type { Session, CurrentState } from '~/types/session'
import type { StoryTexts } from '~/types/story'

export interface PdfGeneratorOptions {
  sessionId: string
  session: Session
  currentState: CurrentState
  useFavorites?: boolean
}

// Spread: 1000mm x 500mm (100cm x 50cm)
const SPREAD_WIDTH = 1000
const SPREAD_HEIGHT = 500
const PAGE_WIDTH = 500 // cada mitad

export function usePdfGenerator() {
  const toast = useToast()

  const interpolateText = (text: string, childName: string): string => {
    return text.replace(/\{childName\}/g, childName)
  }

  const loadImageAsBase64 = async (imageUrl: string): Promise<{ base64: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0)
        resolve({
          base64: canvas.toDataURL('image/jpeg', 0.95),
          width: img.width,
          height: img.height,
        })
      }
      img.onerror = () => reject(new Error(`Failed to load: ${imageUrl}`))
      img.src = imageUrl
    })
  }

  // ==================== PORTADA ====================
  const generateCover = async (
    pdf: jsPDF,
    storyTexts: StoryTexts,
    childName: string,
    imageUrl: string | null
  ) => {
    // IZQUIERDA: Fondo púrpura con gradiente simulado
    pdf.setFillColor(124, 58, 237)
    pdf.rect(0, 0, PAGE_WIDTH, SPREAD_HEIGHT, 'F')
    // Gradiente rosa en esquina
    pdf.setFillColor(219, 39, 119)
    pdf.rect(0, SPREAD_HEIGHT * 0.7, PAGE_WIDTH * 0.4, SPREAD_HEIGHT * 0.3, 'F')

    // Contenido centrado verticalmente
    const centerY = SPREAD_HEIGHT / 2

    // Título (grande como lg:text-5xl)
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(56)
    pdf.setFont('helvetica', 'bold')
    const titleLines = pdf.splitTextToSize(storyTexts.cover.title, PAGE_WIDTH - 80)
    const titleHeight = titleLines.length * 65
    let y = centerY - 100

    titleLines.forEach((line: string) => {
      const w = pdf.getTextWidth(line)
      pdf.text(line, (PAGE_WIDTH - w) / 2, y)
      y += 65
    })

    // Tagline (lg:text-xl)
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(255, 255, 255, 0.9)
    const tagW = pdf.getTextWidth(storyTexts.cover.tagline)
    pdf.text(storyTexts.cover.tagline, (PAGE_WIDTH - tagW) / 2, y + 15)

    // Línea decorativa
    y += 50
    pdf.setDrawColor(255, 255, 255)
    pdf.setLineWidth(3)
    pdf.line(PAGE_WIDTH / 2 - 50, y, PAGE_WIDTH / 2 + 50, y)

    // Subtítulo
    y += 40
    pdf.setFontSize(22)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(255, 255, 255, 0.8)
    const subW = pdf.getTextWidth(storyTexts.cover.subtitle)
    pdf.text(storyTexts.cover.subtitle, (PAGE_WIDTH - subW) / 2, y)

    // Nombre del niño (grande como lg:text-4xl)
    y += 55
    pdf.setFontSize(52)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    const nameW = pdf.getTextWidth(childName)
    pdf.text(childName, (PAGE_WIDTH - nameW) / 2, y)

    // DERECHA: Imagen a pantalla completa (object-cover)
    pdf.setFillColor(249, 250, 251)
    pdf.rect(PAGE_WIDTH, 0, PAGE_WIDTH, SPREAD_HEIGHT, 'F')

    if (imageUrl) {
      try {
        const img = await loadImageAsBase64(imageUrl)
        // Object-cover: llenar todo el espacio, recortando si es necesario
        const targetW = PAGE_WIDTH
        const targetH = SPREAD_HEIGHT
        const imgRatio = img.width / img.height
        const targetRatio = targetW / targetH

        let drawW, drawH, offsetX = 0, offsetY = 0

        if (imgRatio > targetRatio) {
          // Imagen más ancha: ajustar por altura, recortar ancho
          drawH = targetH
          drawW = targetH * imgRatio
          offsetX = -(drawW - targetW) / 2
        } else {
          // Imagen más alta: ajustar por ancho, recortar alto
          drawW = targetW
          drawH = targetW / imgRatio
          offsetY = -(drawH - targetH) / 2
        }

        pdf.addImage(img.base64, 'JPEG', PAGE_WIDTH + offsetX, offsetY, drawW, drawH)
      } catch (e) {
        console.error('Cover image error:', e)
      }
    }
  }

  // ==================== SPREAD HISTORIA ====================
  const generateStorySpread = async (
    pdf: jsPDF,
    pageText: { title: string; text: string },
    imageUrl: string | null,
    pageNumber: number,
    childName: string
  ) => {
    pdf.addPage()

    // IZQUIERDA: Texto centrado
    pdf.setFillColor(249, 250, 251)
    pdf.rect(0, 0, PAGE_WIDTH, SPREAD_HEIGHT, 'F')

    // Tamaños de fuente GRANDES para impresión 50cm
    const TITLE_SIZE = 72 // Headline muy grande
    const TEXT_SIZE = 42  // Párrafo grande y legible
    const TITLE_LINE_H = 85
    const TEXT_LINE_H = 55

    // Calcular altura total del contenido para centrar verticalmente
    pdf.setFontSize(TITLE_SIZE)
    pdf.setFont('helvetica', 'bold')
    const titleLines = pdf.splitTextToSize(pageText.title, PAGE_WIDTH - 120)
    const titleHeight = titleLines.length * TITLE_LINE_H

    pdf.setFontSize(TEXT_SIZE)
    pdf.setFont('helvetica', 'normal')
    const text = interpolateText(pageText.text, childName)
    const textLines = pdf.splitTextToSize(text, PAGE_WIDTH - 120)
    const textHeight = textLines.length * TEXT_LINE_H

    const gapAfterTitle = 40
    const gapAfterLine = 50

    const totalHeight = titleHeight + gapAfterTitle + gapAfterLine + textHeight
    let y = (SPREAD_HEIGHT - totalHeight) / 2 + TITLE_LINE_H * 0.7

    // Título GRANDE
    pdf.setTextColor(124, 58, 237)
    pdf.setFontSize(TITLE_SIZE)
    pdf.setFont('helvetica', 'bold')
    titleLines.forEach((line: string) => {
      const w = pdf.getTextWidth(line)
      pdf.text(line, (PAGE_WIDTH - w) / 2, y)
      y += TITLE_LINE_H
    })

    // Línea decorativa
    y += gapAfterTitle - TITLE_LINE_H + 20
    pdf.setDrawColor(124, 58, 237)
    pdf.setLineWidth(3)
    pdf.line(PAGE_WIDTH / 2 - 60, y, PAGE_WIDTH / 2 + 60, y)

    // Texto GRANDE
    y += gapAfterLine
    pdf.setTextColor(55, 65, 81)
    pdf.setFontSize(TEXT_SIZE)
    pdf.setFont('helvetica', 'normal')
    textLines.forEach((line: string) => {
      const w = pdf.getTextWidth(line)
      pdf.text(line, (PAGE_WIDTH - w) / 2, y)
      y += TEXT_LINE_H
    })

    // Número página izq
    pdf.setTextColor(156, 163, 175)
    pdf.setFontSize(16)
    const numL = String((pageNumber * 2) - 1)
    pdf.text(numL, (PAGE_WIDTH - pdf.getTextWidth(numL)) / 2, SPREAD_HEIGHT - 25)

    // DERECHA: Imagen (object-contain con sombra)
    pdf.setFillColor(255, 255, 255)
    pdf.rect(PAGE_WIDTH, 0, PAGE_WIDTH, SPREAD_HEIGHT, 'F')

    if (imageUrl) {
      try {
        const img = await loadImageAsBase64(imageUrl)
        const margin = 30
        const maxW = PAGE_WIDTH - margin * 2
        const maxH = SPREAD_HEIGHT - margin * 2 - 40

        let imgW = maxW
        let imgH = (img.height / img.width) * imgW
        if (imgH > maxH) {
          imgH = maxH
          imgW = (img.width / img.height) * imgH
        }

        const imgX = PAGE_WIDTH + (PAGE_WIDTH - imgW) / 2
        const imgY = (SPREAD_HEIGHT - imgH) / 2 - 10

        // Sombra
        pdf.setFillColor(0, 0, 0)
        pdf.setGState(new pdf.GState({ opacity: 0.1 }))
        pdf.roundedRect(imgX + 8, imgY + 8, imgW, imgH, 8, 8, 'F')
        pdf.setGState(new pdf.GState({ opacity: 1 }))

        // Imagen
        pdf.addImage(img.base64, 'JPEG', imgX, imgY, imgW, imgH)
      } catch (e) {
        console.error(`Image error page ${pageNumber}:`, e)
      }
    }

    // Número página der
    pdf.setTextColor(156, 163, 175)
    pdf.setFontSize(16)
    const numR = String(pageNumber * 2)
    pdf.text(numR, PAGE_WIDTH + (PAGE_WIDTH - pdf.getTextWidth(numR)) / 2, SPREAD_HEIGHT - 25)
  }

  // ==================== CONTRAPORTADA ====================
  const generateBackCover = async (
    pdf: jsPDF,
    storyTexts: StoryTexts,
    childName: string,
    imageUrl: string | null
  ) => {
    pdf.addPage()

    // IZQUIERDA: Mensaje centrado
    pdf.setFillColor(249, 250, 251)
    pdf.rect(0, 0, PAGE_WIDTH, SPREAD_HEIGHT, 'F')

    // Calcular para centrar verticalmente
    pdf.setFontSize(32)
    const msg = interpolateText(storyTexts.backCover.message, childName)
    const msgLines = pdf.splitTextToSize(msg, PAGE_WIDTH - 100)
    const msgHeight = msgLines.length * 45

    pdf.setFontSize(56)
    const finHeight = 60

    const totalHeight = msgHeight + 60 + finHeight
    let y = (SPREAD_HEIGHT - totalHeight) / 2

    // Mensaje (lg:text-2xl)
    pdf.setTextColor(75, 85, 99)
    pdf.setFontSize(32)
    pdf.setFont('helvetica', 'italic')
    msgLines.forEach((line: string) => {
      const w = pdf.getTextWidth(line)
      pdf.text(line, (PAGE_WIDTH - w) / 2, y)
      y += 45
    })

    // Línea
    y += 30
    pdf.setDrawColor(124, 58, 237)
    pdf.setLineWidth(2)
    pdf.line(PAGE_WIDTH / 2 - 35, y, PAGE_WIDTH / 2 + 35, y)

    // Fin (lg:text-4xl)
    y += 50
    pdf.setTextColor(124, 58, 237)
    pdf.setFontSize(56)
    pdf.setFont('helvetica', 'bold')
    const finW = pdf.getTextWidth(storyTexts.backCover.footer)
    pdf.text(storyTexts.backCover.footer, (PAGE_WIDTH - finW) / 2, y)

    // DERECHA: Imagen de la última página (como en Vista Libro)
    if (imageUrl) {
      try {
        const img = await loadImageAsBase64(imageUrl)
        // Object-cover: llenar todo
        const targetW = PAGE_WIDTH
        const targetH = SPREAD_HEIGHT
        const imgRatio = img.width / img.height
        const targetRatio = targetW / targetH

        let drawW, drawH, offsetX = 0, offsetY = 0

        if (imgRatio > targetRatio) {
          drawH = targetH
          drawW = targetH * imgRatio
          offsetX = -(drawW - targetW) / 2
        } else {
          drawW = targetW
          drawH = targetW / imgRatio
          offsetY = -(drawH - targetH) / 2
        }

        pdf.addImage(img.base64, 'JPEG', PAGE_WIDTH + offsetX, offsetY, drawW, drawH)

        // Overlay púrpura semi-transparente
        pdf.setFillColor(124, 58, 237)
        pdf.setGState(new pdf.GState({ opacity: 0.7 }))
        pdf.rect(PAGE_WIDTH, 0, PAGE_WIDTH, SPREAD_HEIGHT, 'F')
        pdf.setGState(new pdf.GState({ opacity: 1 }))
      } catch (e) {
        console.error('Back cover image error:', e)
        // Fallback: solo fondo púrpura
        pdf.setFillColor(124, 58, 237)
        pdf.rect(PAGE_WIDTH, 0, PAGE_WIDTH, SPREAD_HEIGHT, 'F')
      }
    } else {
      // Sin imagen: fondo púrpura con patrón
      pdf.setFillColor(124, 58, 237)
      pdf.rect(PAGE_WIDTH, 0, PAGE_WIDTH, SPREAD_HEIGHT, 'F')

      // Patrón puntos
      pdf.setFillColor(255, 255, 255)
      pdf.setGState(new pdf.GState({ opacity: 0.15 }))
      for (let px = PAGE_WIDTH + 25; px < SPREAD_WIDTH - 25; px += 30) {
        for (let py = 25; py < SPREAD_HEIGHT - 25; py += 30) {
          pdf.circle(px, py, 3, 'F')
        }
      }
      pdf.setGState(new pdf.GState({ opacity: 1 }))
    }
  }

  // ==================== GENERAR PDF ====================
  const generatePdf = async (options: PdfGeneratorOptions) => {
    const { sessionId, session, currentState, useFavorites = true } = options

    try {
      const childName = session.userPhoto?.childName || 'Protagonista'

      const { data: storyTexts, error: textsError } = await useFetch<StoryTexts>(
        `/api/story/${session.storyId}/texts`
      )
      if (textsError.value || !storyTexts.value) {
        throw new Error('No se pudieron cargar los textos')
      }

      // PDF 1000mm x 500mm landscape
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [SPREAD_HEIGHT, SPREAD_WIDTH],
      })

      console.log(`[PDF] Tamaño: ${pdf.internal.pageSize.getWidth()}mm x ${pdf.internal.pageSize.getHeight()}mm`)

      const selectedVersions = currentState.selectedVersions
      const favoriteVersions = currentState.favoriteVersions || {}

      const getImageUrl = (pageNum: number): string | null => {
        if (!selectedVersions[pageNum]) return null
        let version = selectedVersions[pageNum].version
        if (useFavorites && favoriteVersions[pageNum]) {
          version = favoriteVersions[pageNum]
        }
        return `/api/session/${sessionId}/image/${pageNum}?version=${version}`
      }

      // PORTADA
      await generateCover(pdf, storyTexts.value, childName, getImageUrl(1))

      // SPREADS HISTORIA
      const pages = storyTexts.value.pages.sort((a, b) => a.pageNumber - b.pageNumber)
      for (const page of pages) {
        await generateStorySpread(pdf, page, getImageUrl(page.pageNumber), page.pageNumber, childName)
      }

      // CONTRAPORTADA (con última imagen - página 5)
      const lastImageUrl = getImageUrl(5) // Siempre página 5
      console.log('[PDF] Contraportada imagen URL:', lastImageUrl)
      await generateBackCover(pdf, storyTexts.value, childName, lastImageUrl)

      // Descargar
      const safeName = childName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '').replace(/\s+/g, '_')
      pdf.save(`${safeName}_Cuento.pdf`)

      toast.success('PDF generado', 'Libro 100x50cm descargado')
      return { success: true }

    } catch (error: any) {
      console.error('[PDF] Error:', error)
      toast.error('Error', error.message || 'No se pudo generar el PDF')
      return { success: false, error: error.message }
    }
  }

  return { generatePdf }
}
