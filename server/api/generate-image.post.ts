import {GoogleGenAI} from '@google/genai'
import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const {prompt, userImage} = await readBody(event)
  const config = useRuntimeConfig()

  const ai = new GoogleGenAI({
    apiKey: config.geminiApiKey,
  })

  try {
    // Leer imagen base desde public/img/test.jpg
    const baseImagePath = path.join(process.cwd(), 'public', 'img', 'test.jpg')
    const baseImageBuffer = fs.readFileSync(baseImagePath)
    const baseImageBase64 = baseImageBuffer.toString('base64')

    // Extraer base64 de la imagen del usuario (viene como data:image/...;base64,...)
    const userImageBase64 = userImage.split(',')[1]

    // Construir prompt optimizado
    const finalPrompt = prompt
      ? `Copy the EXACT style, colors, composition, pose, and body from the first image. Replace ONLY the face/head with the person from the second photo. Maintain all artistic style and composition. ${prompt}`
      : 'Copy the EXACT style, colors, composition, pose, and body from the first image. Replace ONLY the face/head with the person from the second photo. Keep everything else identical: same art style, same background, same clothing, same pose.'

    // Preparar contenido con ambas imágenes
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
          data: userImageBase64,
        },
      },
    ]

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '1:1'
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
