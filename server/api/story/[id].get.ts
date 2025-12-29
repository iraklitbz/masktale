/**
 * Get Story By ID Endpoint
 * GET /api/story/{storyId}
 *
 * Returns full configuration for a specific story
 */

import { loadStoryConfig, storyExists } from '../../utils/story-loader'
import type { StoryConfig } from '../../../app/types/story'

export default defineEventHandler(async (event): Promise<StoryConfig> => {
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

    // Load full config
    const config = await loadStoryConfig(storyId)

    console.log(`[API] Retrieved story config for ${storyId}`)

    return config
  } catch (error: any) {
    console.error('[API] Error retrieving story:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to retrieve story',
    })
  }
})
