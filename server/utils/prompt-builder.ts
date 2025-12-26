/**
 * Prompt Builder Utilities
 * Builds dynamic prompts by replacing template variables
 */

import type { StoryPage, PageMetadata } from '~/app/types/story'

/**
 * Build a complete prompt for a specific page
 * Replaces template variables with actual values
 *
 * @param promptTemplate - The prompt template text with variables
 * @param pageMetadata - Metadata for the specific page
 * @param illustrationStyle - Story illustration style
 * @param customInstructions - Optional custom instructions from user
 * @returns Complete prompt ready for Gemini
 */
export function buildPromptForPage(
  promptTemplate: string,
  pageMetadata: PageMetadata,
  illustrationStyle: string,
  customInstructions?: string
): string {
  let prompt = promptTemplate

  // Replace variables
  const replacements: Record<string, string> = {
    '{SCENE_DESCRIPTION}': pageMetadata.sceneDescription,
    '{EMOTIONAL_TONE}': pageMetadata.emotionalTone,
    '{ILLUSTRATION_STYLE}': illustrationStyle,
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
