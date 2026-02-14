/**
 * Face-Swap & Face Restoration Utilities using Replicate API
 * Post-processes Gemini-generated images to improve facial fidelity
 */

import Replicate from 'replicate'

const DEFAULT_SWAP_MODEL = 'cdingram/face-swap'
const GFPGAN_MODEL = 'tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c'
const CODEFORMER_MODEL = 'sczhou/codeformer:cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2'

/**
 * Known models config: version hashes and input parameter names
 */
const MODEL_CONFIG: Record<string, { version: string, target: string, source: string }> = {
  'cdingram/face-swap': {
    version: 'd1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111',
    target: 'input_image',
    source: 'swap_image',
  },
  'codeplugtech/face-swap': {
    version: '278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34',
    target: 'input_image',
    source: 'swap_image',
  },
  'easel/advanced-face-swap': {
    version: '',
    target: 'target_image',
    source: 'swap_image',
  },
}

function resolveModelId(modelId: string): string {
  if (modelId.includes(':')) return modelId
  const config = MODEL_CONFIG[modelId]
  if (config?.version) return `${modelId}:${config.version}`
  return modelId
}

function getInputParams(modelId: string): { target: string, source: string } {
  const modelName = modelId.split(':')[0]
  const config = MODEL_CONFIG[modelName]
  return config
    ? { target: config.target, source: config.source }
    : { target: 'input_image', source: 'swap_image' }
}

/**
 * Get configured Replicate client instance
 */
export function getReplicateClient(): Replicate {
  const config = useRuntimeConfig()
  if (!config.replicateApiToken) {
    throw new Error('NUXT_REPLICATE_API_TOKEN is not configured in environment variables')
  }
  return new Replicate({ auth: config.replicateApiToken })
}

/**
 * Download Replicate output (FileOutput, string URL, array) to base64
 */
async function outputToBase64(output: unknown): Promise<string> {
  if (output && typeof output === 'object' && typeof (output as any).url === 'function') {
    const resultUrl = (output as any).url()
    console.log(`[Replicate] Downloading from FileOutput URL: ${String(resultUrl).substring(0, 80)}...`)
    const response = await fetch(resultUrl)
    if (!response.ok) throw new Error(`Failed to download result: ${response.status}`)
    return Buffer.from(await response.arrayBuffer()).toString('base64')
  }

  if (output && typeof (output as any).arrayBuffer === 'function') {
    console.log(`[Replicate] Reading output as stream...`)
    return Buffer.from(await (output as any).arrayBuffer()).toString('base64')
  }

  if (typeof output === 'string') {
    console.log(`[Replicate] Downloading from URL: ${output.substring(0, 80)}...`)
    const response = await fetch(output)
    if (!response.ok) throw new Error(`Failed to download result: ${response.status}`)
    return Buffer.from(await response.arrayBuffer()).toString('base64')
  }

  if (Array.isArray(output) && output.length > 0) {
    const first = output[0]
    const url = typeof first === 'string' ? first : typeof first?.url === 'function' ? first.url() : String(first)
    console.log(`[Replicate] Downloading from array output: ${String(url).substring(0, 80)}...`)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to download result: ${response.status}`)
    return Buffer.from(await response.arrayBuffer()).toString('base64')
  }

  throw new Error(`Unexpected Replicate output format: ${typeof output} / ${(output as any)?.constructor?.name}`)
}

/**
 * Run a Replicate model with timeout
 */
async function runWithTimeout(replicate: Replicate, modelId: string, input: Record<string, any>, timeoutMs = 60_000): Promise<unknown> {
  return Promise.race([
    replicate.run(modelId as `${string}/${string}` | `${string}/${string}:${string}`, { input }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Replicate timed out after ${timeoutMs / 1000}s`)), timeoutMs)
    ),
  ])
}

// ─────────────────────────────────────────────────────
// Face Swap
// ─────────────────────────────────────────────────────

export async function faceSwap(
  generatedImageBase64: string,
  facePhotoBase64: string,
  model?: string,
): Promise<string> {
  const replicate = getReplicateClient()
  const modelId = resolveModelId(model || DEFAULT_SWAP_MODEL)

  console.log(`[FaceSwap] Swapping face using model: ${modelId}`)
  console.log(`[FaceSwap] Input image size: ${Math.round(generatedImageBase64.length / 1024)}KB`)
  console.log(`[FaceSwap] Swap image size: ${Math.round(facePhotoBase64.length / 1024)}KB`)

  const inputImageUri = `data:image/jpeg;base64,${generatedImageBase64}`
  const swapImageUri = `data:image/jpeg;base64,${facePhotoBase64}`
  const params = getInputParams(modelId)
  console.log(`[FaceSwap] Using params: ${params.target} + ${params.source}`)

  const output = await runWithTimeout(replicate, modelId, {
    [params.target]: inputImageUri,
    [params.source]: swapImageUri,
  })

  const base64Result = await outputToBase64(output)
  console.log(`[FaceSwap] Success! Result size: ${Math.round(base64Result.length / 1024)}KB`)
  return base64Result
}

