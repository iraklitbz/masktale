/**
 * Compose Comic Page Endpoint
 * POST /api/session/{sessionId}/comic/compose
 *
 * Composes generated images into a comic page layout with panels
 */

import {
  getSession,
  getCurrentState,
  getGeneratedImageBuffer,
} from '../../../../utils/session-manager'
import { loadStoryConfig } from '../../../../utils/story-loader'
import {
  createComicPage,
  COMIC_LAYOUTS,
  type ComicLayoutConfig,
} from '../../../../utils/comic-layout-processor'
import {
  addSpeechBubblesToImage,
  type SpeechBubbleConfig,
} from '../../../../utils/speech-bubble-processor'

interface ComposeComicRequest {
  layout?: string // Layout template name (default: 'classic-2-1')
  locale?: string // Language for speech bubbles (default: 'es')
  includeBubbles?: boolean // Whether to add speech bubbles (default: true)
}

export default defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, 'id')

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required',
      })
    }

    const body = await readBody<ComposeComicRequest>(event)
    const {
      layout = 'classic-2-1',
      locale = 'es',
      includeBubbles = true,
    } = body

    // Get session
    const session = await getSession(sessionId)
    if (!session) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Session not found',
      })
    }

    // Load story config
    const storyConfig = await loadStoryConfig(session.storyId)

    // Verify this is a comic format story
    if (storyConfig.format !== 'comic') {
      throw createError({
        statusCode: 400,
        statusMessage: 'This story is not in comic format',
      })
    }

    // Get current state
    const currentState = await getCurrentState(sessionId)
    if (!currentState) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No generated images found',
      })
    }

    // Verify all pages are generated
    const totalPages = storyConfig.pages.length
    const generatedPages = Object.keys(currentState.selectedVersions).length

    if (generatedPages < totalPages) {
      throw createError({
        statusCode: 400,
        statusMessage: `Not all pages generated. Generated: ${generatedPages}/${totalPages}`,
      })
    }

    // Load all generated images
    const images: Buffer[] = []
    for (const page of storyConfig.pages) {
      const selectedVersion = currentState.selectedVersions[page.pageNumber]
      if (!selectedVersion) {
        throw createError({
          statusCode: 400,
          statusMessage: `Page ${page.pageNumber} not generated`,
        })
      }

      const imageBuffer = await getGeneratedImageBuffer(
        sessionId,
        page.pageNumber,
        selectedVersion.version || 1
      )

      if (!imageBuffer) {
        throw createError({
          statusCode: 500,
          statusMessage: `Failed to load image for page ${page.pageNumber}`,
        })
      }
      images.push(imageBuffer)
    }

    console.log(`[Comic] Composing ${images.length} images with layout: ${layout}`)

    // Verify layout exists
    if (!COMIC_LAYOUTS[layout]) {
      console.warn(`[Comic] Layout '${layout}' not found, using 'classic-2-1'`)
    }

    // Layout config from story settings
    const layoutConfig: ComicLayoutConfig = {
      borderWidth: storyConfig.settings.comicSettings?.bubbleBorderWidth || 6,
      borderColor: storyConfig.settings.comicSettings?.bubbleBorderColor || '#000000',
      backgroundColor: '#FFFFFF',
    }

    // Create comic page
    let comicBuffer = await createComicPage(images, layout, layoutConfig)

    // Add speech bubbles if requested
    if (includeBubbles) {
      console.log(`[Comic] Loading texts for locale: ${locale}`)

      try {
        const texts = await loadStoryTexts(session.storyId, locale)

        console.log(`[Comic] Texts loaded. Pages with bubbles:`,
          texts.pages.map((p: any) => ({
            pageNumber: p.pageNumber,
            bubbleCount: p.speechBubbles?.length || 0
          }))
        )

        console.log(`[Comic] Config pages with bubbles:`,
          storyConfig.pages.map((p: any) => ({
            pageNumber: p.pageNumber,
            bubbleCount: p.speechBubbles?.length || 0
          }))
        )

        // Build bubble configs for the composed page
        // Note: Bubble positions need to be recalculated based on panel positions
        const composedBubbles = buildComposedBubbleConfigs(
          storyConfig.pages,
          texts.pages,
          layout
        )

        console.log(`[Comic] Composed bubbles:`, composedBubbles.map((b: any) => ({
          type: b.type,
          text: b.text?.substring(0, 30),
          position: b.position
        })))

        if (composedBubbles.length > 0) {
          console.log(`[Comic] Adding ${composedBubbles.length} speech bubbles`)
          comicBuffer = await addSpeechBubblesToImage(
            comicBuffer,
            composedBubbles,
            storyConfig.settings.comicSettings || {}
          )
          console.log(`[Comic] Speech bubbles added successfully`)
        } else {
          console.log(`[Comic] No bubbles to add - composedBubbles is empty`)
        }
      } catch (error: any) {
        console.error(`[Comic] Error loading texts:`, error.message)
        console.warn(`[Comic] Could not load texts for locale '${locale}', skipping bubbles`)
      }
    }

    // Return as base64 for preview (no guardamos en filesystem para serverless)
    const base64Image = comicBuffer.toString('base64')
    console.log(`[Comic] Generated comic, size: ${comicBuffer.length} bytes`)

    return {
      success: true,
      layout,
      locale,
      bubblesIncluded: includeBubbles,
      imageData: `data:image/png;base64,${base64Image}`,
      availableLayouts: Object.keys(COMIC_LAYOUTS),
    }
  } catch (error: any) {
    console.error('[Comic] Error composing comic:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to compose comic page',
    })
  }
})

