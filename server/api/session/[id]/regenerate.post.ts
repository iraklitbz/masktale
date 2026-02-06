/**
 * Regenerate Page Endpoint
 * POST /api/session/{sessionId}/regenerate
 *
 * Regenerates a specific page (wrapper around generate endpoint)
 */

import { getSession, getVersionCount } from '../../../utils/session-manager'
import { loadStoryConfig } from '../../../utils/story-loader'

interface RegeneratePageRequest {
  pageNumber: number
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
    const body = await readBody<RegeneratePageRequest>(event)
    const { pageNumber } = body

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

    // Get current version count for this page from Strapi
    const versionCount = await getVersionCount(sessionId, pageNumber)
    if (versionCount === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Page ${pageNumber} has not been generated yet`,
      })
    }

    // Load story config to check max regenerations
    const storyConfig = await loadStoryConfig(session.storyId)

    if (versionCount >= storyConfig.settings.maxRegenerations) {
      throw createError({
        statusCode: 400,
        statusMessage: `Maximum regenerations (${storyConfig.settings.maxRegenerations}) reached for page ${pageNumber}`,
      })
    }

    console.log(`[Regenerate] Page ${pageNumber} - Attempt ${versionCount + 1}/${storyConfig.settings.maxRegenerations}`)

    // Call the existing generate endpoint with regenerate flag
    const result = await $fetch(`/api/session/${sessionId}/generate`, {
      method: 'POST',
      body: {
        pageNumber,
        regenerate: true,
      },
    })

    return {
      success: true,
      pageNumber,
      newVersion: versionCount + 1,
      remaining: storyConfig.settings.maxRegenerations - (versionCount + 1),
      result,
    }
  } catch (error: any) {
    console.error('[Regenerate] Error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to regenerate page',
    })
  }
})
