/**
 * Upload User Photos Endpoint
 * POST /api/session/{sessionId}/upload-photo
 *
 * Handles upload of user photo for face-swap (stored in Strapi)
 */

import sharp from 'sharp'
import { getSession, updateSessionUserPhoto } from '../../../utils/session-manager'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export default defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, 'id')

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required',
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

    // Parse multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No files uploaded',
      })
    }

    const warnings: string[] = []

    // Extract childName and photo from form data
    let childName = ''
    let photoFile: { data: Buffer; type: string } | null = null

    for (const item of formData) {
      if (item.name === 'childName' && item.data) {
        childName = item.data.toString('utf-8').trim()
      } else if (item.data && item.type) {
        // Take only the first photo for Strapi storage
        if (!photoFile) {
          photoFile = { data: item.data, type: item.type }
        }
      }
    }

    if (!photoFile) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No photo file found',
      })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(photoFile.type)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid file type: ${photoFile.type}. Allowed: JPEG, PNG, WebP`,
      })
    }

    // Validate file size
    if (photoFile.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        statusMessage: `File too large. Maximum size: 10MB`,
      })
    }

    // Analyze image metadata
    const metadata = await sharp(photoFile.data).metadata()
    console.log(`[API] Photo metadata:`, {
      width: metadata.width,
      height: metadata.height,
      density: metadata.density,
      format: metadata.format
    })

    // Check for potentially problematic characteristics
    if (metadata.density && metadata.density > 150) {
      warnings.push(`Photo has high resolution (${metadata.density} DPI). This may cause generation issues.`)
    }

    if (metadata.width && metadata.height &&
        (metadata.width > 4000 || metadata.height > 4000)) {
      warnings.push(`Photo has very large dimensions (${metadata.width}x${metadata.height}). This may cause generation issues.`)
    }

    // Optimize and convert to PNG for consistency
    const optimizedBuffer = await sharp(photoFile.data)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .png({ quality: 90 })
      .toBuffer()

    // Convert to base64 for Gemini API
    const photoBase64 = optimizedBuffer.toString('base64')

    console.log(`[API] Child name: "${childName || 'not provided'}"`)
    console.log(`[API] Optimized photo: ${photoFile.data.length} -> ${optimizedBuffer.length} bytes`)

    // Update session in Strapi with photo
    await updateSessionUserPhoto(sessionId, childName, optimizedBuffer, photoBase64)

    console.log(`[API] Uploaded photo for session ${sessionId} to Strapi`)

    return {
      success: true,
      photosCount: 1,
      photos: [{
        filename: `${sessionId}-photo.png`,
        size: optimizedBuffer.length,
        mimeType: 'image/png',
        metadata: {
          width: metadata.width || 0,
          height: metadata.height || 0,
          density: metadata.density,
        }
      }],
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error: any) {
    console.error('[API] Error uploading photos:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to upload photos',
    })
  }
})
