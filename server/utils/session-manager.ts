/**
 * Session Manager Utilities
 * Handles creation, retrieval, and cleanup of user sessions via Strapi
 */

import { randomUUID } from 'node:crypto'
import type { Session, SessionStatus, CurrentState, SelectedVersion } from '~/types/session'

const STRAPI_URL = process.env.STRAPI_URL || process.env.NUXT_PUBLIC_STRAPI_URL || 'https://cms.iraklitbz.dev'
const STRAPI_TOKEN = process.env.NUXT_STRAPI_API_TOKEN || ''
const SESSION_EXPIRY_HOURS = 24

/**
 * Fetch from Strapi API with authentication
 */
async function fetchStrapi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${STRAPI_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STRAPI_TOKEN}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`[SessionManager] Strapi error: ${response.status} - ${error}`)
    throw new Error(`Strapi error: ${response.status}`)
  }

  return response.json()
}

/**
 * Upload file to Strapi Media Library
 */
async function uploadToStrapi(
  file: Buffer,
  filename: string,
  mimeType: string = 'image/png'
): Promise<{ id: number; url: string }> {
  const formData = new FormData()
  const blob = new Blob([file], { type: mimeType })
  formData.append('files', blob, filename)

  const response = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRAPI_TOKEN}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Upload failed: ${response.status} - ${error}`)
  }

  const result = await response.json()
  return {
    id: result[0].id,
    url: result[0].url,
  }
}

/**
 * Get Strapi document ID from sessionId
 */
async function getStrapiSessionId(sessionId: string): Promise<{ documentId: string; id: number } | null> {
  try {
    const response = await fetchStrapi<{ data: any[] }>(
      `/api/sessions?filters[sessionId][$eq]=${sessionId}`
    )
    if (response.data && response.data.length > 0) {
      return {
        documentId: response.data[0].documentId,
        id: response.data[0].id,
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Create a new session
 */
export async function createSession(storyId: string): Promise<Session> {
  const sessionId = randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000)

  const sessionData = {
    data: {
      sessionId,
      storyId,
      status: 'created',
      currentPage: 0,
      totalPages: 0,
      expiresAt: expiresAt.toISOString(),
    }
  }

  const response = await fetchStrapi<{ data: any }>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(sessionData),
  })

  console.log(`[SessionManager] Created session ${sessionId} for story ${storyId}`)

  return {
    id: sessionId,
    storyId,
    createdAt: response.data.createdAt,
    expiresAt: expiresAt.toISOString(),
    status: 'created',
    progress: {
      totalPages: 0,
      pagesGenerated: 0,
      errors: [],
    },
  }
}

/**
 * Get an existing session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  try {
    const response = await fetchStrapi<{ data: any[] }>(
      `/api/sessions?filters[sessionId][$eq]=${sessionId}&populate=*`
    )

    if (!response.data || response.data.length === 0) {
      console.log(`[SessionManager] Session ${sessionId} not found`)
      return null
    }

    const data = response.data[0]

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(data.expiresAt)
    if (now > expiresAt) {
      console.log(`[SessionManager] Session ${sessionId} has expired`)
      return null
    }

    // Count generated images for progress
    const imagesResponse = await fetchStrapi<{ data: any[] }>(
      `/api/generated-images?filters[session][sessionId][$eq]=${sessionId}&filters[isSelected][$eq]=true`
    )
    const pagesGenerated = imagesResponse.data?.length || 0

    const session: Session = {
      id: data.sessionId,
      storyId: data.storyId,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      status: data.status as SessionStatus,
      progress: {
        totalPages: data.totalPages || 0,
        pagesGenerated,
        errors: [],
      },
      userPhoto: data.childName ? {
        childName: data.childName,
        originalPath: data.childPhoto?.url ? `${STRAPI_URL}${data.childPhoto.url}` : '',
      } : undefined,
    }

    return session
  } catch (error) {
    console.error(`[SessionManager] Error getting session ${sessionId}:`, error)
    return null
  }
}

/**
 * Save/update session
 */
export async function saveSession(sessionId: string, session: Session): Promise<void> {
  const strapiSession = await getStrapiSessionId(sessionId)
  if (!strapiSession) {
    throw new Error(`Session ${sessionId} not found in Strapi`)
  }

  const updateData = {
    data: {
      status: session.status,
      totalPages: session.progress?.totalPages || 0,
      childName: session.userPhoto?.childName,
    }
  }

  await fetchStrapi(`/api/sessions/${strapiSession.documentId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  })

  console.log(`[SessionManager] Saved session ${sessionId}`)
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus
): Promise<void> {
  const strapiSession = await getStrapiSessionId(sessionId)
  if (!strapiSession) {
    throw new Error(`Session ${sessionId} not found`)
  }

  await fetchStrapi(`/api/sessions/${strapiSession.documentId}`, {
    method: 'PUT',
    body: JSON.stringify({ data: { status } }),
  })

  console.log(`[SessionManager] Updated session ${sessionId} status to ${status}`)
}

