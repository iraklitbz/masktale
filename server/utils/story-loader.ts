/**
 * Story Loader Utilities
 * Loads story configurations from the filesystem
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import type { StoryConfig, StoryListItem, StoryPage, StoryTexts } from '~/app/types/story'

const STORIES_DIR = path.join(process.cwd(), 'data', 'stories')

/**
 * Get all available stories (simplified list)
 *
 * @returns Array of story list items
 */
export async function getAllStories(): Promise<StoryListItem[]> {
  try {
    const entries = await fs.readdir(STORIES_DIR, { withFileTypes: true })
    const stories: StoryListItem[] = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const config = await loadStoryConfig(entry.name)

          // Convert to simplified list item
          stories.push({
            id: config.id,
            title: config.title,
            description: config.description,
            thumbnail: config.thumbnail,
            theme: config.metadata.theme,
            ageRange: config.metadata.ageRange,
            pageCount: config.pages.length,
          })
        } catch (error) {
          console.warn(`[StoryLoader] Failed to load story ${entry.name}:`, error)
        }
      }
    }

    console.log(`[StoryLoader] Found ${stories.length} stories`)
    return stories
  } catch (error) {
    console.error('[StoryLoader] Error loading stories:', error)
    return []
  }
}

/**
 * Load a specific story configuration
 *
 * @param storyId - Story ID
 * @returns Story configuration
 */
export async function loadStoryConfig(storyId: string): Promise<StoryConfig> {
  try {
    const configPath = path.join(STORIES_DIR, storyId, 'config.json')
    const data = await fs.readFile(configPath, 'utf-8')
    const config: StoryConfig = JSON.parse(data)

    console.log(`[StoryLoader] Loaded story config: ${storyId}`)
    return config
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Story ${storyId} not found`)
    }
    console.error(`[StoryLoader] Error loading story ${storyId}:`, error)
    throw error
  }
}

/**
 * Check if a story exists
 *
 * @param storyId - Story ID
 * @returns True if story exists
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
 *
 * @param storyId - Story ID
 * @param pageNumber - Page number (1-based)
 * @returns Page configuration
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
 * Get the NEW generation prompt template (for complete image generation)
 *
 * @param storyId - Story ID
 * @returns Prompt template text
 */
export async function getNewPromptTemplate(storyId: string): Promise<string> {
  try {
    const templatePath = path.join(STORIES_DIR, storyId, 'prompts', 'PROMPT_TEMPLATE_NEW.txt')

    // Try new template first
    try {
      const templateText = await fs.readFile(templatePath, 'utf-8')
      console.log('[StoryLoader] Using NEW generation template (complete image generation)')
      return templateText.trim()
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Fallback to old template if new one doesn't exist
        console.warn('[StoryLoader] New template not found, falling back to old template')
        const oldTemplatePath = path.join(STORIES_DIR, storyId, 'prompts', 'PROMPT_TEMPLATE.txt')
        const templateText = await fs.readFile(oldTemplatePath, 'utf-8')
        return templateText.trim()
      }
      throw error
    }
  } catch (error) {
    console.error('[StoryLoader] Error reading prompt template:', error)
    throw error
  }
}

/**
 * Get the prompt text for a specific page
 *
 * @param storyId - Story ID
 * @param pageNumber - Page number (1-based)
 * @returns Prompt text with variables as placeholders
 */
export async function getPagePrompt(
  storyId: string,
  pageNumber: number
): Promise<string> {
  try {
    const page = await getPageConfig(storyId, pageNumber)
    if (!page) {
      throw new Error(`Page ${pageNumber} not found in story ${storyId}`)
    }

    const promptPath = path.join(STORIES_DIR, storyId, page.promptPath)
    const promptText = await fs.readFile(promptPath, 'utf-8')

    return promptText.trim()
  } catch (error) {
    console.error(`[StoryLoader] Error reading prompt for page ${pageNumber}:`, error)
    throw error
  }
}

/**
 * Get absolute path to a base image
 *
 * @param storyId - Story ID
 * @param pageNumber - Page number (1-based)
 * @returns Absolute path to base image
 */
export async function getBaseImagePath(
  storyId: string,
  pageNumber: number
): Promise<string> {
  try {
    const page = await getPageConfig(storyId, pageNumber)
    if (!page) {
      throw new Error(`Page ${pageNumber} not found in story ${storyId}`)
    }

    return path.join(STORIES_DIR, storyId, page.baseImagePath)
  } catch (error) {
    console.error(`[StoryLoader] Error getting base image path:`, error)
    throw error
  }
}

/**
 * Read base image as base64
 *
 * @param storyId - Story ID
 * @param pageNumber - Page number (1-based)
 * @returns Base64-encoded image
 */
export async function getBaseImageBase64(
  storyId: string,
  pageNumber: number
): Promise<string> {
  try {
    const imagePath = await getBaseImagePath(storyId, pageNumber)
    const buffer = await fs.readFile(imagePath)
    return buffer.toString('base64')
  } catch (error) {
    console.error(`[StoryLoader] Error reading base image:`, error)
    throw error
  }
}

/**
 * Get story directory path
 *
 * @param storyId - Story ID
 * @returns Absolute path to story directory
 */
export function getStoryPath(storyId: string): string {
  return path.join(STORIES_DIR, storyId)
}

/**
 * Load narrative texts for a story in a specific locale
 *
 * @param storyId - Story ID
 * @param locale - Locale code (default: 'es')
 * @returns Story texts with page content, cover, and back cover
 */
export async function loadStoryTexts(
  storyId: string,
  locale: string = 'es'
): Promise<StoryTexts> {
  try {
    const textsPath = path.join(STORIES_DIR, storyId, 'texts', `${locale}.json`)
    const data = await fs.readFile(textsPath, 'utf-8')
    const texts: StoryTexts = JSON.parse(data)

    console.log(`[StoryLoader] Loaded story texts: ${storyId} (${locale})`)
    return texts
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Story texts not found for ${storyId} in locale ${locale}`)
    }
    console.error(`[StoryLoader] Error loading story texts ${storyId}:`, error)
    throw error
  }
}

/**
 * Interpolate placeholders in text with actual values
 * Replaces {childName} with the provided child name
 *
 * @param text - Text with placeholders
 * @param childName - Child's name to interpolate
 * @returns Text with placeholders replaced
 */
export function interpolateText(text: string, childName: string): string {
  return text.replace(/\{childName\}/g, childName)
}
