/**
 * Save Edited Bubble Positions
 * POST /api/session/{sessionId}/comic/edit-bubbles
 *
 * Applies custom bubble positions from user editor
 */

import {
  getSession,
  getCurrentState,
  getGeneratedImageBuffer,
} from '../../../../utils/session-manager'
import { loadStoryConfig } from '../../../../utils/story-loader'
import { addSpeechBubblesToImage, type SpeechBubbleConfig } from '../../../../utils/speech-bubble-processor'

interface EditBubblesRequest {
  pageNumber: number
  bubbles: Array<{
    type: 'speech' | 'thought' | 'sfx'
    text: string
    position: { x: number; y: number }
    tailDirection?: string
    size?: 'small' | 'medium' | 'large'
  }>
  locale?: string
}

export default defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, 'id')
    const body = await readBody<EditBubblesRequest>(event)
    const { pageNumber, bubbles, locale = 'es' } = body

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required',
      })
    }

    if (!pageNumber || !bubbles || bubbles.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Page number and bubbles are required',
      })
    }

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

    // Get current state
    const currentState = await getCurrentState(sessionId)
    if (!currentState) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No generated images found',
      })
    }

    // Check if page has been generated
    const selectedVersion = currentState.selectedVersions[pageNumber]
    if (!selectedVersion) {
      throw createError({
        statusCode: 400,
        statusMessage: `Page ${pageNumber} has not been generated yet`,
      })
    }

    // Get the generated image
    const version = selectedVersion.version || 1
    const imageBuffer = await getGeneratedImageBuffer(sessionId, pageNumber, version)
    if (!imageBuffer) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Image not found',
      })
    }

    // Convert bubble configs (use user-provided positions)
    const bubbleConfigs: SpeechBubbleConfig[] = bubbles.map(bubble => ({
      type: bubble.type,
      text: bubble.text,
      position: bubble.position, // User-edited position
      tailDirection: bubble.tailDirection as any,
      size: bubble.size || 'medium',
      avoidFace: false, // Disable smart avoid for user-edited positions
    }))

    // Apply speech bubbles with user positions
    console.log(`[Comic Editor] Applying ${bubbleConfigs.length} user-edited bubbles to page ${pageNumber}`)
    const processedBuffer = await addSpeechBubblesToImage(
      imageBuffer,
      bubbleConfigs,
      storyConfig.settings.comicSettings || {}
      // No facePosition = disable smart avoid
    )

    // Save the custom positions to session state for future reference
    if (!currentState.customBubblePositions) {
      currentState.customBubblePositions = {}
    }
    currentState.customBubblePositions[pageNumber] = {
      bubbles: bubbleConfigs.map(b => ({
        position: b.position,
        appliedAt: new Date().toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    }

    // Import and save current state
    const { saveCurrentState } = await import('../../../../utils/session-manager')
    await saveCurrentState(sessionId, currentState)

    // Return the processed image as base64
    const imageBase64 = `data:image/png;base64,${processedBuffer.toString('base64')}`

    return {
      success: true,
      pageNumber,
      image: imageBase64,
      bubblesApplied: bubbleConfigs.length,
    }
  } catch (error: any) {
    console.error('[Comic Editor] Error saving custom bubbles:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to save custom bubble positions',
    })
  }
})
