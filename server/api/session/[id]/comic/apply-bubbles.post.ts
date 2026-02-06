/**
 * Apply Speech Bubbles Endpoint
 * POST /api/session/{sessionId}/comic/apply-bubbles
 *
 * Applies speech bubbles to generated comic images
 */

import {
  getSession,
  getCurrentState,
  getGeneratedImageBuffer,
} from '../../../../utils/session-manager'
import { loadStoryConfig, loadStoryTexts } from '../../../../utils/story-loader'
import { addSpeechBubblesToImage, type SpeechBubbleConfig, type FacePosition } from '../../../../utils/speech-bubble-processor'

interface ApplyBubblesRequest {
  pageNumber?: number // If not provided, applies to all pages
  locale?: string
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

    const body = await readBody<ApplyBubblesRequest>(event)
    const { pageNumber, locale = 'es' } = body

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

    // Check if this is a comic format story
    if (storyConfig.format !== 'comic') {
      throw createError({
        statusCode: 400,
        statusMessage: 'This story is not in comic format',
      })
    }

    // Load texts for the locale
    const texts = await loadStoryTexts(session.storyId, locale)
    if (!texts) {
      throw createError({
        statusCode: 404,
        statusMessage: `Texts not found for locale: ${locale}`,
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

    // Determine which pages to process
    const pagesToProcess = pageNumber
      ? [storyConfig.pages.find((p: any) => p.pageNumber === pageNumber)]
      : storyConfig.pages

    const results: any[] = []

    for (const page of pagesToProcess) {
      if (!page) continue

      // Check if this page has been generated
      const selectedVersion = currentState.selectedVersions[page.pageNumber]
      if (!selectedVersion) {
        console.log(`[Comic] Page ${page.pageNumber} not generated yet, skipping`)
        continue
      }

      // Get speech bubbles config from page
      const pageBubbles = page.speechBubbles
      if (!pageBubbles || pageBubbles.length === 0) {
        console.log(`[Comic] Page ${page.pageNumber} has no speech bubbles defined`)
        continue
      }

      // Get texts for this page
      const pageTexts = texts.pages.find((p: any) => p.pageNumber === page.pageNumber)
      if (!pageTexts || !pageTexts.speechBubbles) {
        console.log(`[Comic] No texts found for page ${page.pageNumber}`)
        continue
      }

      // Log raw data for debugging
      console.log(`[Comic] Page ${page.pageNumber} config bubbles:`, pageBubbles.length)
      console.log(`[Comic] Page ${page.pageNumber} text bubbles:`, pageTexts.speechBubbles?.length || 0)
      
      // Build bubble configs with text
      const bubbleConfigs: SpeechBubbleConfig[] = pageBubbles.map((bubble: any, index: number) => {
        const textConfig = pageTexts.speechBubbles[index]
        console.log(`[Comic] Mapping bubble ${index}:`, {
          config: { type: bubble.type, speaker: bubble.speaker },
          text: textConfig?.text?.substring(0, 30)
        })
        return {
          type: bubble.type || 'speech',
          text: textConfig?.text || '',
          position: bubble.position,
          tailDirection: bubble.tailDirection,
          size: bubble.size || 'medium',
          avoidFace: true, // Enable smart avoid by default
        }
      }).filter((b: SpeechBubbleConfig, index: number) => {
        const hasText = b.text && b.text.trim().length > 0
        if (!hasText) {
          console.log(`[Comic] Filtering out bubble ${index} (no text)`)
        }
        return hasText
      })

      if (bubbleConfigs.length === 0) {
        console.log(`[Comic] No valid bubbles for page ${page.pageNumber}`)
        continue
      }

      // Get the generated image
      const version = selectedVersion.version || 1
      const imageBuffer = await getGeneratedImageBuffer(sessionId, page.pageNumber, version)
      if (!imageBuffer) {
        console.error(`[Comic] Could not read image for page ${page.pageNumber}`)
        continue
      }

      // Extract face position from page metadata for smart avoid
      const facePosition: FacePosition | undefined = page.metadata?.facePosition ? {
        x: page.metadata.facePosition.x,
        y: page.metadata.facePosition.y,
        radius: 0.18 // 18% protection radius around face
      } : undefined

      // Apply speech bubbles
      console.log(`[Comic] Applying ${bubbleConfigs.length} bubbles to page ${page.pageNumber}`)
      console.log(`[Comic] Face position:`, facePosition)
      const processedBuffer = await addSpeechBubblesToImage(
        imageBuffer,
        bubbleConfigs,
        storyConfig.settings.comicSettings || {},
        facePosition
      )

      // Return the processed image as base64
      const imageBase64 = `data:image/png;base64,${processedBuffer.toString('base64')}`

      results.push({
        pageNumber: page.pageNumber,
        image: imageBase64,
        bubblesApplied: bubbleConfigs.length,
      })
    }

    return {
      success: true,
      processed: results.length,
      results,
    }
  } catch (error: any) {
    console.error('[Comic] Error applying bubbles:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to apply speech bubbles',
    })
  }
})
