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
import { loadStoryConfig, getNewPromptTemplate } from '../../../utils/story-loader'
import { generateImageWithRetry } from '../../../utils/gemini'
import { createImageCollage } from '../../../utils/image-processor'
import { buildPromptForPage, getGenerationSummary } from '../../../utils/prompt-builder'
import { analyzeCharacterFromPhotos } from '../../../utils/character-analyzer'

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

    // Load user photos (NO base image needed for new generation mode)
    const photosDir = getUserPhotoPath(sessionId)
    const photoFiles = await fs.readdir(photosDir)
    const userPhotosBase64: string[] = []

    for (const filename of photoFiles) {
      const filepath = path.join(photosDir, filename)
      const buffer = await fs.readFile(filepath)
      userPhotosBase64.push(buffer.toString('base64'))
    }

    // IMPORTANT: Gemini 3 Pro Image supports up to 5 human reference images!
    // Send all uploaded photos for better facial recognition (max 3)
    // The Pro model can analyze multiple angles for improved likeness
    console.log(`[Generate] NEW MODE: Complete generation (NO base image)`)
    console.log(`[Generate] Using Gemini 3 Pro Image with ${userPhotosBase64.length} reference photo(s)`)
    console.log(`[Generate] Pro model supports up to 5 human images for improved facial accuracy`)

    // Generate character description if this is the first generation
    // Use ALL photos for comprehensive analysis with Pro model
    if (!currentState.characterDescription) {
      console.log('[Generate] No character description found. Analyzing ALL reference photos...')
      try {
        const characterDescription = await analyzeCharacterFromPhotos(userPhotosBase64)
        currentState.characterDescription = characterDescription
        await saveCurrentState(sessionId, currentState)
        console.log('[Generate] Character description generated from multiple angles')
      } catch (error: any) {
        console.warn('[Generate] Failed to generate character description:', error.message)
        console.warn('[Generate] Continuing without character description...')
      }
    } else {
      console.log('[Generate] Using existing character description')
    }

    // Load and build prompt with NEW template (for complete generation)
    const promptTemplate = await getNewPromptTemplate(session.storyId)
    const finalPrompt = buildPromptForPage(
      promptTemplate,
      page.metadata,
      storyConfig.metadata.illustrationStyle,
      storyConfig.metadata.styleProfile,
      currentState.characterDescription
    )

    if (currentState.characterDescription) {
      console.log('[Generate] Using character description:', currentState.characterDescription.fullDescription)
    }
    if (storyConfig.metadata.styleProfile) {
      console.log('[Generate] Using detailed style profile for consistency')
    }

    // Generate with Gemini 3 Pro Image - NEW MODE: NO base image, complete generation
    // Send ALL reference photos (Gemini 3 Pro supports up to 5 human images)
    const generatedImageBase64 = await generateImageWithRetry(
      {
        prompt: finalPrompt,
        userImagesBase64: userPhotosBase64, // Send ALL photos for Pro model analysis
        aspectRatio: page.aspectRatio,
        model: storyConfig.settings.geminiModel,
      },
      3, // max retries
      false // useBaseImage = false (NEW MODE)
    )

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

    // Save as style reference if this is the first successful generation
    if (!currentState.styleReferenceImage && pageNumber === 1 && versionNumber === 1) {
      currentState.styleReferenceImage = path.relative(process.cwd(), outputPath)
      console.log('[Generate] Saved first generation as style reference for consistency')
    }

    // Create version entry
    const newVersion = {
      version: versionNumber,
      generatedAt: new Date().toISOString(),
      imagePath: path.relative(process.cwd(), outputPath),
    }

    // Update current state
    currentState.selectedVersions[pageNumber] = newVersion
    currentState.regenerationCount[pageNumber] = versionNumber

    // NUEVO: Agregar al historial completo de versiones
    if (!currentState.versionHistory) {
      currentState.versionHistory = {}
    }
    if (!currentState.versionHistory[pageNumber]) {
      currentState.versionHistory[pageNumber] = []
    }
    currentState.versionHistory[pageNumber].push(newVersion)

    // NUEVO: Inicializar favoriteVersions si no existe
    if (!currentState.favoriteVersions) {
      currentState.favoriteVersions = {}
    }

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
