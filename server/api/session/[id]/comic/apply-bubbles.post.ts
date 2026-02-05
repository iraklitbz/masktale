/**
 * Apply Speech Bubbles Endpoint
 * POST /api/session/{sessionId}/comic/apply-bubbles
 *
 * Applies speech bubbles to generated comic images
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

      // Build bubble configs with text
      const bubbleConfigs: SpeechBubbleConfig[] = pageBubbles.map((bubble: any, index: number) => {
        const textConfig = pageTexts.speechBubbles[index]
        return {
          type: bubble.type || 'speech',
          text: textConfig?.text || '',
          position: bubble.position,
          tailDirection: bubble.tailDirection,
          size: bubble.size || 'medium',
        }
      }).filter((b: SpeechBubbleConfig) => b.text) // Only include bubbles with text

      if (bubbleConfigs.length === 0) {
        console.log(`[Comic] No valid bubbles for page ${page.pageNumber}`)
        continue
      }

      // Get the generated image path
      const version = selectedVersion.version || 1
      const imagePath = getGeneratedImagePath(sessionId, page.pageNumber, version)

      // Read the image
      let imageBuffer: Buffer
      try {
        imageBuffer = await fs.readFile(imagePath)
      } catch {
        console.error(`[Comic] Could not read image: ${imagePath}`)
        continue
      }

      // Apply speech bubbles
      console.log(`[Comic] Applying ${bubbleConfigs.length} bubbles to page ${page.pageNumber}`)
      const processedBuffer = await addSpeechBubblesToImage(
        imageBuffer,
        bubbleConfigs,
        storyConfig.settings.comicSettings || {}
      )

      // Save to a new file (with-bubbles suffix)
      const outputDir = path.dirname(imagePath)
      const outputFilename = `page-${String(page.pageNumber).padStart(2, '0')}-v${version}-comic.png`
      const outputPath = path.join(outputDir, outputFilename)

      await fs.writeFile(outputPath, processedBuffer)
      console.log(`[Comic] Saved comic page to: ${outputPath}`)

      results.push({
        pageNumber: page.pageNumber,
        originalPath: imagePath,
        comicPath: outputPath,
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
