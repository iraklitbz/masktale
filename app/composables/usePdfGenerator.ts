/**
 * Composable for generating professional PDF from story session
 * DISEÑO IDÉNTICO A BookPreview.vue - 1000mm x 500mm spread
 */
import {jsPDF} from 'jspdf'
import type {Session, CurrentState} from '~/types/session'
import type {StoryTexts, StoryConfig, StoryTypography} from '~/types/story'

export interface PdfGeneratorOptions {
  sessionId: string
  session: Session
  currentState: CurrentState
  useFavorites?: boolean
}

// Font mapping for jsPDF (maps fallback fonts to jsPDF font names)
// jsPDF only supports: helvetica, times, courier with styles: normal, bold, italic, bolditalic
const FONT_MAP: Record<string, { name: string; style: string }> = {
  // Serif fonts -> Times
  'Georgia, serif': { name: 'times', style: 'normal' },
  'Times New Roman, serif': { name: 'times', style: 'normal' },
  // Sans-serif fonts -> Helvetica
  'Arial, sans-serif': { name: 'helvetica', style: 'normal' },
  'Helvetica, sans-serif': { name: 'helvetica', style: 'normal' },
  // Monospace -> Courier
  'Courier, monospace': { name: 'courier', style: 'normal' },
}

// Get jsPDF font from fallback
function getJsPDFFont(fallback: string): { name: string; style: string } {
  const font = FONT_MAP[fallback]
  if (font) {
    return font
  }
  // Try to detect font type from fallback string
  if (fallback.includes('serif') && !fallback.includes('sans')) {
    return { name: 'times', style: 'normal' }
  }
  return { name: 'helvetica', style: 'normal' }
}

// Spread: 1000mm x 500mm (100cm x 50cm)
const SPREAD_WIDTH = 1000
const SPREAD_HEIGHT = 500
const PAGE_WIDTH = 500 // cada mitad

