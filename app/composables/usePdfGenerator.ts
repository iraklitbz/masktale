/**
 * Composable for generating professional PDF from story session
 */
import { jsPDF } from 'jspdf'
import type { Session, CurrentState } from '~/types/session'
import type { StoryConfig } from '~/types/story'

export interface PdfGeneratorOptions {
  sessionId: string
  session: Session
  currentState: CurrentState
  useFavorites?: boolean
}

export function usePdfGenerator() {
  const toast = useToast()

  /**
   * Load image as base64 for embedding in PDF
   */
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
          reject(new Error('No se pudo crear el contexto del canvas'))
          return
        }

        ctx.drawImage(img, 0, 0)
        const base64 = canvas.toDataURL('image/jpeg', 0.9)
        resolve({
          base64,
          width: img.width,
          height: img.height,
        })
      }

      img.onerror = () => {
        reject(new Error(`No se pudo cargar la imagen: ${imageUrl}`))
      }

      img.src = imageUrl
    })
  }

  /**
   * Generate and download PDF
   */
  const generatePdf = async (options: PdfGeneratorOptions) => {
    const { sessionId, session, currentState, useFavorites = true } = options

    try {
      // Fetch story configuration to get page texts
      const { data: storyConfig, error: storyError } = await useFetch<StoryConfig>(
        `/api/story/${session.storyId}`
      )

      if (storyError.value || !storyConfig.value) {
        throw new Error('No se pudo cargar la configuración del cuento')
      }

      // Create PDF (A4 size)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15

      // COVER PAGE
      await generateCoverPage(pdf, session, storyConfig.value, pageWidth, pageHeight, margin)

      // STORY PAGES
      const selectedVersions = currentState.selectedVersions
      const favoriteVersions = currentState.favoriteVersions || {}
      const versionHistory = currentState.versionHistory || {}

      const pageNumbers = Object.keys(selectedVersions)
        .map(Number)
        .sort((a, b) => a - b)

      for (let i = 0; i < pageNumbers.length; i++) {
        const pageNumber = pageNumbers[i]
        const pageData = storyConfig.value.pages.find(p => p.pageNumber === pageNumber)

        if (!pageData) continue

        // Determine which version to use
        let versionToUse = selectedVersions[pageNumber].version

        // Use favorite version if available and useFavorites is true
        if (useFavorites && favoriteVersions[pageNumber]) {
          versionToUse = favoriteVersions[pageNumber]
        }

        // Get image URL
        const imageUrl = `/api/session/${sessionId}/image/${pageNumber}?version=${versionToUse}`

        // Add new page
        pdf.addPage()

        // Load and add image
        try {
          const imageData = await loadImageAsBase64(imageUrl)

          // Calculate dimensions maintaining aspect ratio
          const maxWidth = pageWidth - (margin * 2)
          const maxHeight = pageHeight * 0.6

          // Calculate aspect ratio
          const imgAspectRatio = imageData.width / imageData.height

          let finalWidth = maxWidth
          let finalHeight = maxWidth / imgAspectRatio

          // If height exceeds max, scale by height instead
          if (finalHeight > maxHeight) {
            finalHeight = maxHeight
            finalWidth = maxHeight * imgAspectRatio
          }

          // Center image horizontally
          const imageX = (pageWidth - finalWidth) / 2
          const imageY = margin

          pdf.addImage(
            imageData.base64,
            'JPEG',
            imageX,
            imageY,
            finalWidth,
            finalHeight,
            undefined,
            'FAST'
          )

          // Add page text below image
          const textY = imageY + finalHeight + 10
          const textMaxWidth = pageWidth - (margin * 2)

          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')

          const splitText = pdf.splitTextToSize(pageData.text, textMaxWidth)
          pdf.text(splitText, margin, textY)

          // Page number at bottom
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'italic')
          const pageNumText = `${i + 1}`
          const pageNumWidth = pdf.getTextWidth(pageNumText)
          pdf.text(pageNumText, (pageWidth - pageNumWidth) / 2, pageHeight - 10)

        } catch (err) {
          console.error(`Error loading image for page ${pageNumber}:`, err)
          // Continue with other pages even if one fails
        }
      }

      // BACK COVER (optional)
      await generateBackCover(pdf, session, storyConfig.value, pageWidth, pageHeight, margin)

      // Download PDF
      const childName = String(storyConfig.value.childName || 'Cuento')
      const storyTitle = String(storyConfig.value.title || 'Personalizado')
      const fileName = `${childName.replace(/\s+/g, '_')}_${storyTitle.replace(/\s+/g, '_')}.pdf`
      pdf.save(fileName)

      toast.success('PDF generado', 'Tu cuento se ha descargado correctamente')
      return { success: true }

    } catch (error: any) {
      console.error('[usePdfGenerator] Error:', error)
      toast.error('Error al generar PDF', error.message || 'No se pudo generar el PDF')
      return { success: false, error: error.message }
    }
  }

  /**
   * Generate cover page
   */
  const generateCoverPage = async (
    pdf: jsPDF,
    session: Session,
    storyConfig: StoryConfig,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ) => {
    // Background gradient effect (simple colored rectangle)
    pdf.setFillColor(124, 58, 237) // Purple
    pdf.rect(0, 0, pageWidth, pageHeight / 3, 'F')

    // Story title
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(28)
    pdf.setFont('helvetica', 'bold')

    const titleLines = pdf.splitTextToSize(storyConfig.title || 'Cuento Personalizado', pageWidth - (margin * 2))
    let currentY = pageHeight / 6

    titleLines.forEach((line: string) => {
      const textWidth = pdf.getTextWidth(line)
      const x = (pageWidth - textWidth) / 2
      pdf.text(line, x, currentY)
      currentY += 12
    })

    // Child's name
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'normal')
    const childText = `Para ${storyConfig.childName || 'ti'}`
    const childTextWidth = pdf.getTextWidth(childText)
    pdf.text(childText, (pageWidth - childTextWidth) / 2, pageHeight / 2)

    // Story type/theme
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'italic')
    const typeText = storyConfig.theme || 'Aventura'
    const typeTextWidth = pdf.getTextWidth(typeText)
    pdf.text(typeText, (pageWidth - typeTextWidth) / 2, pageHeight / 2 + 15)

    // Generation date
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    const dateText = `Creado el ${new Date(session.createdAt).toLocaleDateString('es-ES')}`
    const dateTextWidth = pdf.getTextWidth(dateText)
    pdf.text(dateText, (pageWidth - dateTextWidth) / 2, pageHeight - margin)
  }

  /**
   * Generate back cover
   */
  const generateBackCover = async (
    pdf: jsPDF,
    session: Session,
    storyConfig: StoryConfig,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ) => {
    pdf.addPage()

    // Simple back cover with decorative element
    pdf.setFillColor(250, 250, 250)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')

    // Message
    pdf.setTextColor(100, 100, 100)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'italic')

    const message = [
      'Este cuento fue creado especialmente',
      `para ${storyConfig.childName || 'ti'}`,
      '',
      'con amor y magia digital.',
    ]

    let y = pageHeight / 2 - 20
    message.forEach(line => {
      const lineWidth = pdf.getTextWidth(line)
      const x = (pageWidth - lineWidth) / 2
      pdf.text(line, x, y)
      y += 8
    })

    // Decorative footer
    pdf.setFontSize(10)
    const footerText = '✨ Fin ✨'
    const footerWidth = pdf.getTextWidth(footerText)
    pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - margin)
  }

  return {
    generatePdf,
  }
}
