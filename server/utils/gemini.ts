/**
 * Google Gemini AI Client Utilities
 * Wrapper for interacting with Google's Gemini API
 */

import { GoogleGenAI } from '@google/genai'
import type { AspectRatio } from '~/types/story'

/**
 * Get configured Gemini client instance
 */
export function getGeminiClient() {
  const config = useRuntimeConfig()

  if (!config.geminiApiKey) {
    throw new Error('NUXT_GEMINI_API_KEY is not configured in environment variables')
  }

  return new GoogleGenAI({
    apiKey: config.geminiApiKey,
  })
}

/**
 * Generate image using Gemini with face-swap
 *
 * @param params - Generation parameters
 * @returns Base64-encoded generated image
 */
export async function generateImageWithGemini(params: {
  prompt: string
  baseImageBase64: string
  userImagesBase64: string | string[]
  aspectRatio?: AspectRatio
  model?: string
}): Promise<string> {
  const {
    prompt,
    baseImageBase64,
    userImagesBase64,
    aspectRatio = '3:4',
    model = 'gemini-2.5-flash-image'
  } = params

  const ai = getGeminiClient()

  // Handle single or multiple user images
  const userImageArray = Array.isArray(userImagesBase64)
    ? userImagesBase64
    : [userImagesBase64]

  // Prepare content: prompt + base image + user images
  const contents = [
    { text: prompt },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: baseImageBase64,
      },
    },
    ...userImageArray.map(imageData => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageData,
      },
    })),
  ]

  console.log(`[Gemini] Generating image with ${userImageArray.length} user image(s)`)

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio,
        },
      },
    })

    // Debug: log full response structure
    console.log('[Gemini] Response structure:', JSON.stringify({
      hasResponse: !!response,
      hasCandidates: !!(response?.candidates),
      candidatesCount: response?.candidates?.length || 0,
    }))

    // Validate response structure
    if (!response) {
      throw new Error('Empty response from Gemini API')
    }

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates in Gemini response')
    }

    const candidate = response.candidates[0]
    if (!candidate) {
      throw new Error('First candidate is undefined')
    }

    // Debug: log candidate details
    console.log('[Gemini] Candidate details:', JSON.stringify({
      hasContent: !!candidate.content,
      hasFinishReason: !!candidate.finishReason,
      finishReason: candidate.finishReason,
      hasSafetyRatings: !!(candidate.safetyRatings),
      safetyRatings: candidate.safetyRatings,
    }))

    if (!candidate.content) {
      const finishReason = candidate.finishReason || 'unknown'
      const safetyRatings = candidate.safetyRatings
      
      // Detect safety-related blocks
      const isSafetyBlock = finishReason?.toLowerCase().includes('safety') || 
                           finishReason?.toLowerCase().includes('block') ||
                           safetyRatings?.some((r: any) => r.probability === 'HIGH' || r.blocked)
      
      if (isSafetyBlock) {
        throw new Error(`SAFETY_BLOCK: Image generation blocked by safety filters. This often happens with adult faces. Finish reason: ${finishReason}`)
      }
      
      throw new Error(`Candidate has no content. Finish reason: ${finishReason}`)
    }

    if (!candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Candidate content has no parts')
    }

    // Extract generated image from response
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data
        console.log('[Gemini] Image generated successfully')
        return imageData
      }
    }

    throw new Error('No image was generated in the response')
  } catch (error: any) {
    console.error('[Gemini] Error generating image:', error.message)
    throw error
  }
}

/**
 * Generate image from text prompt and reference photos only (NO base image)
 * This creates completely new illustrations based on description + character photos
 *
 * @param params - Generation parameters
 * @returns Base64-encoded generated image
 */
export async function generateImageFromPromptOnly(params: {
  prompt: string
  userImagesBase64: string | string[]
  aspectRatio?: AspectRatio
  model?: string
}): Promise<string> {
  const {
    prompt,
    userImagesBase64,
    aspectRatio = '3:4',
    model = 'gemini-2.5-flash-image'
  } = params

  const ai = getGeminiClient()

  // Handle single or multiple user images
  const userImageArray = Array.isArray(userImagesBase64)
    ? userImagesBase64
    : [userImagesBase64]

  // Prepare content: prompt + user reference images ONLY (no base image)
  const contents = [
    { text: prompt },
    ...userImageArray.map(imageData => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageData,
      },
    })),
  ]

  console.log(`[Gemini] Generating NEW image from prompt with ${userImageArray.length} reference photo(s)`)
  console.log(`[Gemini] Mode: Complete generation (NO base image)`)
  console.log(`[Gemini] Model: ${model}`)
  console.log(`[Gemini] Aspect ratio: ${aspectRatio}`)
  console.log(`[Gemini] Image sizes: ${userImageArray.map((img, i) => `img${i+1}=${Math.round(img.length/1024)}KB`).join(', ')}`)

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio,
        },
      },
    })

    // Validate response structure
    if (!response) {
      throw new Error('Empty response from Gemini API')
    }

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates in Gemini response')
    }

    const candidate = response.candidates[0]
    if (!candidate) {
      throw new Error('First candidate is undefined')
    }

    if (!candidate.content) {
      throw new Error('Candidate has no content')
    }

    if (!candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Candidate content has no parts')
    }

    // Extract generated image from response
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data
        console.log('[Gemini] New image generated successfully')
        return imageData
      }
    }

    throw new Error('No image was generated in the response')
  } catch (error: any) {
    console.error('[Gemini] Error generating image:', error.message)
    throw error
  }
}

/**
 * Generate image with automatic retry on failure
 *
 * @param params - Generation parameters
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Base64-encoded generated image
 */
export async function generateImageWithRetry(
  params: Parameters<typeof generateImageWithGemini>[0] | Parameters<typeof generateImageFromPromptOnly>[0],
  maxRetries = 3,
  useBaseImage = false
): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Gemini] Attempt ${attempt}/${maxRetries}`)

      if (useBaseImage && 'baseImageBase64' in params) {
        return await generateImageWithGemini(params)
      } else {
        return await generateImageFromPromptOnly(params as Parameters<typeof generateImageFromPromptOnly>[0])
      }
    } catch (error: any) {
      lastError = error
      console.warn(`[Gemini] Attempt ${attempt} failed:`, error.message)

      if (attempt < maxRetries) {
        // Exponential backoff with jitter: 2s, 4s, 8s... plus random 0-2s
        const baseDelay = Math.pow(2, attempt) * 1000
        const jitter = Math.random() * 2000
        const delay = baseDelay + jitter
        console.log(`[Gemini] Retrying in ${(delay / 1000).toFixed(1)}s...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(
    `Failed to generate image after ${maxRetries} attempts: ${lastError?.message}`
  )
}
