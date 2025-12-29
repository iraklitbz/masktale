/**
 * GET /api/session/:id/state
 * Returns session metadata and current state with generated pages
 */

import { getSession, getCurrentState } from '../../../utils/session-manager'

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'id')

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      message: 'Session ID is required',
    })
  }

  // Get session metadata
  const session = await getSession(sessionId)
  if (!session) {
    throw createError({
      statusCode: 404,
      message: 'Session not found or expired',
    })
  }

  // Get current state with page versions
  const currentState = await getCurrentState(sessionId)
  if (!currentState) {
    throw createError({
      statusCode: 404,
      message: 'Session state not found. Generation may not have started yet.',
    })
  }

  return {
    session,
    currentState,
  }
})
