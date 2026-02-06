/**
 * Story Loader Utilities
 * Loads story configurations from Strapi CMS
 */

import type { StoryConfig, StoryListItem, StoryPage, StoryTexts } from '~/app/types/story'

const STRAPI_URL = process.env.STRAPI_URL || process.env.NUXT_PUBLIC_STRAPI_URL || 'https://cms.iraklitbz.dev'

/**
 * Convert Strapi aspectRatio format to app format
 */
function convertAspectRatio(ratio: string): string {
  const map: Record<string, string> = {
    'ratio_3_4': '3:4',
    'ratio_4_3': '4:3',
    'ratio_1_1': '1:1',
    'ratio_16_9': '16:9',
  }
  return map[ratio] || '3:4'
}

/**
 * Fetch from Strapi API
 */
async function fetchStrapi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${STRAPI_URL}${endpoint}`)

  if (!response.ok) {
    throw new Error(`Strapi error: ${response.status}`)
  }

  return response.json()
}

/**
 * Get all available stories (simplified list)
 */
export async function getAllStories(): Promise<StoryListItem[]> {
  try {
    const response = await fetchStrapi<{ data: any[] }>(
      '/api/stories?populate=*&sort=createdAt:desc'
    )

    const stories = response.data.map((story: any) => ({
      id: story.slug,
      title: {
        es: story.title_es,
        en: story.title_en || story.title_es,
      },
      description: {
        es: story.description_es,
        en: story.description_en || story.description_es,
      },
      thumbnail: story.thumbnail?.url
        ? `${STRAPI_URL}${story.thumbnail.url}`
        : undefined,
      theme: story.theme,
      ageRange: story.ageRange,
      pageCount: story.pages?.length || 0,
    }))

    console.log(`[StoryLoader] Found ${stories.length} stories from Strapi`)
    return stories
  } catch (error) {
    console.error('[StoryLoader] Error loading stories from Strapi:', error)
    return []
  }
}

/**
 * Load a specific story configuration
 */
export async function loadStoryConfig(storyId: string): Promise<StoryConfig> {
  try {
    const response = await fetchStrapi<{ data: any[] }>(
      `/api/stories?filters[slug][$eq]=${storyId}&populate=*`
    )

    if (!response.data || response.data.length === 0) {
      throw new Error(`Story ${storyId} not found`)
    }

    const story = response.data[0]

    // Transform to StoryConfig format
    const config: StoryConfig = {
      id: story.slug,
      version: story.version || '1.0.0',
      format: story.format || 'book',
      title: {
        es: story.title_es,
        en: story.title_en || story.title_es,
      },
      description: {
        es: story.description_es,
        en: story.description_en || story.description_es,
      },
      metadata: {
        illustrationStyle: story.illustrationStyle,
        theme: story.theme,
        ageRange: story.ageRange,
        styleProfile: story.styleProfile || undefined,
      },
      typography: story.typography ? {
        kitUrl: story.typography.kitUrl,
        headline: story.typography.headline,
        body: story.typography.body,
      } : undefined,
      settings: {
        maxRegenerations: story.settings?.maxRegenerations || 3,
        defaultAspectRatio: convertAspectRatio(story.settings?.defaultAspectRatio || 'ratio_3_4') as any,
        geminiModel: story.settings?.geminiModel || 'gemini-2.0-flash-exp-image-generation',
        processingTimeout: story.settings?.processingTimeout || 120,
        imageQuality: story.settings?.imageQuality || {
          compression: 85,
          maxWidth: 1200,
          maxHeight: 1600,
        },
        comicSettings: story.settings?.comicSettings || undefined,
      },
      pages: (story.pages || [])
        .sort((a: any, b: any) => a.pageNumber - b.pageNumber)
        .map((page: any) => ({
          pageNumber: page.pageNumber,
          promptPath: '',
          aspectRatio: convertAspectRatio(page.aspectRatio) as any,
          metadata: {
            sceneDescription: page.metadata?.sceneDescription || '',
            emotionalTone: page.metadata?.emotionalTone || 'happy',
            facePosition: page.metadata?.facePosition || { x: 50, y: 50 },
            difficulty: page.metadata?.difficulty || 'medium',
          },
          speechBubbles: page.speechBubbles?.map((b: any) => ({
            type: b.type,
            speaker: b.speaker,
            position: { x: b.positionX, y: b.positionY },
            tailDirection: b.tailDirection,
            size: b.size,
          })),
        })),
    }

    console.log(`[StoryLoader] Loaded story config: ${storyId}`)
    return config
  } catch (error: any) {
    console.error(`[StoryLoader] Error loading story ${storyId}:`, error)
    throw error
  }
}

/**
 * Check if a story exists
 */
export async function storyExists(storyId: string): Promise<boolean> {
  try {
    await loadStoryConfig(storyId)
    return true
  } catch {
    return false
  }
}

/**
 * Get a specific page configuration
 */
export async function getPageConfig(
  storyId: string,
  pageNumber: number
): Promise<StoryPage | null> {
  try {
    const config = await loadStoryConfig(storyId)
    const page = config.pages.find(p => p.pageNumber === pageNumber)
    return page || null
  } catch (error) {
    console.error(`[StoryLoader] Error getting page ${pageNumber} for ${storyId}:`, error)
    return null
  }
}

/**
 * Get the prompt template for a story
 */
export async function getNewPromptTemplate(storyId: string): Promise<string> {
  try {
    // For now, we'll need to store the template in Strapi or use a default
    // This could be added as a field in the Story content type
    const response = await fetchStrapi<{ data: any[] }>(
      `/api/stories?filters[slug][$eq]=${storyId}`
    )

    if (response.data?.[0]?.promptTemplate) {
      return response.data[0].promptTemplate
    }

    // Fallback: return a generic template
    console.warn(`[StoryLoader] No prompt template found for ${storyId}, using default`)
    return ''
  } catch (error) {
    console.error('[StoryLoader] Error reading prompt template:', error)
    throw error
  }
}

/**
 * Get the prompt text for a specific page
 */
export async function getPagePrompt(
  storyId: string,
  pageNumber: number
): Promise<string> {
  try {
    const response = await fetchStrapi<{ data: any[] }>(
      `/api/story-pages?filters[story][slug][$eq]=${storyId}&filters[pageNumber][$eq]=${pageNumber}`
    )

    if (!response.data || response.data.length === 0) {
      throw new Error(`Page ${pageNumber} not found in story ${storyId}`)
    }

    return response.data[0].prompt || ''
  } catch (error) {
    console.error(`[StoryLoader] Error reading prompt for page ${pageNumber}:`, error)
    throw error
  }
}

/**
 * Load narrative texts for a story in a specific locale
 */
export async function loadStoryTexts(
  storyId: string,
  locale: string = 'es'
): Promise<StoryTexts> {
  try {
    const response = await fetchStrapi<{ data: any[] }>(
      `/api/stories?filters[slug][$eq]=${storyId}&populate=*`
    )

    if (!response.data || response.data.length === 0) {
      throw new Error(`Story texts not found for ${storyId}`)
    }

    const story = response.data[0]
    const suffix = locale === 'en' ? '_en' : '_es'
    const fallbackSuffix = '_es'

    const texts: StoryTexts = {
      locale,
      pages: (story.pages || [])
        .sort((a: any, b: any) => a.pageNumber - b.pageNumber)
        .map((page: any) => ({
          pageNumber: page.pageNumber,
          title: page.texts?.[`title${suffix}`] || page.texts?.[`title${fallbackSuffix}`] || '',
          text: page.texts?.[`text${suffix}`] || page.texts?.[`text${fallbackSuffix}`] || '',
          speechBubbles: page.speechBubbles?.map((b: any) => ({
            speaker: b.speaker,
            type: b.type,
            text: b[`text${suffix}`] || b[`text${fallbackSuffix}`] || '',
          })),
        })),
      cover: {
        title: story[`cover_title`] || story.title_es,
        subtitle: story[`cover_subtitle${suffix}`] || story[`cover_subtitle${fallbackSuffix}`] || '',
        tagline: story[`cover_tagline${suffix}`] || story[`cover_tagline${fallbackSuffix}`] || '',
      },
      backCover: {
        message: story[`backcover_message${suffix}`] || story[`backcover_message${fallbackSuffix}`] || '',
        footer: story[`backcover_footer${suffix}`] || story[`backcover_footer${fallbackSuffix}`] || 'Fin',
      },
    }

    console.log(`[StoryLoader] Loaded story texts: ${storyId} (${locale})`)
    return texts
  } catch (error: any) {
    console.error(`[StoryLoader] Error loading story texts ${storyId}:`, error)
    throw error
  }
}

/**
 * Interpolate placeholders in text with actual values
 */
export function interpolateText(text: string, childName: string): string {
  return text.replace(/\{childName\}/g, childName)
}
