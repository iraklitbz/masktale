/**
 * Upload User Photos Endpoint
 * POST /api/session/{sessionId}/upload-photo
 *
 * Handles upload of 1-3 user photos for face-swap
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { getSession, saveSession, getUserPhotoPath } from '../../../utils/session-manager'

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

    // Validate number of files (1-3)
    if (formData.length > 3) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Maximum 3 photos allowed',
      })
    }

    // Create user photos directory
    const photosDir = getUserPhotoPath(sessionId)
    await fs.mkdir(photosDir, { recursive: true })

    const uploadedPhotos: Array<{
      filename: string
      path: string
      size: number
      mimeType: string
      metadata?: {
        width: number
        height: number
        density?: number
      }
    }> = []
    
    const warnings: string[] = []

    // Extract childName from form data
    let childName = ''
    const fileItems: typeof formData = []

    for (const item of formData) {
      if (item.name === 'childName' && item.data) {
        childName = item.data.toString('utf-8').trim()
      } else {
        fileItems.push(item)
      }
    }

    // Process each file
    for (let i = 0; i < fileItems.length; i++) {
      const file = fileItems[i]

      // Validate file type
      if (!file.type || !ALLOWED_TYPES.includes(file.type)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP`,
        })
      }

      // Validate file size
      if (!file.data || file.data.length > MAX_FILE_SIZE) {
        throw createError({
          statusCode: 400,
          statusMessage: `File too large. Maximum size: 10MB`,
        })
      }

      // Generate filename
      const ext = file.type.split('/')[1]
      const filename = `photo-${i + 1}.${ext}`
      const filepath = path.join(photosDir, filename)

      // Save file
      await fs.writeFile(filepath, file.data)

      // Analyze image metadata
      const metadata = await sharp(file.data).metadata()
      console.log(`[API] Photo ${filename} metadata:`, {
        width: metadata.width,
        height: metadata.height,
        density: metadata.density,
        format: metadata.format
      })

      // Check for potentially problematic characteristics
      if (metadata.density && metadata.density > 150) {
        warnings.push(`Photo ${i + 1} has high resolution (${metadata.density} DPI). This may cause generation issues. Consider using a standard photo.`)
      }
      
      if (metadata.width && metadata.height && 
          (metadata.width > 4000 || metadata.height > 4000)) {
        warnings.push(`Photo ${i + 1} has very large dimensions (${metadata.width}x${metadata.height}). This may cause generation issues.`)
      }

      uploadedPhotos.push({
        filename,
        path: path.relative(process.cwd(), filepath),
        size: file.data.length,
        mimeType: file.type,
        metadata: {
          width: metadata.width || 0,
          height: metadata.height || 0,
          density: metadata.density,
        }
      })

      console.log(`[API] Uploaded photo ${filename} (${file.data.length} bytes)`)
    }

    // Update session
    session.userPhoto = {
      originalPath: uploadedPhotos[0].path,
      uploadedAt: new Date().toISOString(),
      metadata: {
        width: 0, // Will be updated when processing
        height: 0,
        format: uploadedPhotos[0].mimeType.split('/')[1],
        size: uploadedPhotos[0].size,
      },
      childName: childName || undefined,
    }
    session.status = 'photo-uploaded'

    console.log(`[API] Child name: "${childName || 'not provided'}"`);

    await saveSession(sessionId, session)

    console.log(`[API] Uploaded ${uploadedPhotos.length} photo(s) for session ${sessionId}`)

    return {
      success: true,
      photosCount: uploadedPhotos.length,
      photos: uploadedPhotos,
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
