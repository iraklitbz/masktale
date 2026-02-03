/**
 * Composable for loading story-specific fonts dynamically
 * Loads fonts only when needed (Vista Libro, PDF preview)
 */

import type { StoryTypography } from '~/types/story'

// Track loaded font kits to avoid duplicate loading
const loadedKits = new Set<string>()

export function useStoryFonts() {
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const error = ref<string | null>(null)

  /**
   * Load fonts from a TypeKit/Google Fonts URL
   */
  async function loadFontKit(kitUrl: string): Promise<boolean> {
    if (!import.meta.client) return false

    // Already loaded
    if (loadedKits.has(kitUrl)) {
      isLoaded.value = true
      return true
    }

    isLoading.value = true
    error.value = null

    try {
      // Check if link already exists
      const existingLink = document.querySelector(`link[href="${kitUrl}"]`)
      if (existingLink) {
        loadedKits.add(kitUrl)
        isLoaded.value = true
        isLoading.value = false
        return true
      }

      // Create and inject the link element
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = kitUrl

      // Wait for the font to load
      await new Promise<void>((resolve, reject) => {
        link.onload = () => resolve()
        link.onerror = () => reject(new Error(`Failed to load font kit: ${kitUrl}`))
        document.head.appendChild(link)
      })

      // Wait a bit for fonts to be applied
      await new Promise(resolve => setTimeout(resolve, 100))

      loadedKits.add(kitUrl)
      isLoaded.value = true
      console.log('[useStoryFonts] Loaded font kit:', kitUrl)
      return true
    } catch (e: any) {
      error.value = e.message || 'Failed to load fonts'
      console.error('[useStoryFonts] Error loading font kit:', e)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load typography configuration for a story
   */
  async function loadTypography(typography: StoryTypography | undefined): Promise<boolean> {
    if (!typography?.kitUrl) {
      // No custom fonts, use defaults
      isLoaded.value = true
      return true
    }

    return loadFontKit(typography.kitUrl)
  }

  /**
   * Get CSS font-family string for headlines
   */
  function getHeadlineFont(typography: StoryTypography | undefined): string {
    if (!typography?.headline) {
      return 'Georgia, serif'
    }
    return typography.headline.family
  }

  /**
   * Get CSS font-family string for body text
   */
  function getBodyFont(typography: StoryTypography | undefined): string {
    if (!typography?.body) {
      return 'Arial, sans-serif'
    }
    return typography.body.family
  }

  /**
   * Get fallback font for PDF (headline)
   */
  function getHeadlineFallback(typography: StoryTypography | undefined): string {
    return typography?.headline?.fallback || 'Georgia, serif'
  }

  /**
   * Get fallback font for PDF (body)
   */
  function getBodyFallback(typography: StoryTypography | undefined): string {
    return typography?.body?.fallback || 'Arial, sans-serif'
  }

  /**
   * Get inline style object for headline
   */
  function getHeadlineStyle(typography: StoryTypography | undefined): Record<string, string> {
    if (!typography?.headline) {
      return { fontFamily: 'Georgia, serif' }
    }
    return {
      fontFamily: typography.headline.family,
      fontWeight: String(typography.headline.weight),
      fontStyle: typography.headline.style || 'normal',
    }
  }

  /**
   * Get inline style object for body text
   */
  function getBodyStyle(typography: StoryTypography | undefined): Record<string, string> {
    if (!typography?.body) {
      return { fontFamily: 'Arial, sans-serif' }
    }
    return {
      fontFamily: typography.body.family,
      fontWeight: String(typography.body.weight),
      fontStyle: typography.body.style || 'normal',
    }
  }

  return {
    // State
    isLoading: readonly(isLoading),
    isLoaded: readonly(isLoaded),
    error: readonly(error),

    // Actions
    loadFontKit,
    loadTypography,

    // Getters
    getHeadlineFont,
    getBodyFont,
    getHeadlineFallback,
    getBodyFallback,
    getHeadlineStyle,
    getBodyStyle,
  }
}
