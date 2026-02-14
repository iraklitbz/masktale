/**
 * POST /api/test/generate-ipadapter
 * Test endpoint: generates image using IP-Adapter Face Inpaint
 * Uses face reference photo + prompt to generate illustration directly
 * No Gemini needed — single step on Replicate
 */

import Replicate from 'replicate'

const MODEL_ID = 'lucataco/ip-adapter-faceid:fb81ef963e74776af72e6f380949013533d46dd5c6228a9e586c57db6303d7cd'

interface IPAdapterRequest {
  /** Base64 face photo */
  facePhoto: string
  /** Text prompt describing the scene */
  prompt: string
  /** Negative prompt */
  negativePrompt?: string
  /** Strength (0-1) */
  strength?: number
  /** Inference steps */
  steps?: number
  /** Width */
  width?: number
  /** Height */
  height?: number
}

export default defineEventHandler(async (event) => {
  const body = await readBody<IPAdapterRequest>(event)

  if (!body.facePhoto) {
    throw createError({ statusCode: 400, statusMessage: 'facePhoto is required' })
  }
  if (!body.prompt) {
    throw createError({ statusCode: 400, statusMessage: 'prompt is required' })
  }

  const config = useRuntimeConfig()
  if (!config.replicateApiToken) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_REPLICATE_API_TOKEN not configured' })
  }

  const replicate = new Replicate({ auth: config.replicateApiToken })
  const startTime = Date.now()

  console.log(`[Test:IPAdapter] Generating with IP-Adapter Face Inpaint`)
  console.log(`[Test:IPAdapter] Prompt: ${body.prompt.substring(0, 200)}...`)
  console.log(`[Test:IPAdapter] Strength: ${body.strength || 0.7}`)
  console.log(`[Test:IPAdapter] Steps: ${body.steps || 30}`)

  const faceImageUri = `data:image/jpeg;base64,${body.facePhoto}`

  try {
    const output = await replicate.run(MODEL_ID, {
      input: {
        face_image: faceImageUri,
        prompt: body.prompt,
        negative_prompt: body.negativePrompt || 'monochrome, lowres, bad anatomy, worst quality, low quality, blurry, photorealistic, photo, 3d render',
        num_inference_steps: body.steps ?? 30,
        width: body.width ?? 768,
        height: body.height ?? 1024,
        num_outputs: 1,
        agree_to_research_only: true,
      },
    })

    // Download result
    let resultUrl: string
    if (Array.isArray(output) && output.length > 0) {
      const first = output[0]
      resultUrl = typeof first === 'string' ? first : typeof first?.url === 'function' ? first.url() : String(first)
    } else if (typeof output === 'string') {
      resultUrl = output
    } else if (output && typeof (output as any).url === 'function') {
      resultUrl = (output as any).url()
    } else {
      throw new Error(`Unexpected output format: ${typeof output}`)
    }

    console.log(`[Test:IPAdapter] Downloading result from: ${String(resultUrl).substring(0, 80)}...`)
    const response = await fetch(resultUrl)
    if (!response.ok) throw new Error(`Failed to download: ${response.status}`)
    const imageBase64 = Buffer.from(await response.arrayBuffer()).toString('base64')

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[Test:IPAdapter] Done in ${totalTime}s`)

    return {
      success: true,
      imageData: `data:image/png;base64,${imageBase64}`,
      timing: {
        ipAdapter: `${totalTime}s`,
        total: `${totalTime}s`,
      },
    }
  } catch (error: any) {
    console.error(`[Test:IPAdapter] Error:`, error.message)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'IP-Adapter generation failed',
    })
  }
})
