/**
 * Get Comic Page for Bubble Editor
 * GET /api/session/{sessionId}/comic/edit-bubbles?page={pageNumber}
 *
 * Returns the generated image and current bubble positions for editing
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import {
  getSession,
  getCurrentState,
  getGeneratedImagePath,
} from '../../../../utils/session-manager'
import { loadStoryConfig } from '../../../../utils/story-loader'

export default defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, 'id')
    const query = getQuery(event)
    const pageNumber = parseInt(query.page as string)
    const locale = (query.locale as string) || 'es'

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required',
      })
    }

    if (!pageNumber || isNaN(pageNumber)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Page number is required',
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

    // Load texts for the locale
    const textsPath = path.join(
      process.cwd(),
      'data',
      'stories',
      session.storyId,
      'texts',
      `${locale}.json`
    )

    let texts: any
    try {
      const textsContent = await fs.readFile(textsPath, 'utf-8')
      texts = JSON.parse(textsContent)
    } catch {
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

    // Find the page
    const page = storyConfig.pages.find((p: any) => p.pageNumber === pageNumber)
    if (!page) {
      throw createError({
        statusCode: 404,
        statusMessage: `Page ${pageNumber} not found`,
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

    // Get page texts
    const pageTexts = texts.pages.find((p: any) => p.pageNumber === pageNumber)

    // Get bubble configurations
    const bubbles = page.speechBubbles?.map((bubble: any, index: number) => {
      const textConfig = pageTexts?.speechBubbles?.[index]
      return {
        id: `bubble-${index}`,
        type: bubble.type || 'speech',
        text: textConfig?.text || '',
        originalPosition: bubble.position,
        currentPosition: bubble.position, // Will be updated if smart avoid was applied
        tailDirection: bubble.tailDirection,
        size: bubble.size || 'medium',
        speaker: bubble.speaker,
      }
    }) || []

    // Get face position
    const facePosition = page.metadata?.facePosition || null

    // Convert image to base64
    const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`

    return {
      success: true,
      pageNumber,
      image: imageBase64,
      bubbles,
      facePosition,
      imageDimensions: {
        width: 1400,  // Standard size
        height: 1867,
      },
    }
  } catch (error: any) {
    console.error('[Comic] Error loading bubble editor:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to load bubble editor',
    })
  }
})
