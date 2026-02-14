/**
 * Prompt Builder Utilities
 * Builds dynamic prompts by replacing template variables
 */

import type { StoryPage, PageMetadata, StyleProfile } from '~/types/story'
import type { CharacterDescription } from '~/types/session'
import { formatCharacterDescriptionForPrompt } from './character-analyzer'

/**
 * Build a complete prompt for a specific page
 * Replaces template variables with actual values
 *
 * @param promptTemplate - The prompt template text with variables
 * @param pageMetadata - Metadata for the specific page
 * @param illustrationStyle - Story illustration style
 * @param styleProfile - Detailed style profile for consistency (optional)
 * @param characterDescription - AI-generated character description (optional)
 * @param customInstructions - Optional custom instructions from user
 * @returns Complete prompt ready for Gemini
 */
export function buildPromptForPage(
  promptTemplate: string,
  pageMetadata: PageMetadata,
  illustrationStyle: string,
  styleProfile?: StyleProfile,
  characterDescription?: CharacterDescription,
  customInstructions?: string
): string {
  let prompt = promptTemplate

  // Build style profile section
  const styleProfileText = styleProfile
    ? `STYLE SPECIFICATIONS (MUST FOLLOW EXACTLY):
- Technique: ${styleProfile.technique}
- Color Palette: ${styleProfile.colorPalette}
- Line Work: ${styleProfile.lineWork}
- Texture: ${styleProfile.texture}
- Lighting: ${styleProfile.lighting}
- Detail Level: ${styleProfile.detailLevel}
- Atmosphere: ${styleProfile.atmosphere}
${styleProfile.artisticReferences ? `- Artistic References: ${styleProfile.artisticReferences}` : ''}`
    : `Style: ${illustrationStyle}`

  // Build character description section
  const characterDescriptionText = characterDescription
    ? formatCharacterDescriptionForPrompt(characterDescription)
    : `Analyze the child's features carefully from the reference photos provided.`

  // Replace variables
  const replacements: Record<string, string> = {
    '{SCENE_DESCRIPTION}': pageMetadata.sceneDescription,
    '{EMOTIONAL_TONE}': pageMetadata.emotionalTone,
    '{ILLUSTRATION_STYLE}': illustrationStyle,
    '{STYLE_PROFILE}': styleProfileText,
    '{CHARACTER_DESCRIPTION}': characterDescriptionText,
    '{FACE_POSITION_X}': pageMetadata.facePosition.x.toString(),
    '{FACE_POSITION_Y}': pageMetadata.facePosition.y.toString(),
    '{DIFFICULTY}': pageMetadata.difficulty,
  }

  // Replace each variable
  for (const [variable, value] of Object.entries(replacements)) {
    prompt = prompt.replace(new RegExp(variable, 'g'), value)
  }

  // Add custom instructions if provided
  if (customInstructions && customInstructions.trim()) {
    prompt += `\n\nADDITIONAL INSTRUCTIONS: ${customInstructions}`
  }

  return prompt.trim()
}

/**
 * Build a simplified prompt for quick generation
 * Used for regeneration or testing
 *
 * @param sceneDescription - What's happening in the scene
 * @param emotionalTone - Emotional tone
 * @param illustrationStyle - Art style
 * @returns Simple prompt
 */
export function buildSimplePrompt(
  sceneDescription: string,
  emotionalTone: string,
  illustrationStyle: string
): string {
  return `Using the first image as the base, EDIT it by replacing ONLY the face/head area with the face from the second image.

SCENE: ${sceneDescription}
EMOTIONAL TONE: ${emotionalTone}
ILLUSTRATION STYLE: ${illustrationStyle}

Match the person's facial features exactly from the second image. Give them a ${emotionalTone} expression. Keep everything else from the first image unchanged: same background, same style, same composition, same clothing, same pose. Only change the face.`
}

/**
 * Options for adding visual consistency instructions
 */
export interface ConsistencyOptions {
  hasCharacterSheet: boolean
  hasPage1Reference: boolean
  /** Total number of reference images being sent (user photo + sheet + page1) */
  referenceImageCount: number
}

