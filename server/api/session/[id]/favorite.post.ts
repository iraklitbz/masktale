/**
 * Set Favorite Version Endpoint
 * POST /api/session/{sessionId}/favorite
 *
 * Marks a specific version of a page as favorite
 */

import { getSession, setFavorite, getVersionCount } from '../../../utils/session-manager'

interface SetFavoriteRequest {
  pageNumber: number
  version: number | null // null to unset favorite
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
    const body = await readBody<SetFavoriteRequest>(event)
    const { pageNumber, version } = body

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

    if (version !== null) {
      // Verify version exists
      const versionCount = await getVersionCount(sessionId, pageNumber)
      if (version > versionCount) {
        throw createError({
          statusCode: 404,
          statusMessage: `Version ${version} not found for page ${pageNumber}`,
        })
      }

      // Set favorite in Strapi
      await setFavorite(sessionId, pageNumber, version)
    }

    return {
      success: true,
      pageNumber,
      favoriteVersion: version,
    }
  } catch (error: any) {
    console.error('[SetFavorite] Error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to set favorite version',
    })
  }
})
