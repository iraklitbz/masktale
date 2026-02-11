/**
 * Generate Page Endpoint
 * POST /api/session/{sessionId}/generate
 *
 * Generates a single page using Gemini AI.
 *
 * Flow:
 * - Page 1: generate character sheet (if missing) → generate page with photo + sheet
 * - Page 2+: generate page with photo + sheet + page 1 as references
 */

import {
  getSession,
  saveSession,
  getVersionCount,
  saveGeneratedImage,
  getUserPhotoBase64,
  hasCharacterSheet,
  saveCharacterSheet,
  getCharacterSheet,
  getSelectedPageImageBase64,
} from '../../../utils/session-manager'
import { loadStoryConfig, getPagePrompt } from '../../../utils/story-loader'
import { generateImageWithRetry } from '../../../utils/gemini'
import { buildPromptForPage, getGenerationSummary, addConsistencyInstructions } from '../../../utils/prompt-builder'
import { analyzeCharacterFromPhotos } from '../../../utils/character-analyzer'
import { generateCharacterSheet } from '../../../utils/character-sheet'
import { faceSwapWithRetry, faceRestoreWithRetry } from '../../../utils/face-swap'

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

    // Load story config (all style info comes from Strapi)
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

    console.log(`[Generate] Retrieved user photo from Strapi`)

    // Use the model configured in Strapi for this story
    const storyModel = storyConfig.settings.geminiModel
    console.log(`[Generate] Using model from Strapi: ${storyModel}`)

    // ─────────────────────────────────────────────────────
    // Generate character description (text) if not cached
    // ─────────────────────────────────────────────────────
    let characterDescription = characterDescriptionCache[sessionId]
    if (!characterDescription) {
      console.log('[Generate] No character description cached. Analyzing reference photo...')
      try {
        const analysisResult = await analyzeCharacterFromPhotos([photoBase64])
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

    // ─────────────────────────────────────────────────────
    // Character Sheet: generate if missing (page 1 triggers it)
    // ─────────────────────────────────────────────────────
    let characterSheetBase64: string | null = null

    const sheetExists = await hasCharacterSheet(sessionId)

    if (!sheetExists) {
      // Generate character sheet on first page generation
      console.log('[Generate] No character sheet found. Generating character sheet...')
      try {
        characterSheetBase64 = await generateCharacterSheet(
          [photoBase64],
          storyConfig,
          characterDescription
        )

        // Save to Strapi as pageNumber=0
        const sheetBuffer = Buffer.from(characterSheetBase64, 'base64')
        await saveCharacterSheet(sessionId, sheetBuffer)
        console.log('[Generate] Character sheet generated and saved to Strapi')
      } catch (error: any) {
        console.warn('[Generate] Failed to generate character sheet:', error.message)
        console.warn('[Generate] Continuing without character sheet (graceful fallback)')
        characterSheetBase64 = null
      }
    } else {
      // Retrieve existing character sheet
      console.log('[Generate] Retrieving existing character sheet from Strapi...')
      characterSheetBase64 = await getCharacterSheet(sessionId)
      if (characterSheetBase64) {
        console.log('[Generate] Character sheet retrieved successfully')
      } else {
        console.warn('[Generate] Character sheet exists but could not be retrieved')
      }
    }

    // ─────────────────────────────────────────────────────
    // Page 1 reference: for pages 2+ get the selected page 1 image
    // ─────────────────────────────────────────────────────
    let page1Base64: string | null = null

    if (pageNumber > 1) {
      console.log('[Generate] Page 2+: retrieving page 1 as visual reference...')
      page1Base64 = await getSelectedPageImageBase64(sessionId, 1)
      if (page1Base64) {
        console.log('[Generate] Page 1 reference retrieved successfully')
      } else {
        console.warn('[Generate] Could not retrieve page 1 reference')
      }
    }

    // ─────────────────────────────────────────────────────
    // Build reference images array: photo + sheet + page1
    // Gemini supports up to 5 images; we use max 3
    // ─────────────────────────────────────────────────────
    const referenceImages: string[] = [photoBase64]

    if (characterSheetBase64) {
      referenceImages.push(characterSheetBase64)
    }
    if (page1Base64) {
      referenceImages.push(page1Base64)
    }

    console.log(`[Generate] Reference images: ${referenceImages.length} (photo${characterSheetBase64 ? ' + sheet' : ''}${page1Base64 ? ' + page1' : ''})`)

    // ─────────────────────────────────────────────────────
    // Build prompt
    // ─────────────────────────────────────────────────────
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
        characterDescription ? { fullDescription: characterDescription } as any : undefined
      )
    }

    // ─────────────────────────────────────────────────────
    // Add consistency instructions when reference images are present
    // ─────────────────────────────────────────────────────
    finalPrompt = addConsistencyInstructions(finalPrompt, {
      hasCharacterSheet: !!characterSheetBase64,
      hasPage1Reference: !!page1Base64,
      referenceImageCount: referenceImages.length,
    })

    if (characterDescription) {
      console.log('[Generate] Using character description')
    }
    if (storyConfig.metadata.styleProfile) {
      console.log('[Generate] Using detailed style profile for consistency')
    }

    // Ensure generated images never include speech bubbles or text overlays
    // (speech bubbles are composited via HTML in the frontend)
    // Placed BOTH at the start and end of the prompt for maximum emphasis
    const noBubblesInstruction = `ABSOLUTE RULE — ZERO TEXT OR BUBBLES: The generated image must contain ZERO speech bubbles, ZERO dialogue balloons, ZERO thought bubbles, ZERO text overlays, ZERO captions, ZERO written words, ZERO onomatopoeia, and ZERO letters of any kind. Generate ONLY a clean illustration. Speech bubbles will be added separately afterward. Any text or bubble in the image is a critical failure.`
    finalPrompt = `${noBubblesInstruction}\n\n${finalPrompt}\n\n${noBubblesInstruction}`

    // Log the full prompt for debugging
    console.log('[Generate] ===== FULL PROMPT START =====')
    console.log(finalPrompt.substring(0, 500) + (finalPrompt.length > 500 ? '...' : ''))
    console.log('[Generate] ===== FULL PROMPT END =====')

    // ─────────────────────────────────────────────────────
    // Generate image with all reference images
    // ─────────────────────────────────────────────────────
    let generatedImageBase64: string

    try {
      generatedImageBase64 = await generateImageWithRetry(
        {
          prompt: finalPrompt,
          userImagesBase64: referenceImages,
          aspectRatio: page.aspectRatio,
          model: storyModel,
        },
        3, // max retries
        false // useBaseImage = false (prompt-only generation)
      )
    } catch (error: any) {
      // If it fails with all references, try with just the user photo as fallback
      if (referenceImages.length > 1 && error.message?.includes('Candidate has no content')) {
        console.warn('[Generate] Failed with reference images, trying with photo only...')

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
            userImagesBase64: [photoBase64],
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

    // ─────────────────────────────────────────────────────
    // Face-swap: post-process if enabled for this story
    // Only applies to story pages (not character sheet, page 0)
    // ─────────────────────────────────────────────────────
    console.log(`[Generate] Face-swap config:`, JSON.stringify(storyConfig.settings.faceSwap))

    if (storyConfig.settings.faceSwap?.enabled) {
      console.log(`[Generate] Face-swap enabled for story ${session.storyId}. Processing...`)
      generatedImageBase64 = await faceSwapWithRetry(
        generatedImageBase64,
        photoBase64,
        storyConfig.settings.faceSwap.model,
      )

      // Face restoration: clean up artifacts and improve facial detail
      console.log(`[Generate] Running face restoration (GFPGAN)...`)
      generatedImageBase64 = await faceRestoreWithRetry(generatedImageBase64)
    }

    // Save generated image to Strapi
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64')
    const imageUrl = await saveGeneratedImage(sessionId, pageNumber, versionNumber, imageBuffer)

    console.log(`[Generate] Saved to Strapi: ${imageUrl}`)

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
    console.log(`[Generate] Session updated. Progress: ${generatedPages}/${storyConfig.pages.length}`)

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
