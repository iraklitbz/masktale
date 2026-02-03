/**
 * Story and Page Type Definitions
 * Core types for the story configuration system
 */

export type AspectRatio = '3:4' | '4:3' | '1:1' | '16:9'
export type EmotionalTone = 'excited' | 'happy' | 'curious' | 'surprised' | 'calm' | 'adventurous'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type IllustrationStyle = 'watercolor' | 'digital' | 'cartoon' | 'realistic' | 'painterly'
export type Theme = 'education' | 'adventure' | 'celebration' | 'family' | 'nature' | 'friendship'

export interface FacePosition {
  x: number // Percentage from left (0-100)
  y: number // Percentage from top (0-100)
}

export interface AgeRange {
  min: number
  max: number
}

export interface LocalizedText {
  es: string
  en: string
}

/**
 * Detailed style profile for consistent image generation
 */
export interface StyleProfile {
  technique: string // e.g., "digital watercolor with soft brush strokes"
  colorPalette: string // e.g., "warm pastels - soft pinks, gentle blues, cream backgrounds"
  lineWork: string // e.g., "minimal black outlines, focus on color blending"
  texture: string // e.g., "visible watercolor paper texture, wet-on-wet effects"
  lighting: string // e.g., "soft natural lighting from upper-left, gentle shadows"
  detailLevel: string // e.g., "simplified backgrounds, detailed expressive faces"
  atmosphere: string // e.g., "dreamy, cozy, optimistic children's book aesthetic"
  artisticReferences?: string // Optional: e.g., "similar to Beatrix Potter meets modern digital art"
}

export interface StoryMetadata {
  author?: string
  illustrationStyle: IllustrationStyle
  theme: Theme
  ageRange: AgeRange
  createdAt?: string
  updatedAt?: string
  styleProfile?: StyleProfile // NEW: Detailed style specifications
}

export interface PageMetadata {
  sceneDescription: string
  emotionalTone: EmotionalTone
  facePosition: FacePosition
  difficulty: Difficulty
}

export interface StoryPage {
  pageNumber: number
  baseImagePath: string // Relative path: "base-images/page-01.jpg"
  promptPath: string // Relative path: "prompts/page-01.txt"
  aspectRatio: AspectRatio
  metadata: PageMetadata
}

export interface ImageQuality {
  compression: number // 0-100
  maxWidth: number
  maxHeight: number
}

export interface StorySettings {
  maxRegenerations: number
  defaultAspectRatio: AspectRatio
  geminiModel: string
  processingTimeout: number // Seconds
  imageQuality: ImageQuality
}

export interface StoryConfig {
  id: string
  version: string
  title: LocalizedText
  description: LocalizedText
  metadata: StoryMetadata
  pages: StoryPage[]
  settings: StorySettings
  thumbnail?: string // Optional thumbnail image path
}

/**
 * Simplified story info for listing
 */
export interface StoryListItem {
  id: string
  title: LocalizedText
  description: LocalizedText
  thumbnail?: string
  theme: Theme
  ageRange: AgeRange
  pageCount: number
}

/**
 * Narrative text for a single page
 * Used for PDF generation with proper story text
 */
export interface PageText {
  pageNumber: number
  title: string
  text: string // Contains {childName} placeholder for interpolation
}

/**
 * Cover page text content
 */
export interface CoverText {
  title: string
  subtitle: string
  tagline: string
}

/**
 * Back cover text content
 */
export interface BackCoverText {
  message: string // Contains {childName} placeholder
  footer: string
}

/**
 * Complete story texts for a specific locale
 * Loaded from /data/stories/{storyId}/texts/{locale}.json
 */
export interface StoryTexts {
  locale: string
  pages: PageText[]
  cover: CoverText
  backCover: BackCoverText
}
