/**
 * Composable for generating professional PDF from story session
 * Uses server-side Puppeteer for high-quality PDF generation with custom fonts
 */
import type { Session, CurrentState } from '~/types/session'

export interface PdfGeneratorOptions {
  sessionId: string
  session: Session
  currentState: CurrentState
  useFavorites?: boolean
}

export function usePdfGenerator() {
  const toast = useToast()

  const generatePdf = async (options: PdfGeneratorOptions) => {
    const { sessionId, session } = options

    try {
      const childName = session.userPhoto?.childName || 'Protagonista'

      toast.info('Generando PDF', 'Esto puede tardar unos segundos...')

      // Call server endpoint to generate PDF
      const response = await $fetch<Blob>('/api/pdf/generate', {
        method: 'POST',
        body: { sessionId },
        responseType: 'blob',
      })

      // Download the PDF
      const url = URL.createObjectURL(response)
      const a = document.createElement('a')
      a.href = url
      const safeName = childName
        .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '')
        .replace(/\s+/g, '_')
      a.download = `${safeName}_Cuento.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('PDF generado', 'Libro 100x50cm descargado')
      return { success: true }

    } catch (error: any) {
      console.error('[PDF] Error:', error)
      const message = error.data?.message || error.message || 'No se pudo generar el PDF'
      toast.error('Error', message)
      return { success: false, error: message }
    }
  }

  return { generatePdf }
}
