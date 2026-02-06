/**
 * Select Version Endpoint
 * POST /api/session/{sessionId}/select-version
 *
 * Changes the currently selected version of a page
 */

import { getSession, selectVersion, getVersionCount } from '../../../utils/session-manager'

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

    // Verify version exists
    const versionCount = await getVersionCount(sessionId, pageNumber)
    if (version > versionCount) {
      throw createError({
        statusCode: 404,
        statusMessage: `Version ${version} not found for page ${pageNumber}`,
      })
    }

    // Update selected version in Strapi
    await selectVersion(sessionId, pageNumber, version)

    return {
      success: true,
      pageNumber,
      version,
    }
  } catch (error: any) {
    console.error('[SelectVersion] Error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to select version',
    })
  }
})