/**
 * Update session with user photo info
 */
export async function updateSessionUserPhoto(
  sessionId: string,
  childName: string,
  photoBuffer: Buffer,
  photoBase64: string
): Promise<void> {
  const strapiSession = await getStrapiSessionId(sessionId)
  if (!strapiSession) {
    throw new Error(`Session ${sessionId} not found`)
  }

  // Upload photo to Strapi Media Library
  const uploaded = await uploadToStrapi(photoBuffer, `${sessionId}-photo.png`, 'image/png')

  await fetchStrapi(`/api/sessions/${strapiSession.documentId}`, {
    method: 'PUT',
    body: JSON.stringify({
      data: {
        childName,
        childPhoto: uploaded.id,
        childPhotoBase64: photoBase64,
        status: 'photo_uploaded',
      }
    }),
  })

  console.log(`[SessionManager] Updated session ${sessionId} with user photo`)
}

/**
 * Get user photo base64 for a session
 */
export async function getUserPhotoBase64(sessionId: string): Promise<string | null> {
  try {
    const response = await fetchStrapi<{ data: any[] }>(
      `/api/sessions?filters[sessionId][$eq]=${sessionId}&fields[0]=childPhotoBase64`
    )

    if (response.data && response.data.length > 0) {
      return response.data[0].childPhotoBase64 || null
    }
    return null
  } catch {
    return null
  }
}

/**
 * Save generated image to Strapi
 */
export async function saveGeneratedImage(
  sessionId: string,
  pageNumber: number,
  version: number,
  imageBuffer: Buffer
): Promise<string> {
  const strapiSession = await getStrapiSessionId(sessionId)
  if (!strapiSession) {
    throw new Error(`Session ${sessionId} not found`)
  }

  // Upload image to Strapi Media Library
  const filename = `${sessionId}-page-${pageNumber}-v${version}.png`
  const uploaded = await uploadToStrapi(imageBuffer, filename, 'image/png')

  // Check if this page/version already exists
  const existingResponse = await fetchStrapi<{ data: any[] }>(
    `/api/generated-images?filters[session][documentId][$eq]=${strapiSession.documentId}&filters[pageNumber][$eq]=${pageNumber}&filters[version][$eq]=${version}`
  )

  if (existingResponse.data && existingResponse.data.length > 0) {
    // Update existing
    await fetchStrapi(`/api/generated-images/${existingResponse.data[0].documentId}`, {
      method: 'PUT',
      body: JSON.stringify({
        data: { image: uploaded.id }
      }),
    })
  } else {
    // Create new
    // If this is version 1, mark as selected by default
    const isSelected = version === 1

    await fetchStrapi('/api/generated-images', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          pageNumber,
          version,
          image: uploaded.id,
          isSelected,
          isFavorite: false,
          session: strapiSession.documentId,
        }
      }),
    })
  }

  console.log(`[SessionManager] Saved generated image page ${pageNumber} v${version} for session ${sessionId}`)

  return `${STRAPI_URL}${uploaded.url}`
}

/**
 * Get generated image URL
 */
export async function getGeneratedImageUrl(
  sessionId: string,
  pageNumber: number,
  version: number
): Promise<string | null> {
  try {
    const response = await fetchStrapi<{ data: any[] }>(
      `/api/generated-images?filters[session][sessionId][$eq]=${sessionId}&filters[pageNumber][$eq]=${pageNumber}&filters[version][$eq]=${version}&populate=image`
    )

    if (response.data && response.data.length > 0 && response.data[0].image) {
      return `${STRAPI_URL}${response.data[0].image.url}`
    }
    return null
  } catch {
    return null
  }
}

/**
 * Get generated image buffer (downloads from Strapi)
 */
