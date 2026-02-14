/**
 * Character Sheet Generator
 * Generates a visual reference illustration of the child character
 * in the story's specific art style for consistency across all pages.
 *
 * The character sheet is generated ONCE per session and reused as
 * a visual reference for all subsequent page generations.
 */

import { generateImageWithRetry } from './gemini'
import type { StoryConfig } from '~/types/story'

/**
 * Build the character sheet prompt using the story's style from Strapi.
 * Nothing is hardcoded — all style info comes from the storyConfig.
 */
function buildCharacterSheetPrompt(
  storyConfig: StoryConfig,
  characterDescription?: string
): string {
  const { illustrationStyle, styleProfile } = storyConfig.metadata

  // Build style section from Strapi data
  let styleSection: string
  if (styleProfile) {
    styleSection = `ART STYLE (MUST FOLLOW EXACTLY):
- Technique: ${styleProfile.technique}
- Color Palette: ${styleProfile.colorPalette}
- Line Work: ${styleProfile.lineWork}
- Texture: ${styleProfile.texture}
- Lighting: ${styleProfile.lighting}
- Detail Level: ${styleProfile.detailLevel}
- Atmosphere: ${styleProfile.atmosphere}
${styleProfile.artisticReferences ? `- Artistic References: ${styleProfile.artisticReferences}` : ''}`
  } else {
    styleSection = `ART STYLE: ${illustrationStyle}`
  }

  // Build character section
  const characterSection = characterDescription
    ? `CHARACTER DETAILS:\n${characterDescription}`
    : `Study the reference photo(s) carefully and capture every physical detail of this child.`

  return `You are an expert children's book illustrator. Create a character reference illustration of the child from the reference photo.

${styleSection}

${characterSection}

Draw the child from the waist up in a neutral standing pose (3/4 view), plain light background. Capture every physical detail: hair color, hairstyle, skin tone, eye color, facial features. The face should be clearly visible and well-lit. Use the art style specified above. NO text, NO labels, NO speech bubbles.`
}

/**
 * Generate a character sheet illustration for visual consistency.
 *
 * @param userPhotosBase64 - Base64-encoded reference photos of the child
 * @param storyConfig - Story configuration from Strapi (contains style info)
 * @param characterDescription - Optional text description of the character (from character-analyzer)
 * @returns Base64-encoded character sheet image
 */
export async function generateCharacterSheet(
  userPhotosBase64: string[],
  storyConfig: StoryConfig,
  characterDescription?: string
): Promise<string> {
  const prompt = buildCharacterSheetPrompt(storyConfig, characterDescription)
  const model = storyConfig.settings.geminiModel

  console.log(`[CharacterSheet] Generating character sheet in "${storyConfig.metadata.illustrationStyle}" style`)
  console.log(`[CharacterSheet] Model: ${model}`)
  console.log(`[CharacterSheet] Reference photos: ${userPhotosBase64.length}`)
  console.log(`[CharacterSheet] Has character description: ${!!characterDescription}`)

  try {
    const imageBase64 = await generateImageWithRetry(
      {
        prompt,
        userImagesBase64: userPhotosBase64,
        aspectRatio: '3:4',
        model,
      },
      3,    // maxRetries
      false // useBaseImage = false (prompt-only generation)
    )

    console.log(`[CharacterSheet] Character sheet generated successfully`)
    return imageBase64
  } catch (error: any) {
    console.error(`[CharacterSheet] Failed to generate character sheet:`, error.message)
    throw error
  }
}
