import {GoogleGenAI} from '@google/genai'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

async function createImageCollage(imagesBase64: string[]): Promise<string> {
  // Si solo hay 1 imagen, devolverla directamente
  if (imagesBase64.length === 1) {
    return imagesBase64[0]
  }

  // Convertir base64 a buffers
  const imageBuffers = imagesBase64.map(base64 => Buffer.from(base64, 'base64'))

  // Obtener metadata de cada imagen
  const imageMetadata = await Promise.all(
    imageBuffers.map(buffer => sharp(buffer).metadata())
  )

  // Redimensionar todas las imágenes a la misma altura (300px)
  const targetHeight = 300
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

  // Obtener anchos después de redimensionar
  const resizedMeta = await Promise.all(
    resizedBuffers.map(buffer => sharp(buffer).metadata())
  )
  const totalWidth = resizedMeta.reduce((sum, meta) => sum + meta.width!, 0)

  // Crear collage horizontal
  const collage = sharp({
    create: {
      width: totalWidth,
      height: targetHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })

  // Componer las imágenes horizontalmente
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

export default defineEventHandler(async (event) => {
  const {prompt, userImages, model} = await readBody(event)
  const config = useRuntimeConfig()

  const ai = new GoogleGenAI({
    apiKey: config.geminiApiKey,
  })

  try {
    // Leer imagen base desde public/img/test.jpg
    const baseImagePath = path.join(process.cwd(), 'public', 'img', 'test.jpg')
    const baseImageBuffer = fs.readFileSync(baseImagePath)
    const baseImageBase64 = baseImageBuffer.toString('base64')

    // Extraer base64 de las imágenes del usuario
    const userImagesBase64 = userImages.map((img: string) => img.split(',')[1])
    const imageCount = userImagesBase64.length

    // Crear collage de las fotos del usuario
    console.log(`Creando collage de ${imageCount} imagen(es)...`)
    const collageBase64 = await createImageCollage(userImagesBase64)

    // Construir prompt simplificado (ahora solo son 2 imágenes)
    const personDescription = imageCount === 1
      ? 'the person in the second image'
      : `the person shown in the second image (which shows ${imageCount} photos of the same person from different angles)`

    const finalPrompt = prompt
      ? `Using the first image, EDIT it by replacing ONLY the face/head area with ${personDescription}. Match their exact facial features: eye color, nose, mouth, face shape, skin tone. Make the person have a warm, natural smile. Keep the first image's background, art style, composition, clothing, pose, and colors EXACTLY as they are. Only change the face. ${prompt}`
      : `Using the first image, EDIT it by replacing ONLY the face/head area with ${personDescription}. Match the person's facial features accurately including eye color, face shape. Give the person a warm, natural smile. Keep everything else from the first image unchanged: same background, same illustration style, same composition, same clothing, same pose, same colors. Just swap the face.`

    // Preparar contenido: solo 2 imágenes ahora (base + collage)
    const contents = [
      {text: finalPrompt},
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: baseImageBase64,
        },
      },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: collageBase64,
        },
      },
    ]

    console.log(`Enviando al modelo: test.jpg + collage de ${imageCount} foto(s)...`)

    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash-image',
      contents,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '3:4', // Más vertical - 3 de ancho x 4 de alto
        },
      },
    })

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data
        return {
          success: true,
          image: `data:image/png;base64,${imageData}`,
        }
      }
    }

    throw new Error('No se generó ninguna imagen')
  } catch (error: any) {
    console.error('Error generando imagen:', error)
    console.error('Error completo:', JSON.stringify(error, null, 2))

    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || 'Error generando la imagen',
    })
  }
})
