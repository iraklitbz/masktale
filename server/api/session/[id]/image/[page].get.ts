/**
 * GET /api/session/:id/image/:page
 * Serves generated page image for a session
 * Query params: version (optional, defaults to current selected version)
 */

import { getSession, getCurrentState, getGeneratedImageBuffer } from '../../../../utils/session-manager'

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'id')
  const pageParam = getRouterParam(event, 'page')
  const query = getQuery(event)

  if (!sessionId || !pageParam) {
    throw createError({
      statusCode: 400,
      message: 'Session ID and page number are required',
    })
  }

  const pageNumber = parseInt(pageParam, 10)
  if (isNaN(pageNumber) || pageNumber < 1) {
    throw createError({
      statusCode: 400,
      message: 'Invalid page number',
    })
  }

  // Get session to verify it exists
  const session = await getSession(sessionId)
  if (!session) {
    throw createError({
      statusCode: 404,
      message: 'Session not found or expired',
    })
  }

  // Determine version to serve
  let version = 1
  if (query.version) {
    version = parseInt(query.version as string, 10)
    if (isNaN(version) || version < 1 || version > 10) {
      throw createError({
        statusCode: 400,
        message: 'Invalid version number',
      })
    }
  } else {
    // Get current selected version from state
    const currentState = await getCurrentState(sessionId)
    if (currentState?.selectedVersions?.[pageNumber]) {
      version = currentState.selectedVersions[pageNumber].version
    }
  }

  // Get image from Strapi
  const imageBuffer = await getGeneratedImageBuffer(sessionId, pageNumber, version)

  if (!imageBuffer) {
    throw createError({
      statusCode: 404,
      message: `Page ${pageNumber} version ${version} not found`,
    })
  }

  // Set appropriate content type
  setResponseHeader(event, 'Content-Type', 'image/png')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000') // Cache for 1 year

  return imageBuffer
})
