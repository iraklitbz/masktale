/**
 * Character Analyzer Utility
 * Analyzes user photos to generate detailed character descriptions
 * for consistent rendering across all story pages
 */

import { GoogleGenAI } from '@google/genai'
import type { CharacterDescription } from '~/types/session'

/**
 * Analyzes user photos and generates a detailed character description
 * using AI vision capabilities
 *
 * @param userPhotosBase64 - Array of base64-encoded user photos
 * @returns Detailed character description
 */
export async function analyzeCharacterFromPhotos(
  userPhotosBase64: string[]
): Promise<CharacterDescription> {
  const config = useRuntimeConfig()

  if (!config.geminiApiKey) {
    throw new Error('NUXT_GEMINI_API_KEY is not configured')
  }

  const ai = new GoogleGenAI({
    apiKey: config.geminiApiKey,
  })

  // Build analysis prompt - ULTRA DETAILED for maximum accuracy
  const analysisPrompt = `You are analyzing photos of a child to create an ULTRA-DETAILED physical description for AI illustration generation. The description must be SO SPECIFIC that the AI can recreate this exact child's appearance with maximum accuracy.

Study these photos EXTREMELY carefully and provide a JSON response with this structure:

{
  "ageRange": "exact age estimation (e.g., '4-5 years old', '7-8 years old')",
  "skinTone": "VERY specific skin tone with undertones and any variations (e.g., 'light olive skin with warm golden undertones, slightly rosy cheeks', 'medium brown with cool undertones, even complexion', 'fair porcelain with pink undertones')",
  "eyeColor": "precise eye color with details (e.g., 'deep chocolate brown eyes with slight amber flecks in sunlight', 'bright blue with darker outer ring', 'hazel green-brown with golden center')",
  "eyeShape": "detailed eye shape and characteristics (e.g., 'large almond-shaped eyes, slightly upturned at outer corners', 'round wide eyes with long lashes', 'narrow eyes with prominent epicanthic folds')",
  "hairColor": "exact hair color with highlights/variations (e.g., 'dark chestnut brown with natural lighter streaks', 'golden blonde with darker roots', 'jet black with blue undertones in light')",
  "hairTexture": "precise hair texture and quality (e.g., 'soft wavy with loose curls', 'straight and silky, fine strands', 'tight coiled curls, thick density', 'slightly wavy with natural volume')",
  "hairStyle": "current exact hairstyle (e.g., 'short bob cut just above shoulders, side-parted left', 'very short cropped on sides, longer on top', 'long past shoulders, usually worn loose')",
  "faceShape": "detailed face structure (e.g., 'oval face with prominent full cheeks, soft jawline', 'round cherubic face with chubby cheeks', 'heart-shaped with pointed chin, high forehead')",
  "nose": "specific nose description (e.g., 'small button nose, slightly upturned tip', 'medium nose with straight bridge, rounded tip', 'wide nose with flared nostrils')",
  "lips": "detailed mouth and lip description (e.g., 'full pink lips, slightly fuller bottom lip', 'thin upper lip, fuller lower lip', 'small rosebud mouth, natural pink color')",
  "smile": "smile characteristics and teeth (e.g., 'wide joyful smile showing all teeth, slight gap between front teeth', 'shy closed-lip smile with one dimple on right cheek', 'big smile with visible gums, perfectly straight teeth')",
  "eyebrows": "eyebrow detail (e.g., 'thick dark eyebrows, straight shape, well-defined', 'thin arched eyebrows, same color as hair', 'bushy expressive eyebrows')",
  "ears": "ear description if visible (e.g., 'medium-sized ears close to head', 'prominent ears that stick out slightly', 'small delicate ears')",
  "cheeks": "cheek description (e.g., 'full round cheeks with natural rosiness', 'defined cheekbones, slim face', 'chubby cheeks with dimples when smiling')",
  "chin": "chin characteristics (e.g., 'rounded soft chin', 'pointed chin', 'prominent strong chin with slight cleft')",
  "facialProportions": "overall face proportions (e.g., 'large eyes relative to face size, small nose and mouth', 'balanced proportions', 'elongated face with features in lower half')",
  "distinctiveFeatures": "ALL unique identifying features (e.g., 'two small moles on left cheek, light freckles across nose bridge, one dimple on right cheek only when smiling', or 'birthmark on right temple, gap in front teeth, long eyelashes')",
  "overallImpression": "general appearance (e.g., 'sweet innocent appearance, baby-faced features', 'mature for age, defined features', 'energetic cheerful look')",
  "fullDescription": "COMPLETE 4-5 sentence ultra-detailed description combining ALL features above in natural language that an illustrator can use to recreate this exact child"
}

CRITICAL REQUIREMENTS:
- Study ALL photos carefully - look for consistent features across images
- Be OBSESSIVELY detailed - every little characteristic matters
- Use PRECISE color descriptions (not just "brown" but "warm chestnut brown")
- Include measurements relative to face (e.g., "eyes are wide-set", "nose takes up 1/3 of face length")
- The fullDescription must be SO detailed that no two children could match it
- Mention ANY unique features no matter how small
- Return ONLY valid JSON, no other text
- All fields are required`

  try {
    console.log('[Character Analyzer] Analyzing character from photos...')

    // Prepare content for Gemini
    const contents = [
      { text: analysisPrompt },
      ...userPhotosBase64.map(imageData => ({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData,
        },
      })),
    ]

    // Use text model for analysis (not image generation)
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
    })

    if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('No text response from Gemini API')
    }

    const responseText = response.candidates[0].content.parts[0].text.trim()

    console.log('[Character Analyzer] Raw response:', responseText)

    // Parse JSON response
    // Remove markdown code blocks if present
    let jsonText = responseText
    if (jsonText.includes('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    }
    if (jsonText.includes('```')) {
      jsonText = jsonText.replace(/```/g, '')
    }

    const parsedData = JSON.parse(jsonText.trim())

    // Validate required fields
    const requiredFields = [
      'ageRange',
      'skinTone',
      'eyeColor',
      'eyeShape',
      'hairColor',
      'hairTexture',
      'hairStyle',
      'faceShape',
      'nose',
      'lips',
      'smile',
      'eyebrows',
      'ears',
      'cheeks',
      'chin',
      'facialProportions',
      'distinctiveFeatures',
      'overallImpression',
      'fullDescription',
    ]

    for (const field of requiredFields) {
      if (!parsedData[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    const characterDescription: CharacterDescription = {
      ...parsedData,
      generatedAt: new Date().toISOString(),
    }

    console.log('[Character Analyzer] Successfully generated character description')
    console.log('[Character Analyzer] Full description:', characterDescription.fullDescription)

    return characterDescription
  } catch (error: any) {
    console.error('[Character Analyzer] Error:', error.message)
    console.error('[Character Analyzer] Full error:', error)
    throw new Error(`Failed to analyze character: ${error.message}`)
  }
}

/**
 * Format character description for use in image generation prompts
 *
 * @param description - Character description object
 * @returns Formatted string for prompt injection
 */
export function formatCharacterDescriptionForPrompt(
  description: CharacterDescription
): string {
  return `⚠️ CRITICAL CHARACTER DESCRIPTION - MUST MATCH EXACTLY ⚠️

CHILD'S PHYSICAL CHARACTERISTICS (NON-NEGOTIABLE):

AGE & GENERAL:
- Age: ${description.ageRange}
- Overall appearance: ${description.overallImpression}
- Facial proportions: ${description.facialProportions}

SKIN:
- Skin tone: ${description.skinTone}

EYES (CRITICAL FOR RECOGNITION):
- Eye color: ${description.eyeColor}
- Eye shape: ${description.eyeShape}

HAIR (EXACT MATCH REQUIRED):
- Hair color: ${description.hairColor}
- Hair texture: ${description.hairTexture}
- Hairstyle: ${description.hairStyle}

FACIAL FEATURES (PRECISE MATCHING):
- Face shape: ${description.faceShape}
- Nose: ${description.nose}
- Lips/mouth: ${description.lips}
- Smile: ${description.smile}
- Eyebrows: ${description.eyebrows}
- Ears: ${description.ears}
- Cheeks: ${description.cheeks}
- Chin: ${description.chin}

UNIQUE IDENTIFYING FEATURES:
${description.distinctiveFeatures}

COMPLETE DESCRIPTION:
${description.fullDescription}

🎯 YOU MUST recreate this EXACT child in your illustration. Every detail matters for parent recognition. Study the reference photos AND this description to ensure maximum accuracy.`
}