/**
 * Add visual consistency instructions to a prompt when reference images
 * (character sheet and/or page 1) are provided alongside the user photo.
 *
 * Tells Gemini which image is which so it can use them correctly.
 *
 * @param prompt - The existing prompt text
 * @param options - Which reference images are present
 * @returns Augmented prompt with consistency instructions
 */
export function addConsistencyInstructions(
  prompt: string,
  options: ConsistencyOptions
): string {
  if (!options.hasCharacterSheet && !options.hasPage1Reference) {
    return prompt
  }

  const parts: string[] = ['\nREFERENCE IMAGES:']
  parts.push('- Image 1: Photo of the child (facial reference)')

  if (options.hasCharacterSheet && options.hasPage1Reference) {
    parts.push('- Image 2: Character sheet in this art style (appearance reference)')
    parts.push('- Image 3: Previous page (style continuity)')
  } else if (options.hasCharacterSheet) {
    parts.push('- Image 2: Character sheet in this art style (appearance reference)')
  } else if (options.hasPage1Reference) {
    parts.push('- Image 2: Previous page (style continuity)')
  }

  parts.push('Keep the child looking identical across all pages.')

  return prompt + parts.join('\n')
}

/**
 * Add eye rendering instructions to a prompt.
 * Ensures Gemini generates realistic, well-defined eyes that are compatible
 * with face-swap post-processing and avoid common artifacts (spots, discoloration).
 *
 * Applied globally to all stories — current and future.
 *
 * @param prompt - The existing prompt text
 * @param faceSwapEnabled - Whether face-swap will be applied (adds extra instructions)
 * @returns Augmented prompt with eye rendering rules
 */
export function addEyeRenderingInstructions(prompt: string, faceSwapEnabled: boolean): string {
  // Don't add if the prompt already has eye instructions
  if (prompt.toLowerCase().includes('eye rendering') || prompt.toLowerCase().includes('eye detail')) {
    return prompt
  }

  const baseEyeInstructions = `

EYE RENDERING (IMPORTANT - avoid artifacts):
- Eyes must have REALISTIC HUMAN proportions — NOT oversized anime/cartoon eyes
- Render clear, well-defined iris with natural color matching the reference photo
- Pupils must be round, centered, and properly sized
- White sclera should be clean with subtle natural shading, no spots or discoloration
- Both eyes must be symmetrical, same size, looking in the same direction
- Natural eye reflections (single small catchlight per eye)
- NO heavy dark circles, NO unnatural shadows around the eye area
- Eyelids and eyelashes rendered with realistic detail`

  const faceSwapExtra = faceSwapEnabled
    ? `
- Eye area skin should be smooth and well-lit, matching the rest of the face
- Keep eye size and shape close to the reference photo for face-swap compatibility`
    : ''

  return prompt + baseEyeInstructions + faceSwapExtra
}

/**
 * Validate that all required variables are present in template
 *
 * @param promptTemplate - Template to validate
 * @returns Array of missing variables (empty if all present)
 */
export function validatePromptTemplate(promptTemplate: string): string[] {
  const requiredVariables = [
    '{SCENE_DESCRIPTION}',
    '{EMOTIONAL_TONE}',
    '{ILLUSTRATION_STYLE}',
  ]

  const missing: string[] = []

  for (const variable of requiredVariables) {
    if (!promptTemplate.includes(variable)) {
      missing.push(variable)
    }
  }

  return missing
}

/**
 * Get a summary of what will be generated
 * Useful for logging and debugging
 *
 * @param pageNumber - Page number
 * @param pageMetadata - Page metadata
 * @param illustrationStyle - Style
 * @returns Human-readable summary
 */
export function getGenerationSummary(
  pageNumber: number,
  pageMetadata: PageMetadata,
  illustrationStyle: string
): string {
  return `Page ${pageNumber}: ${pageMetadata.sceneDescription} (${pageMetadata.emotionalTone}, ${illustrationStyle} style)`
}
