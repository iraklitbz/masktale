/**
 * Delete Session Endpoint
 * DELETE /api/session/{sessionId}
 *
 * Deletes a session and all its associated data from Strapi
 */

import { deleteSession } from '../../utils/session-manager'

export default defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, 'id')

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required',
      })
    }

    // Delete session from Strapi
    const deleted = await deleteSession(sessionId)

    if (!deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Session not found',
      })
    }

    console.log(`[API] Deleted session ${sessionId} from Strapi`)

    return {
      success: true,
      message: 'Session deleted successfully',
    }
  } catch (error: any) {
    console.error('[API] Error deleting session:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to delete session',
    })
  }
})
