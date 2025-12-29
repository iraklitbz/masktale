/**
 * Composable for generating professional PDF from story session
 */
import { jsPDF } from 'jspdf'
import type { Session, CurrentState } from '~/types/session'

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
  const loadImageAsBase64 = async (imageUrl: string): Promise<string> => {
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
        resolve(base64)
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
      await generateCoverPage(pdf, session, pageWidth, pageHeight, margin)

      // STORY PAGES
      const selectedVersions = currentState.selectedVersions
      const favoriteVersions = currentState.favoriteVersions || {}
      const versionHistory = currentState.versionHistory || {}

      const pageNumbers = Object.keys(selectedVersions)
        .map(Number)
        .sort((a, b) => a - b)

      for (let i = 0; i < pageNumbers.length; i++) {
        const pageNumber = pageNumbers[i]
        const pageData = session.pages.find(p => p.pageNumber === pageNumber)

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
          const imageBase64 = await loadImageAsBase64(imageUrl)

          // Image dimensions (leave space for text below)
          const imageHeight = pageHeight * 0.6
          const imageWidth = pageWidth - (margin * 2)
          const imageY = margin

          pdf.addImage(
            imageBase64,
            'JPEG',
            margin,
            imageY,
            imageWidth,
            imageHeight,
            undefined,
            'FAST'
          )

          // Add page text below image
          const textY = imageY + imageHeight + 10
          const textMaxWidth = pageWidth - (margin * 2)

          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')

          const splitText = pdf.splitTextToSize(pageData.text, textMaxWidth)
          pdf.text(splitText, margin, textY)

          // Page number at bottom
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'italic')
          pdf.text(
            `${i + 1}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          )

        } catch (err) {
          console.error(`Error loading image for page ${pageNumber}:`, err)
          // Continue with other pages even if one fails
        }
      }

      // BACK COVER (optional)
      await generateBackCover(pdf, session, pageWidth, pageHeight, margin)

      // Download PDF
      const fileName = `${session.childName.replace(/\s+/g, '_')}_${session.storyTitle.replace(/\s+/g, '_')}.pdf`
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

    const titleLines = pdf.splitTextToSize(session.storyTitle, pageWidth - (margin * 2))
    let currentY = pageHeight / 6

    titleLines.forEach((line: string) => {
      pdf.text(line, pageWidth / 2, currentY, { align: 'center' })
      currentY += 12
    })

    // Child's name
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'normal')
    pdf.text(
      `Para ${session.childName}`,
      pageWidth / 2,
      pageHeight / 2,
      { align: 'center' }
    )

    // Story type/theme
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'italic')
    pdf.text(
      session.storyType,
      pageWidth / 2,
      pageHeight / 2 + 15,
      { align: 'center' }
    )

    // Generation date
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text(
      `Creado el ${new Date(session.createdAt).toLocaleDateString('es-ES')}`,
      pageWidth / 2,
      pageHeight - margin,
      { align: 'center' }
    )
  }

  /**
   * Generate back cover
   */
  const generateBackCover = async (
    pdf: jsPDF,
    session: Session,
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
      `para ${session.childName}`,
      '',
      'con amor y magia digital.',
    ]

    let y = pageHeight / 2 - 20
    message.forEach(line => {
      pdf.text(line, pageWidth / 2, y, { align: 'center' })
      y += 8
    })

    // Decorative footer
    pdf.setFontSize(10)
    pdf.text(
      '✨ Fin ✨',
      pageWidth / 2,
      pageHeight - margin,
      { align: 'center' }
    )
  }

  return {
    generatePdf,
  }
}