export async function getGeneratedImageBuffer(
  sessionId: string,
  pageNumber: number,
  version: number
): Promise<Buffer | null> {
  const url = await getGeneratedImageUrl(sessionId, pageNumber, version)
  if (!url) return null

  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

/**
 * Select a version for a page
 */
export async function selectVersion(
  sessionId: string,
  pageNumber: number,
  version: number
): Promise<void> {
  const strapiSession = await getStrapiSessionId(sessionId)
  if (!strapiSession) {
    throw new Error(`Session ${sessionId} not found`)
  }

  // Unselect all versions for this page
  const allVersions = await fetchStrapi<{ data: any[] }>(
    `/api/generated-images?filters[session][documentId][$eq]=${strapiSession.documentId}&filters[pageNumber][$eq]=${pageNumber}`
  )

  for (const img of allVersions.data || []) {
    await fetchStrapi(`/api/generated-images/${img.documentId}`, {
      method: 'PUT',
      body: JSON.stringify({ data: { isSelected: img.version === version } }),
    })
  }

  console.log(`[SessionManager] Selected version ${version} for page ${pageNumber}`)
}

/**
 * Set favorite version for a page
 */
export async function setFavorite(
  sessionId: string,
  pageNumber: number,
  version: number
): Promise<void> {
  const strapiSession = await getStrapiSessionId(sessionId)
  if (!strapiSession) {
    throw new Error(`Session ${sessionId} not found`)
  }

  // Unfavorite all versions for this page, then favorite the selected one
  const allVersions = await fetchStrapi<{ data: any[] }>(
    `/api/generated-images?filters[session][documentId][$eq]=${strapiSession.documentId}&filters[pageNumber][$eq]=${pageNumber}`
  )

  for (const img of allVersions.data || []) {
    await fetchStrapi(`/api/generated-images/${img.documentId}`, {
      method: 'PUT',
      body: JSON.stringify({ data: { isFavorite: img.version === version } }),
    })
  }

  console.log(`[SessionManager] Set favorite version ${version} for page ${pageNumber}`)
}

/**
 * Get current state for a session (selected versions, favorites)
 */
export async function getCurrentState(sessionId: string): Promise<CurrentState | null> {
  try {
    const strapiSession = await getStrapiSessionId(sessionId)
    if (!strapiSession) return null

    const imagesResponse = await fetchStrapi<{ data: any[] }>(
      `/api/generated-images?filters[session][id][$eq]=${strapiSession.id}&populate=image`
    )

    const selectedVersions: Record<number, SelectedVersion> = {}
    const favoriteVersions: Record<number, number> = {}

    for (const img of imagesResponse.data || []) {
      const pageNum = img.pageNumber

      // Track all versions for each page, mark selected
      if (img.isSelected) {
        selectedVersions[pageNum] = {
          version: img.version,
          imagePath: img.image?.url ? `${STRAPI_URL}${img.image.url}` : '',
        }
      }

      // Track favorites
      if (img.isFavorite) {
        favoriteVersions[pageNum] = img.version
      }
    }

    return {
      selectedVersions,
      favoriteVersions,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`[SessionManager] Error getting current state:`, error)
    return null
  }
}

/**
 * Save current state - now a no-op since state is in Strapi
 */
export async function saveCurrentState(
  sessionId: string,
  state: CurrentState
): Promise<void> {
  // State is managed directly in Strapi via selectVersion and setFavorite
  console.log(`[SessionManager] saveCurrentState called (state managed in Strapi)`)
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const strapiSession = await getStrapiSessionId(sessionId)
    if (!strapiSession) return false

    // Delete all generated images first
    const images = await fetchStrapi<{ data: any[] }>(
      `/api/generated-images?filters[session][id][$eq]=${strapiSession.id}`
    )

    for (const img of images.data || []) {
      await fetchStrapi(`/api/generated-images/${img.documentId}`, {
        method: 'DELETE',
      })
    }

    // Delete the session
    await fetchStrapi(`/api/sessions/${strapiSession.documentId}`, {
      method: 'DELETE',
    })

    console.log(`[SessionManager] Deleted session ${sessionId}`)
    return true
  } catch (error) {
    console.error(`[SessionManager] Error deleting session:`, error)
    return false
  }
}

/**
 * Get the count of versions for a page
 */
export async function getVersionCount(sessionId: string, pageNumber: number): Promise<number> {
  try {
    const strapiSession = await getStrapiSessionId(sessionId)
    if (!strapiSession) return 0

    const response = await fetchStrapi<{ data: any[] }>(
      `/api/generated-images?filters[session][id][$eq]=${strapiSession.id}&filters[pageNumber][$eq]=${pageNumber}`
    )

    return response.data?.length || 0
  } catch {
    return 0
  }
}

// Legacy function for backwards compatibility - returns empty string
export function getGeneratedImagePath(
  sessionId: string,
  pageNumber: number,
  version: number
): string {
  console.warn('[SessionManager] getGeneratedImagePath is deprecated, use getGeneratedImageUrl')
  return ''
}

// Legacy function for backwards compatibility - returns empty string
export function getUserPhotoPath(sessionId: string): string {
  console.warn('[SessionManager] getUserPhotoPath is deprecated')
  return ''
}