/**
 * Build bubble configs with positions adjusted for the composed layout
 */
function buildComposedBubbleConfigs(
  pages: any[],
  textPages: any[],
  layoutName: string
): SpeechBubbleConfig[] {
  const layout = COMIC_LAYOUTS[layoutName] || COMIC_LAYOUTS['classic-2-1']
  if (!layout) return []

  const bubbles: SpeechBubbleConfig[] = []

  for (let i = 0; i < pages.length && i < layout.panels.length; i++) {
    const page = pages[i]
    const panel = layout.panels[i]
    if (!panel) continue

    const textPage = textPages.find((t: any) => t.pageNumber === page.pageNumber)

    if (!page.speechBubbles || !textPage?.speechBubbles) continue

    for (let j = 0; j < page.speechBubbles.length; j++) {
      const bubbleConfig = page.speechBubbles[j]
      const textConfig = textPage.speechBubbles[j]

      // Validate text config exists and has non-empty text
      if (!textConfig?.text || textConfig.text.trim().length === 0) {
        console.log(`[Comic] Skipping bubble ${j} on page ${page.pageNumber}: no text or empty text`)
        continue
      }

      // Validate bubble config
      if (!bubbleConfig || !bubbleConfig.position) {
        console.log(`[Comic] Skipping bubble ${j} on page ${page.pageNumber}: invalid bubble config`)
        continue
      }

      // Recalculate position within the composed page
      // Original position is relative to the single image (0-1)
      // New position needs to be relative to the panel's position in the composed page
      const newX = panel.x + bubbleConfig.position.x * panel.width
      const newY = panel.y + bubbleConfig.position.y * panel.height
      
      console.log(`[Comic] Page ${page.pageNumber}, Bubble ${j}:`, {
        panel: { x: panel.x, y: panel.y, w: panel.width, h: panel.height },
        originalPos: bubbleConfig.position,
        newPos: { x: newX.toFixed(3), y: newY.toFixed(3) },
        text: textConfig.text.substring(0, 30)
      })

      bubbles.push({
        type: bubbleConfig.type || 'speech',
        text: textConfig.text,
        position: { x: newX, y: newY },
        tailDirection: bubbleConfig.tailDirection,
        size: bubbleConfig.size || 'medium',
      })
    }
  }

  return bubbles
}
