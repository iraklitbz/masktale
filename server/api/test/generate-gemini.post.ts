/**
 * POST /api/test/generate-gemini
 * Test endpoint: generates a single image with Gemini + optional face-swap
 * No Strapi, no sessions — just raw generation for style tuning
 */

import { generateImageWithRetry } from '../../utils/gemini'
import { analyzeCharacterFromPhotos } from '../../utils/character-analyzer'
import { faceSwapWithRetry, faceRestoreWithRetry, type RestoreModel } from '../../utils/face-swap'

interface TestRequest {
  /** Base64 face photo */
  facePhoto: string
  /** Full prompt for Gemini */
  prompt: string
  /** Gemini model to use */
  model: string
  /** Aspect ratio */
  aspectRatio: '3:4' | '4:3' | '1:1' | '16:9'
  /** Whether to analyze character from photo first */
  analyzeCharacter: boolean
  /** Whether to apply face-swap after generation */
  faceSwap: boolean
  /** Face-swap model (for Replicate) */
  faceSwapModel?: string
  /** Whether to apply face restoration */
  faceRestore: boolean
  /** Which restoration model to use: 'codeformer' (default) or 'gfpgan' */
  restoreModel?: RestoreModel
  /** CodeFormer fidelity: 0 = max quality/correction, 1 = max fidelity to input. Default 0.5 */
  codeformerFidelity?: number
}

export default defineEventHandler(async (event) => {
  const body = await readBody<TestRequest>(event)

  if (!body.facePhoto) {
    throw createError({ statusCode: 400, statusMessage: 'facePhoto is required' })
  }
  if (!body.prompt) {
    throw createError({ statusCode: 400, statusMessage: 'prompt is required' })
  }

  const startTime = Date.now()
  let finalPrompt = body.prompt

  // Step 1: Analyze character (optional)
  let characterDescription = ''
  if (body.analyzeCharacter) {
    console.log('[Test:Gemini] Analyzing character from photo...')
    try {
      const analysis = await analyzeCharacterFromPhotos([body.facePhoto])
      characterDescription = analysis.fullDescription
      finalPrompt += `\n\nCHARACTER TO FEATURE:\n${characterDescription}`
      console.log(`[Test:Gemini] Character: ${characterDescription.substring(0, 100)}...`)
    } catch (e: any) {
      console.warn('[Test:Gemini] Character analysis failed:', e.message)
    }
  }

  // Step 2: Generate with Gemini
  console.log(`[Test:Gemini] Generating with model: ${body.model}`)
  console.log(`[Test:Gemini] Prompt: ${finalPrompt.substring(0, 200)}...`)

  let imageBase64 = await generateImageWithRetry(
    {
      prompt: finalPrompt,
      userImagesBase64: [body.facePhoto],
      aspectRatio: body.aspectRatio,
      model: body.model,
    },
    3,
    false,
  )

  const geminiTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[Test:Gemini] Gemini done in ${geminiTime}s`)

  // Step 3: Face-swap (optional)
  let swapTime = '0'
  if (body.faceSwap) {
    const swapStart = Date.now()
    console.log(`[Test:Gemini] Face-swap with model: ${body.faceSwapModel || 'default'}`)
    imageBase64 = await faceSwapWithRetry(
      imageBase64,
      body.facePhoto,
      body.faceSwapModel,
    )
    swapTime = ((Date.now() - swapStart) / 1000).toFixed(1)
    console.log(`[Test:Gemini] Face-swap done in ${swapTime}s`)
  }

  // Step 4: Face restoration (optional)
  let restoreTime = '0'
  const restoreModel = body.restoreModel || 'codeformer'
  const codeformerFidelity = body.codeformerFidelity ?? 0.5
  if (body.faceRestore && body.faceSwap) {
    const restoreStart = Date.now()
    console.log(`[Test:Gemini] Face restoration with ${restoreModel} (fidelity=${codeformerFidelity})...`)
    imageBase64 = await faceRestoreWithRetry(imageBase64, 3, restoreModel, codeformerFidelity)
    restoreTime = ((Date.now() - restoreStart) / 1000).toFixed(1)
    console.log(`[Test:Gemini] Restoration done in ${restoreTime}s`)
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[Test:Gemini] Total: ${totalTime}s`)

  return {
    success: true,
    imageData: `data:image/png;base64,${imageBase64}`,
    characterDescription: characterDescription || undefined,
    timing: {
      gemini: `${geminiTime}s`,
      faceSwap: body.faceSwap ? `${swapTime}s` : 'skipped',
      faceRestore: body.faceRestore ? `${restoreTime}s (${restoreModel})` : 'skipped',
      total: `${totalTime}s`,
    },
  }
})
