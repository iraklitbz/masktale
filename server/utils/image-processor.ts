/**
 * Image Processing Utilities
 * Using Sharp for image manipulation and optimization
 */

import sharp from 'sharp'

/**
 * Creates a horizontal collage from multiple base64 images
 * Useful for providing multiple angles of a person's face to the AI
 *
 * @param imagesBase64 - Array of base64-encoded images (without data URI prefix)
 * @param targetHeight - Height to resize all images to (default: 300px)
 * @returns Base64-encoded collage image
 */
export async function createImageCollage(
  imagesBase64: string[],
  targetHeight = 300
): Promise<string> {
  // If only 1 image, return it directly
  if (imagesBase64.length === 1) {
    return imagesBase64[0]
  }

  // Convert base64 to buffers
  const imageBuffers = imagesBase64.map(base64 => Buffer.from(base64, 'base64'))

  // Get metadata for each image
  const imageMetadata = await Promise.all(
    imageBuffers.map(buffer => sharp(buffer).metadata())
  )

  // Resize all images to same height
  const resizedBuffers = await Promise.all(
    imageBuffers.map(async (buffer, i) => {
      const meta = imageMetadata[i]
      const aspectRatio = meta.width! / meta.height!
      const targetWidth = Math.round(targetHeight * aspectRatio)

      return sharp(buffer)
        .resize(targetWidth, targetHeight, { fit: 'cover' })
        .toBuffer()
    })
  )

  // Get widths after resizing
  const resizedMeta = await Promise.all(
    resizedBuffers.map(buffer => sharp(buffer).metadata())
  )
  const totalWidth = resizedMeta.reduce((sum, meta) => sum + meta.width!, 0)

  // Create horizontal collage
  const collage = sharp({
    create: {
      width: totalWidth,
      height: targetHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })

  // Compose images horizontally
  let xOffset = 0
  const composites = resizedBuffers.map((buffer, i) => {
    const composite = {
      input: buffer,
      left: xOffset,
      top: 0
    }
    xOffset += resizedMeta[i].width!
    return composite
  })

  const collageBuffer = await collage.composite(composites).jpeg().toBuffer()
  return collageBuffer.toString('base64')
}

/**
 * Optimize and resize an image
 *
 * @param imageBuffer - Input image buffer
 * @param options - Optimization options
 * @returns Optimized image buffer
 */
export async function optimizeImage(
  imageBuffer: Buffer,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number // 0-100
    format?: 'jpeg' | 'png' | 'webp'
  } = {}
): Promise<Buffer> {
  const {
    maxWidth = 1200,
    maxHeight = 1600,
    quality = 85,
    format = 'jpeg'
  } = options

  // First check original metadata
  const originalMetadata = await sharp(imageBuffer).metadata()
  console.log(`[ImageProcessor] Original image: ${originalMetadata.width}x${originalMetadata.height}, orientation: ${originalMetadata.orientation || 'none'}, format: ${originalMetadata.format}`)

  let pipeline = sharp(imageBuffer)
  
  // Auto-rotate based on EXIF orientation and strip metadata
  // This fixes issues with images that have orientation metadata
  pipeline = pipeline.rotate()
  
  // Get metadata after rotation
  const rotatedBuffer = await pipeline.toBuffer()
  const rotatedMetadata = await sharp(rotatedBuffer).metadata()
  console.log(`[ImageProcessor] After rotation: ${rotatedMetadata.width}x${rotatedMetadata.height}`)

  // Re-create pipeline from rotated buffer
  pipeline = sharp(rotatedBuffer)

  // Resize if needed
  if (rotatedMetadata.width! > maxWidth || rotatedMetadata.height! > maxHeight) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
  }

  // Convert to desired format with quality
  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true })
      break
    case 'png':
      pipeline = pipeline.png({ quality })
      break
    case 'webp':
      pipeline = pipeline.webp({ quality })
      break
  }
  
  // Strip all metadata to avoid any EXIF issues
  pipeline = pipeline.withMetadata({ 
    exif: {}, 
    icc: undefined, 
    iptc: undefined, 
    xmp: undefined
  })

  const result = await pipeline.toBuffer()
  const finalMetadata = await sharp(result).metadata()
  console.log(`[ImageProcessor] Final image: ${finalMetadata.width}x${finalMetadata.height}, size: ${result.length} bytes`)
  
  return result
}

/**
 * Get image metadata
 *
 * @param imageBuffer - Input image buffer
 * @returns Image metadata
 */
export async function getImageMetadata(imageBuffer: Buffer) {
  const metadata = await sharp(imageBuffer).metadata()

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: imageBuffer.length,
    aspectRatio: metadata.width && metadata.height
      ? metadata.width / metadata.height
      : 0
  }
}

/**
 * Convert data URL to buffer
 *
 * @param dataUrl - Data URL (e.g., "data:image/png;base64,...")
 * @returns Image buffer and mime type
 */
export function dataUrlToBuffer(dataUrl: string): { buffer: Buffer, mimeType: string } {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)

  if (!matches) {
    throw new Error('Invalid data URL format')
  }

  const mimeType = matches[1]
  const base64Data = matches[2]
  const buffer = Buffer.from(base64Data, 'base64')

  return { buffer, mimeType }
}

/**
 * Convert buffer to base64 data URL
 *
 * @param buffer - Image buffer
 * @param mimeType - MIME type (default: image/png)
 * @returns Data URL
 */
export function bufferToDataUrl(buffer: Buffer, mimeType = 'image/png'): string {
  const base64 = buffer.toString('base64')
  return `data:${mimeType};base64,${base64}`
}
