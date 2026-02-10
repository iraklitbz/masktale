/**
 * Generate Page Endpoint
 * POST /api/session/{sessionId}/generate
 *
 * Generates a single page using Gemini AI
 */

import {
  getSession,
  saveSession,
  getVersionCount,
  saveGeneratedImage,
  getUserPhotoBase64,
} from '../../../utils/session-manager'
import { loadStoryConfig, getPagePrompt } from '../../../utils/story-loader'
import { generateImageWithRetry } from '../../../utils/gemini'
import { buildPromptForPage, getGenerationSummary } from '../../../utils/prompt-builder'
import { analyzeCharacterFromPhotos } from '../../../utils/character-analyzer'

// In-memory cache for character descriptions (per session)
const characterDescriptionCache: Record<string, string> = {}

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

    // Get current version count for this page from Strapi
    const currentVersionCount = await getVersionCount(sessionId, pageNumber)

    // Check regeneration limit
    if (regenerate && currentVersionCount >= storyConfig.settings.maxRegenerations) {
      throw createError({
        statusCode: 400,
        statusMessage: `Maximum regenerations (${storyConfig.settings.maxRegenerations}) reached for page ${pageNumber}`,
      })
    }

    // Determine version number
    const versionNumber = currentVersionCount + 1

    console.log(
      `[Generate] ${getGenerationSummary(pageNumber, page.metadata, storyConfig.metadata.illustrationStyle)} - Version ${versionNumber}`
    )

    // Update session status
    session.status = 'generating'
    await saveSession(sessionId, session)

    // Get user photo base64 from Strapi
    const photoBase64 = await getUserPhotoBase64(sessionId)
    if (!photoBase64) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User photo not found in session',
      })
    }

    const userPhotosBase64: string[] = [photoBase64]
    console.log(`[Generate] Retrieved user photo from Strapi`)

    // IMPORTANT: Gemini 3 Pro Image supports up to 5 human reference images!
    console.log(`[Generate] NEW MODE: Complete generation (NO base image)`)
    console.log(`[Generate] Using Gemini 3 Pro Image with ${userPhotosBase64.length} reference photo(s)`)

    // Generate character description if not cached
    let characterDescription = characterDescriptionCache[sessionId]
    if (!characterDescription) {
      console.log('[Generate] No character description cached. Analyzing reference photo...')
      try {
        const analysisResult = await analyzeCharacterFromPhotos(userPhotosBase64)
        characterDescription = analysisResult.fullDescription
        characterDescriptionCache[sessionId] = characterDescription
        console.log('[Generate] Character description generated and cached')
      } catch (error: any) {
        console.warn('[Generate] Failed to generate character description:', error.message)
        console.warn('[Generate] Continuing without character description...')
      }
    } else {
      console.log('[Generate] Using cached character description')
    }

    // Load prompt - try full page prompt first, fallback to template system
    let finalPrompt: string
    
    try {
      // Try to get the complete prompt from Strapi story-page
      const pagePrompt = await getPagePrompt(session.storyId, pageNumber)
      
      if (pagePrompt && pagePrompt.length > 50) {
        // Use the complete prompt from Strapi, adding character description
        finalPrompt = pagePrompt
        
        // Add character description if available
        if (characterDescription) {
          finalPrompt += `\n\nCHARACTER TO FEATURE:\n${characterDescription}`
        }
        
        console.log(`[Generate] Using complete prompt from Strapi for page ${pageNumber}`)
      } else {
        throw new Error('Prompt too short or empty, using template fallback')
      }
    } catch (promptError) {
      // Fallback: use template system
      console.warn(`[Generate] Falling back to template system for page ${pageNumber}:`, promptError)
      
      const { getNewPromptTemplate } = await import('../../../utils/story-loader')
      const promptTemplate = await getNewPromptTemplate(session.storyId)
      
      finalPrompt = buildPromptForPage(
        promptTemplate,
        page.metadata,
        storyConfig.metadata.illustrationStyle,
        storyConfig.metadata.styleProfile,
        characterDescription ? { fullDescription: characterDescription } : undefined
      )
    }

    if (characterDescription) {
      console.log('[Generate] Using character description')
    }
    if (storyConfig.metadata.styleProfile) {
      console.log('[Generate] Using detailed style profile for consistency')
    }

    // Ensure generated images never include speech bubbles or text overlays
    // (speech bubbles are composited via HTML in the frontend)
    finalPrompt += `\n\nCRITICAL: Do NOT include any speech bubbles, dialogue balloons, text overlays, captions, or written words in the image. The image must be a clean illustration with NO text or speech bubbles of any kind. Leave space where dialogue might go, but do NOT draw any bubbles or text.`

    // Log the full prompt for debugging
    console.log('[Generate] ===== FULL PROMPT START =====')
    console.log(finalPrompt.substring(0, 500) + (finalPrompt.length > 500 ? '...' : ''))
    console.log('[Generate] ===== FULL PROMPT END =====')

    // Use the model configured in Strapi for this story
    const storyModel = storyConfig.settings.geminiModel
    console.log(`[Generate] Using model from Strapi: ${storyModel}`)

    let generatedImageBase64: string

    try {
      generatedImageBase64 = await generateImageWithRetry(
        {
          prompt: finalPrompt,
          userImagesBase64: userPhotosBase64,
          aspectRatio: page.aspectRatio,
          model: storyModel,
        },
        3, // max retries
        false // useBaseImage = false (NEW MODE)
      )
    } catch (error: any) {
      // If it fails with character description, try without it as fallback
      if (characterDescription && error.message?.includes('Candidate has no content')) {
        console.warn('[Generate] Failed with character description, trying without it...')

        const { getNewPromptTemplate } = await import('../../../utils/story-loader')
        const fallbackTemplate = await getNewPromptTemplate(session.storyId)

        const fallbackPrompt = buildPromptForPage(
          fallbackTemplate,
          page.metadata,
          storyConfig.metadata.illustrationStyle,
          storyConfig.metadata.styleProfile,
          undefined
        )

        console.log('[Generate] ===== FALLBACK PROMPT START =====')
        console.log(fallbackPrompt)
        console.log('[Generate] ===== FALLBACK PROMPT END =====')

        generatedImageBase64 = await generateImageWithRetry(
          {
            prompt: fallbackPrompt,
            userImagesBase64: userPhotosBase64,
            aspectRatio: page.aspectRatio,
            model: storyModel,
          },
          2, // fewer retries for fallback
          false
        )
      } else {
        throw error
      }
    }

    // Save generated image to Strapi
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64')
    const imageUrl = await saveGeneratedImage(sessionId, pageNumber, versionNumber, imageBuffer)

    console.log(`[Generate] ✅ Saved to Strapi: ${imageUrl}`)

    // Update session progress
    // Re-fetch session to get updated progress from Strapi
    console.log('[Generate] Updating session progress...')
    const updatedSession = await getSession(sessionId)
    const generatedPages = updatedSession?.progress.pagesGenerated || 0
    
    console.log(`[Generate] Current progress: ${generatedPages}/${storyConfig.pages.length} pages`)

    if (generatedPages >= storyConfig.pages.length) {
      session.status = 'completed'
      console.log('[Generate] All pages completed!')
    }

    await saveSession(sessionId, session)
    console.log(`[Generate] ✅ Session updated. Progress: ${generatedPages}/${storyConfig.pages.length}`)

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
