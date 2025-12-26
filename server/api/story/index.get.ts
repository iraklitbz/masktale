/**
 * Get All Stories Endpoint
 * GET /api/story
 *
 * Returns a simplified list of all available stories
 */

import { getAllStories } from '../../utils/story-loader'
import type { StoryListItem } from '../../../app/types/story'

export default defineEventHandler(async (): Promise<StoryListItem[]> => {
  try {
    const stories = await getAllStories()

    console.log(`[API] Retrieved ${stories.length} stories`)

    return stories
  } catch (error: any) {
    console.error('[API] Error retrieving stories:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve stories',
    })
  }
})
