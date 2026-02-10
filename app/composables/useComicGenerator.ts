/**
 * Composable for generating comic preview
 * The PDF generation is now handled directly in ComicPreview.vue component
 */

export interface ComicGeneratorOptions {
  sessionId: string
  layout?: string
  locale?: string
  includeBubbles?: boolean
  quality?: 'preview' | 'full'
}

export interface ComicPreviewResponse {
  success: boolean
  layout: string
  locale: string
  bubblesIncluded: boolean
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
          quality: options.quality || 'preview',
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

  return {
    generatePreview,
  }
}
