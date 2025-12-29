/**
 * Select Version Endpoint
 * POST /api/session/{sessionId}/select-version
 *
 * Changes the currently selected version of a page
 */

import { getSession, getCurrentState, saveCurrentState } from '../../../utils/session-manager'

interface SelectVersionRequest {
  pageNumber: number
  version: number
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
    const body = await readBody<SelectVersionRequest>(event)
    const { pageNumber, version } = body

    if (!pageNumber || pageNumber < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid page number is required',
      })
    }

    if (!version || version < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid version number is required',
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

    // Get current state
    const currentState = await getCurrentState(sessionId)
    if (!currentState) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Current state not found',
      })
    }

    // Find the requested version in history
    const versionHistory = currentState.versionHistory?.[pageNumber]
    if (!versionHistory) {
      throw createError({
        statusCode: 404,
        statusMessage: `No version history found for page ${pageNumber}`,
      })
    }

    const requestedVersion = versionHistory.find(v => v.version === version)
    if (!requestedVersion) {
      throw createError({
        statusCode: 404,
        statusMessage: `Version ${version} not found for page ${pageNumber}`,
      })
    }

    // Update selected version
    currentState.selectedVersions[pageNumber] = requestedVersion
    currentState.lastUpdated = new Date().toISOString()

    await saveCurrentState(sessionId, currentState)

    return {
      success: true,
      pageNumber,
      version,
      selectedVersion: requestedVersion,
    }
  } catch (error: any) {
    console.error('[SelectVersion] Error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to select version',
    })
  }
})
