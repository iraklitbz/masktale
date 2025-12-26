/**
 * Get Session Endpoint
 * GET /api/session/{sessionId}
 *
 * Retrieves session metadata and current state
 */

import { getSession, getCurrentState } from '../../utils/session-manager'

export default defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, 'id')

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required',
      })
    }

    // Get session metadata
    const session = await getSession(sessionId)

    if (!session) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Session not found or expired',
      })
    }

    // Get current state (may be null if not generated yet)
    const currentState = await getCurrentState(sessionId)

    console.log(`[API] Retrieved session ${sessionId}`)

    return {
      session,
      currentState,
    }
  } catch (error: any) {
    console.error('[API] Error retrieving session:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to retrieve session',
    })
  }
})
