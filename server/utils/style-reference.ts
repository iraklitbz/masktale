/**
 * Style Reference Utilities
 * Helper functions for using style reference images to ensure consistency
 */

import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Load style reference image if available
 *
 * IMPORTANT: This is currently NOT used in generation to avoid overloading
 * the Gemini API with too many images. The style consistency is achieved
 * through detailed styleProfile text descriptions instead.
 *
 * However, this function is kept for future enhancements or if you want
 * to experiment with passing the reference image to the model.
 *
 * @param styleReferencePath - Relative path to style reference image
 * @returns Base64-encoded image or null if not available
 */
export async function loadStyleReference(
  styleReferencePath?: string
): Promise<string | null> {
  if (!styleReferencePath) {
    return null
  }

  try {
    const absolutePath = path.join(process.cwd(), styleReferencePath)
    const buffer = await fs.readFile(absolutePath)
    return buffer.toString('base64')
  } catch (error: any) {
    console.warn('[StyleReference] Failed to load style reference:', error.message)
    return null
  }
}

/**
 * EXPERIMENTAL: Add style reference to prompt
 *
 * If you want to experiment with passing the style reference image
 * to Gemini, you can use this function to add instructions to the prompt.
 *
 * Note: Be aware of Gemini's image input limits when using this.
 *
 * @param basePrompt - Original prompt
 * @param hasStyleReference - Whether a style reference image is included
 * @returns Enhanced prompt
 */
export function addStyleReferenceInstructions(
  basePrompt: string,
  hasStyleReference: boolean
): string {
  if (!hasStyleReference) {
    return basePrompt
  }

  return `${basePrompt}

---

STYLE REFERENCE IMAGE PROVIDED:
The THIRD image shows the exact artistic style you must match. Study it carefully:
- Match the EXACT color treatment and palette
- Use the SAME brush stroke technique and texture
- Maintain IDENTICAL level of detail in backgrounds and characters
- Replicate the same lighting approach
- Keep the same overall artistic aesthetic

Your new illustration must look like it was created by the same artist using the same techniques as the style reference image.`
}

/**
 * Check if style reference should be used
 *
 * Currently returns false to keep style consistency through text descriptions.
 * Set this to true if you want to experiment with passing the reference image.
 */
export function shouldUseStyleReference(): boolean {
  // TODO: This could be configurable per story or via environment variable
  return false
}
