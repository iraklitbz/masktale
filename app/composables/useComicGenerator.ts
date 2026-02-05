/**
 * Composable for generating comic pages and PDFs
 * Handles comic composition, preview generation, and PDF download
 */
import type { Session, CurrentState } from '~/types/session'

export interface ComicGeneratorOptions {
  sessionId: string
  layout?: string
  locale?: string
  includeBubbles?: boolean
}

export interface ComicPreviewResponse {
  success: boolean
  layout: string
  locale: string
  bubblesIncluded: boolean
  outputPath: string
  imageData: string // base64 data URL
  availableLayouts: string[]
}

export function useComicGenerator() {
  const toast = useToast()

  /**
   * Generate a comic preview (returns base64 image)
   */
  const generatePreview = async (options: ComicGeneratorOptions): Promise<ComicPreviewResponse | null> => {
    try {
      const response = await $fetch<ComicPreviewResponse>(`/api/session/${options.sessionId}/comic/compose`, {
        method: 'POST',
        body: {
          layout: options.layout || 'classic-2-1',
          locale: options.locale || 'es',
          includeBubbles: options.includeBubbles ?? true,
        },
      })

      return response
    } catch (error: any) {
      console.error('[ComicGenerator] Preview error:', error)
      const message = error.data?.message || error.message || 'No se pudo generar la vista previa del comic'
      toast.error('Error', message)
      return null
    }
  }

  /**
   * Download the comic as a PDF
   */
  const downloadPdf = async (options: ComicGeneratorOptions & { session: Session }): Promise<{ success: boolean; error?: string }> => {
    try {
      const childName = options.session.userPhoto?.childName || 'Comic'

      toast.info('Generando PDF', 'Esto puede tardar unos segundos...')

      const response = await $fetch<Blob>('/api/pdf/generate-comic', {
        method: 'POST',
        body: {
          sessionId: options.sessionId,
          layout: options.layout || 'classic-2-1',
          locale: options.locale || 'es',
          includeBubbles: options.includeBubbles ?? true,
        },
        responseType: 'blob',
      })

      // Download the PDF
      const url = URL.createObjectURL(response)
      const a = document.createElement('a')
      a.href = url
      const safeName = childName
        .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '')
        .replace(/\s+/g, '_')
      a.download = `${safeName}_Comic.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('PDF generado', 'Comic A4 descargado')
      return { success: true }
    } catch (error: any) {
      console.error('[ComicGenerator] PDF error:', error)
      const message = error.data?.message || error.message || 'No se pudo generar el PDF del comic'
      toast.error('Error', message)
      return { success: false, error: message }
    }
  }

  return {
    generatePreview,
    downloadPdf,
  }
}
