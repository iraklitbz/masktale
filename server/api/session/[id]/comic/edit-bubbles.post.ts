/**
 * Save Edited Bubble Positions
 * POST /api/session/{sessionId}/comic/edit-bubbles
 *
 * Applies custom bubble positions from user editor
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import {
  getSession,
  getCurrentState,
  getGeneratedImagePath,
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
    const imagePath = getGeneratedImagePath(sessionId, pageNumber, version)

    let imageBuffer: Buffer
    try {
      imageBuffer = await fs.readFile(imagePath)
    } catch {
      throw createError({
        statusCode: 404,
        statusMessage: `Generated image not found for page ${pageNumber}`,
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

    // Save to a new file (custom suffix)
    const outputDir = path.dirname(imagePath)
    const outputFilename = `page-${String(pageNumber).padStart(2, '0')}-v${version}-custom.png`
    const outputPath = path.join(outputDir, outputFilename)

    await fs.writeFile(outputPath, processedBuffer)
    console.log(`[Comic Editor] Saved custom comic page to: ${outputPath}`)

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

    return {
      success: true,
      pageNumber,
      customPath: outputPath,
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