export function usePdfGenerator() {
  const toast = useToast()

  // Helper to set global opacity safely with TypeScript
  const setOpacity = (pdf: jsPDF, opacity: number) => {
    const anyPdf = pdf as any
    if (anyPdf?.setGState && anyPdf?.GState) {
      anyPdf.setGState(new anyPdf.GState({opacity}))
    }
  }

  // Helper to round positions/sizes to reduce anti-aliasing seams
  const r2 = (n: number) => Math.round(n * 100) / 100

  const interpolateText = (text: string, childName: string): string => {
    return text.replace(/\{childName}/g, childName)
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
    imageUrl: string | null,
    fonts: { headline: { name: string; style: string }; body: { name: string; style: string } }
  ) => {
    // IZQUIERDA: Fondo púrpura con degradado simulado más suave
    // Simulamos un degradado vertical del púrpura al rosa con bandas
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      const r = Math.round(124 + (219 - 124) * t) // 124->219
      const g = Math.round(58 + (39 - 58) * t)    // 58->39
      const b = Math.round(237 + (119 - 237) * t) // 237->119
      pdf.setFillColor(r, g, b)
      const bandY = (SPREAD_HEIGHT / 10) * i
      pdf.rect(0, bandY, PAGE_WIDTH, SPREAD_HEIGHT / 10, 'F')
    }

    // Contenido centrado verticalmente
    const centerY = SPREAD_HEIGHT / 2

    // Título muy grande, todo en blanco (usando fuente headline en BOLD)
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(72)
    pdf.setFont(fonts.headline.name, 'bold')
    const titleLines = pdf.splitTextToSize(storyTexts.cover.title, PAGE_WIDTH - 80)
    let y = centerY - 120

    titleLines.forEach((line: string) => {
      const w = pdf.getTextWidth(line)
      pdf.text(line, (PAGE_WIDTH - w) / 2, y)
      y += 78
    })

    // Tagline (blanco, usando fuente body en itálica)
    pdf.setFontSize(28)
    pdf.setFont(fonts.body.name, 'italic')
    pdf.setTextColor(255, 255, 255)
    const tagW = pdf.getTextWidth(storyTexts.cover.tagline)
    pdf.text(storyTexts.cover.tagline, (PAGE_WIDTH - tagW) / 2, y + 20)

    // Línea decorativa en blanco
    y += 60
    pdf.setDrawColor(255, 255, 255)
    pdf.setLineWidth(3)
    pdf.line(PAGE_WIDTH / 2 - 60, y, PAGE_WIDTH / 2 + 60, y)

    // Subtítulo (blanco, usando fuente body normal)
    y += 45
    pdf.setFontSize(24)
    pdf.setFont(fonts.body.name, 'normal')
    pdf.setTextColor(255, 255, 255)
    const subW = pdf.getTextWidth(storyTexts.cover.subtitle)
    pdf.text(storyTexts.cover.subtitle, (PAGE_WIDTH - subW) / 2, y)

    // Nombre del niño (blanco, grande, usando fuente headline en BOLD)
    y += 60
    pdf.setFontSize(60)
    pdf.setFont(fonts.headline.name, 'bold')
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

        pdf.addImage(img.base64, 'JPEG', PAGE_WIDTH + r2(offsetX), r2(offsetY), r2(drawW), r2(drawH))
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
    childName: string,
    fonts: { headline: { name: string; style: string }; body: { name: string; style: string } }
  ) => {
    pdf.addPage()

    // IZQUIERDA: Texto centrado
    pdf.setFillColor(249, 250, 251)
    pdf.rect(0, 0, PAGE_WIDTH, SPREAD_HEIGHT, 'F')

    // Tamaños de fuente GRANDES para impresión 50cm
    const TITLE_SIZE = 72 // Headline muy grande
    const TEXT_SIZE = 42  // Párrafo grande y legible
    const TITLE_LINE_H = 85
    const TEXT_LINE_H = 34

    // Calcular altura total del contenido para centrar verticalmente
    pdf.setFontSize(TITLE_SIZE)
    pdf.setFont(fonts.headline.name, 'bold')
    const titleLines = pdf.splitTextToSize(pageText.title, PAGE_WIDTH - 120)

    pdf.setFontSize(TEXT_SIZE)
    pdf.setFont(fonts.body.name, 'normal')
    const text = interpolateText(pageText.text, childName)
    const textLines = pdf.splitTextToSize(text, PAGE_WIDTH - 120)
    const textHeight = textLines.length * TEXT_LINE_H

    const gapAfterTitle = 40
    const gapAfterLine = 50

    const totalHeight = titleLines.length * TITLE_LINE_H + gapAfterTitle + gapAfterLine + textHeight
    let y = (SPREAD_HEIGHT - totalHeight) / 2 + TITLE_LINE_H * 0.7

    // Título GRANDE (usando fuente headline en BOLD)
    pdf.setTextColor(124, 58, 237)
    pdf.setFontSize(TITLE_SIZE)
    pdf.setFont(fonts.headline.name, 'bold')
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

    // Texto GRANDE (usando fuente body normal)
    y += gapAfterLine
    pdf.setTextColor(55, 65, 81)
    pdf.setFontSize(TEXT_SIZE)
    pdf.setFont(fonts.body.name, 'normal')
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

    // DERECHA: Imagen (sin sombra)
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

        // Imagen sin sombra: eliminamos el rectángulo de sombra para evitar borde gris
        pdf.addImage(img.base64, 'JPEG', r2(imgX), r2(imgY), r2(imgW), r2(imgH))
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
    imageUrl: string | null,
    fonts: { headline: { name: string; style: string }; body: { name: string; style: string } }
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

    // Mensaje (lg:text-2xl, usando fuente body en itálica)
    pdf.setTextColor(75, 85, 99)
    pdf.setFontSize(32)
    pdf.setFont(fonts.body.name, 'italic')
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

    // Fin (lg:text-4xl, usando fuente headline en BOLD)
    y += 50
    pdf.setTextColor(124, 58, 237)
    pdf.setFontSize(56)
    pdf.setFont(fonts.headline.name, 'bold')
    const finW = pdf.getTextWidth(storyTexts.backCover.footer)
    pdf.text(storyTexts.backCover.footer, (PAGE_WIDTH - finW) / 2, y)

    // DERECHA: Imagen de la última página sin overlay
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

        pdf.addImage(img.base64, 'JPEG', PAGE_WIDTH + r2(offsetX), r2(offsetY), r2(drawW), r2(drawH))
        // Quitamos overlay púrpura para que coincida con "Visita Libro"
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
      setOpacity(pdf, 0.15)
      for (let px = PAGE_WIDTH + 25; px < SPREAD_WIDTH - 25; px += 30) {
        for (let py = 25; py < SPREAD_HEIGHT - 25; py += 30) {
          pdf.circle(px, py, 3, 'F')
        }
      }
      setOpacity(pdf, 1)
    }
  }

  // ==================== GENERAR PDF ====================
  const generatePdf = async (options: PdfGeneratorOptions) => {
    const {sessionId, session, currentState, useFavorites = true} = options

    try {
      const childName = session.userPhoto?.childName || 'Protagonista'

      // Load texts and config in parallel
      const [{data: storyTexts, error: textsError}, {data: storyConfig}] = await Promise.all([
        useFetch<StoryTexts>(`/api/story/${session.storyId}/texts`),
        useFetch<StoryConfig>(`/api/story/${session.storyId}`),
      ])

      if (textsError.value || !storyTexts.value) {
        throw new Error('No se pudieron cargar los textos')
      }

      // Get typography configuration
      const typography = storyConfig.value?.typography
      const headlineFont = getJsPDFFont(typography?.headline?.fallback || 'Georgia, serif')
      const bodyFont = getJsPDFFont(typography?.body?.fallback || 'Arial, sans-serif')

      console.log('[PDF] Using fonts:', { headline: headlineFont, body: bodyFont })

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

      // Preparar objeto de fuentes para las funciones de generación
      const fonts = { headline: headlineFont, body: bodyFont }

      // PORTADA
      await generateCover(pdf, storyTexts.value, childName, getImageUrl(1), fonts)

      // SPREADS HISTORIA
      const pages = storyTexts.value.pages.sort((a, b) => a.pageNumber - b.pageNumber)
      for (const page of pages) {
        await generateStorySpread(pdf, page, getImageUrl(page.pageNumber), page.pageNumber, childName, fonts)
      }

      // CONTRAPORTADA (con última imagen - página 5)
      const lastImageUrl = getImageUrl(5) // Siempre página 5
      console.log('[PDF] Contraportada imagen URL:', lastImageUrl)
      await generateBackCover(pdf, storyTexts.value, childName, lastImageUrl, fonts)

      // Descargar
      const safeName = childName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '').replace(/\s+/g, '_')
      pdf.save(`${safeName}_Cuento.pdf`)

      toast.success('PDF generado', 'Libro 100x50cm descargado')
      return {success: true}

    } catch (error: any) {
      console.error('[PDF] Error:', error)
      toast.error('Error', error.message || 'No se pudo generar el PDF')
      return {success: false, error: error.message}
    }
  }

  return {generatePdf}
}
