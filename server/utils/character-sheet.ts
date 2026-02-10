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

  return `You are creating a CHARACTER REFERENCE SHEET for a children's story illustration.

PURPOSE: This image will be used as a VISUAL REFERENCE to ensure the character looks IDENTICAL across all pages of the story.

${styleSection}

${characterSection}

INSTRUCTIONS:
1. Draw the child from the reference photo(s) in a NEUTRAL STANDING POSE
2. Show the child from the waist up, facing slightly to the right (3/4 view)
3. Use a PLAIN, SIMPLE background (solid light color or very subtle gradient)
4. The child should wear SIMPLE, NEUTRAL clothing (plain t-shirt or similar)
5. Capture EVERY physical detail: exact hair color, hairstyle, skin tone, eye color, facial features, freckles, dimples, etc.
6. The illustration MUST be in the EXACT art style specified above — this is critical for consistency
7. The face should be CLEARLY VISIBLE and well-lit, taking up a significant portion of the image
8. Do NOT add any text, labels, speech bubbles, or annotations
9. Do NOT add any fantasy elements, props, or story-specific items — this is a neutral reference

The goal is a clean, clear character reference that captures this specific child's appearance in the story's art style.`
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