export async function faceSwapWithRetry(
  generatedImageBase64: string,
  facePhotoBase64: string,
  model?: string,
  maxRetries = 3,
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[FaceSwap] Attempt ${attempt}/${maxRetries}`)
      return await faceSwap(generatedImageBase64, facePhotoBase64, model)
    } catch (error: any) {
      console.warn(`[FaceSwap] Attempt ${attempt} failed:`, error.message)
      if (attempt < maxRetries) {
        const retryMatch = error.message?.match(/retry_after[":]\s*(\d+)/)
        const delay = retryMatch ? (parseInt(retryMatch[1]) + 2) * 1000 : 10_000
        console.log(`[FaceSwap] Retrying in ${delay / 1000}s...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  console.warn(`[FaceSwap] All ${maxRetries} attempts failed. Returning original image (graceful fallback)`)
  return generatedImageBase64
}

// ─────────────────────────────────────────────────────
// Face Restoration
// ─────────────────────────────────────────────────────

export type RestoreModel = 'codeformer' | 'gfpgan'

/**
 * Restore/enhance face quality using CodeFormer
 * Superior to GFPGAN for eye artifacts, natural skin, and detail preservation
 *
 * @param imageBase64 - Image with face to restore (base64)
 * @param fidelity - 0 = max quality (more AI correction), 1 = max fidelity (preserve input). Default 0.5
 * @returns Base64-encoded image with restored face
 */
export async function faceRestoreCodeFormer(
  imageBase64: string,
  fidelity = 0.5,
): Promise<string> {
  const replicate = getReplicateClient()

  console.log(`[FaceRestore] Restoring face with CodeFormer (fidelity=${fidelity})`)
  console.log(`[FaceRestore] Input size: ${Math.round(imageBase64.length / 1024)}KB`)

  const imageUri = `data:image/jpeg;base64,${imageBase64}`

  const output = await runWithTimeout(replicate, CODEFORMER_MODEL, {
    image: imageUri,
    codeformer_fidelity: fidelity,
    background_enhance: true,
    face_upsample: true,
    upscale: 2,
  }, 60_000)

  const base64Result = await outputToBase64(output)
  console.log(`[FaceRestore] CodeFormer success! Result size: ${Math.round(base64Result.length / 1024)}KB`)
  return base64Result
}

/**
 * Restore/enhance face quality using GFPGAN v1.4
 * Fixes artifacts, eye color issues, and improves facial detail
 *
 * @param imageBase64 - Image with face to restore (base64)
 * @returns Base64-encoded image with restored face
 */
export async function faceRestoreGFPGAN(imageBase64: string): Promise<string> {
  const replicate = getReplicateClient()

  console.log(`[FaceRestore] Restoring face with GFPGAN v1.4`)
  console.log(`[FaceRestore] Input size: ${Math.round(imageBase64.length / 1024)}KB`)

  const imageUri = `data:image/jpeg;base64,${imageBase64}`

  const output = await runWithTimeout(replicate, GFPGAN_MODEL, {
    img: imageUri,
    version: 'v1.4',
    scale: 2,
  }, 30_000)

  const base64Result = await outputToBase64(output)
  console.log(`[FaceRestore] GFPGAN success! Result size: ${Math.round(base64Result.length / 1024)}KB`)
  return base64Result
}

/**
 * Unified face restore dispatcher
 * Routes to CodeFormer (default) or GFPGAN based on model param
 */
export async function faceRestore(
  imageBase64: string,
  model: RestoreModel = 'codeformer',
  codeformerFidelity = 0.5,
): Promise<string> {
  if (model === 'gfpgan') {
    return faceRestoreGFPGAN(imageBase64)
  }
  return faceRestoreCodeFormer(imageBase64, codeformerFidelity)
}

/**
 * Face restoration with graceful fallback
 * If restoration fails, returns the original image
 */
export async function faceRestoreWithRetry(
  imageBase64: string,
  maxRetries = 3,
  model: RestoreModel = 'codeformer',
  codeformerFidelity = 0.5,
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[FaceRestore] Attempt ${attempt}/${maxRetries} (${model})`)
      return await faceRestore(imageBase64, model, codeformerFidelity)
    } catch (error: any) {
      console.warn(`[FaceRestore] Attempt ${attempt} failed:`, error.message)
      if (attempt < maxRetries) {
        const retryMatch = error.message?.match(/retry_after[":]\s*(\d+)/)
        const delay = retryMatch ? (parseInt(retryMatch[1]) + 2) * 1000 : 10_000
        console.log(`[FaceRestore] Retrying in ${delay / 1000}s...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  console.warn(`[FaceRestore] All ${maxRetries} attempts failed. Returning original image (graceful fallback)`)
  return imageBase64
}
