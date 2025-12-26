/**
 * Create Session Endpoint
 * POST /api/session/create
 *
 * Creates a new session for a specific story
 */

import { createSession } from '../../utils/session-manager'
import type { CreateSessionRequest, CreateSessionResponse } from '../../../app/types/session'

export default defineEventHandler(async (event): Promise<CreateSessionResponse> => {
  try {
    const body = await readBody<CreateSessionRequest>(event)

    // Validate request
    if (!body.storyId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'storyId is required',
      })
    }

    // TODO: Validate that story exists (will implement in Phase 3)
    // For now, accept any storyId

    // Create session
    const session = await createSession(body.storyId)

    console.log(`[API] Created session ${session.id} for story ${body.storyId}`)

    return {
      sessionId: session.id,
      expiresAt: session.expiresAt,
      storyId: session.storyId,
    }
  } catch (error: any) {
    console.error('[API] Error creating session:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to create session',
    })
  }
})
