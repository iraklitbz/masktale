/**
 * Get Story Texts Endpoint
 * GET /api/story/{storyId}/texts
 *
 * Returns narrative texts for a story in a specific locale
 * Query params:
 *   - locale: Language code (default: 'es')
 */

import { loadStoryTexts, storyExists } from '../../../utils/story-loader'

export default defineEventHandler(async (event) => {
  try {
    const storyId = getRouterParam(event, 'id')

    if (!storyId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Story ID is required',
      })
    }

    // Check if story exists
    const exists = await storyExists(storyId)
    if (!exists) {
      throw createError({
        statusCode: 404,
        statusMessage: `Story ${storyId} not found`,
      })
    }

    // Get locale from query params (default: 'es')
    const query = getQuery(event)
    const locale = (query.locale as string) || 'es'

    // Load story texts
    const texts = await loadStoryTexts(storyId, locale)

    console.log(`[API] Loaded texts for story ${storyId} (${locale})`)

    return texts
  } catch (error: any) {
    console.error('[API] Error getting story texts:', error)

    // If it's already a createError, rethrow
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to load story texts',
    })
  }
})
