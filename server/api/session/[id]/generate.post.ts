/**
 * Generate Page Endpoint
 * POST /api/session/{sessionId}/generate
 *
 * Generates a single page using Gemini AI
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import {
  getSession,
  saveSession,
  getCurrentState,
  saveCurrentState,
  getGeneratedImagePath,
  getUserPhotoPath,
} from '../../../utils/session-manager'
import { loadStoryConfig, getPagePrompt, getBaseImageBase64 } from '../../../utils/story-loader'
import { generateImageWithRetry } from '../../../utils/gemini'
import { createImageCollage } from '../../../utils/image-processor'
import { buildPromptForPage, getGenerationSummary } from '../../../utils/prompt-builder'

interface GeneratePageRequest {
  pageNumber: number
  regenerate?: boolean
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

    // Get request body
    const body = await readBody<GeneratePageRequest>(event)
    const { pageNumber, regenerate = false } = body

    if (!pageNumber || pageNumber < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid page number is required',
      })
    }

    // Get session
    const session = await getSession(sessionId)
    if (!session) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Session not found or expired',
      })
    }

    // Verify photos uploaded
    if (!session.userPhoto) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User photos not uploaded yet',
      })
    }

    // Load story config
    const storyConfig = await loadStoryConfig(session.storyId)
    const page = storyConfig.pages.find(p => p.pageNumber === pageNumber)

    if (!page) {
      throw createError({
        statusCode: 404,
        statusMessage: `Page ${pageNumber} not found in story`,
      })
    }

    // Get or create current state
    let currentState = await getCurrentState(sessionId)
    if (!currentState) {
      currentState = {
        storyId: session.storyId,
        sessionId,
        selectedVersions: {},
        regenerationCount: {},
        lastUpdated: new Date().toISOString(),
      }
    }

    // Check regeneration limit
    const regenCount = currentState.regenerationCount[pageNumber] || 0
    if (regenerate && regenCount >= storyConfig.settings.maxRegenerations) {
      throw createError({
        statusCode: 400,
        statusMessage: `Maximum regenerations (${storyConfig.settings.maxRegenerations}) reached for page ${pageNumber}`,
      })
    }

    // Determine version number
    const versionNumber = regenerate ? regenCount + 1 : 1

    console.log(
      `[Generate] ${getGenerationSummary(pageNumber, page.metadata, storyConfig.metadata.illustrationStyle)} - Version ${versionNumber}`
    )

    // Update session progress
    session.status = 'generating'
    session.progress.currentPage = pageNumber
    await saveSession(sessionId, session)

    // Load base image
    const baseImageBase64 = await getBaseImageBase64(session.storyId, pageNumber)

    // Load user photos and create collage
    const photosDir = getUserPhotoPath(sessionId)
    const photoFiles = await fs.readdir(photosDir)
    const userPhotosBase64: string[] = []

    for (const filename of photoFiles) {
      const filepath = path.join(photosDir, filename)
      const buffer = await fs.readFile(filepath)
      userPhotosBase64.push(buffer.toString('base64'))
    }

    // Create collage from user photos
    const userCollageBase64 = await createImageCollage(userPhotosBase64)

    // Load and build prompt
    const promptTemplate = await getPagePrompt(session.storyId, pageNumber)
    const finalPrompt = buildPromptForPage(
      promptTemplate,
      page.metadata,
      storyConfig.metadata.illustrationStyle
    )

    console.log(`[Generate] Using ${userPhotosBase64.length} user photo(s) as collage`)

    // Generate with Gemini
    const generatedImageBase64 = await generateImageWithRetry({
      prompt: finalPrompt,
      baseImageBase64,
      userImagesBase64: userCollageBase64,
      aspectRatio: page.aspectRatio,
      model: storyConfig.settings.geminiModel,
    })

    // Save generated image
    const generatedDir = path.join(
      process.cwd(),
      'data',
      'sessions',
      sessionId,
      'generated'
    )
    await fs.mkdir(generatedDir, { recursive: true })

    const outputPath = getGeneratedImagePath(sessionId, pageNumber, versionNumber)
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64')
    await fs.writeFile(outputPath, imageBuffer)

    console.log(`[Generate] Saved to ${outputPath}`)

    // Update current state
    currentState.selectedVersions[pageNumber] = {
      version: versionNumber,
      generatedAt: new Date().toISOString(),
      imagePath: path.relative(process.cwd(), outputPath),
    }

    currentState.regenerationCount[pageNumber] = versionNumber
    await saveCurrentState(sessionId, currentState)

    // Update session progress
    const generatedPages = Object.keys(currentState.selectedVersions).length
    session.progress.pagesGenerated = generatedPages
    session.progress.totalPages = storyConfig.pages.length

    if (generatedPages >= storyConfig.pages.length) {
      session.status = 'completed'
      session.progress.completedAt = new Date().toISOString()
    }

    await saveSession(sessionId, session)

    console.log(`[Generate] Progress: ${generatedPages}/${storyConfig.pages.length}`)

    return {
      success: true,
      pageNumber,
      version: versionNumber,
      imageData: `data:image/png;base64,${generatedImageBase64}`,
      progress: {
        current: generatedPages,
        total: storyConfig.pages.length,
        percentage: Math.round((generatedPages / storyConfig.pages.length) * 100),
      },
    }
  } catch (error: any) {
    console.error('[Generate] Error:', error)

    // Log error to session
    const sessionId = getRouterParam(event, 'id')
    if (sessionId) {
      try {
        const session = await getSession(sessionId)
        if (session) {
          const body = await readBody<GeneratePageRequest>(event)
          session.progress.errors.push({
            pageNumber: body.pageNumber,
            attempt: 1,
            error: error.message,
            timestamp: new Date().toISOString(),
          })
          await saveSession(sessionId, session)
        }
      } catch (logError) {
        console.error('[Generate] Failed to log error:', logError)
      }
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to generate page',
    })
  }
})
