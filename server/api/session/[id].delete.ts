/**
 * Delete Session Endpoint
 * DELETE /api/session/{sessionId}
 *
 * Deletes a session and all its associated files (images, metadata)
 */

import fs from 'node:fs/promises'
import path from 'node:path'

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions')

export default defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, 'id')

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required',
      })
    }

    const sessionPath = path.join(SESSIONS_DIR, sessionId)

    // Check if session exists
    try {
      await fs.access(sessionPath)
    } catch {
      throw createError({
        statusCode: 404,
        statusMessage: 'Session not found',
      })
    }

    // Delete entire session directory (including all images)
    await fs.rm(sessionPath, { recursive: true, force: true })

    console.log(`[API] Deleted session ${sessionId} and all associated files`)

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
