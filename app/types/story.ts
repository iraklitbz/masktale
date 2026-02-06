/**
 * Story and Page Type Definitions
 * Core types for the story configuration system
 */

export type AspectRatio = '3:4' | '4:3' | '1:1' | '16:9'
export type EmotionalTone = 'excited' | 'happy' | 'curious' | 'surprised' | 'calm' | 'adventurous'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type IllustrationStyle = 'watercolor' | 'digital' | 'cartoon' | 'realistic' | 'painterly'
export type Theme = 'education' | 'adventure' | 'celebration' | 'family' | 'nature' | 'friendship'
export type StoryFormat = 'book' | 'comic'
export type BubbleType = 'speech' | 'thought' | 'sfx'
export type TailDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none'
export type BubbleSize = 'small' | 'medium' | 'large'

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

/**
 * Speech bubble position configuration for comics
 */
export interface SpeechBubblePosition {
  x: number // Percentage from left (0-1)
  y: number // Percentage from top (0-1)
}

/**
 * Speech bubble configuration for comic pages
 */
export interface SpeechBubble {
  type: BubbleType
  speaker: string // 'hero', 'cat', etc.
  position: SpeechBubblePosition
  tailDirection?: TailDirection
  size?: BubbleSize
}

export interface StoryPage {
  pageNumber: number
  baseImagePath?: string // Relative path: "base-images/page-01.jpg" (optional for new generation mode)
  promptPath: string // Relative path: "prompts/page-01.txt"
  aspectRatio: AspectRatio
  metadata: PageMetadata
  speechBubbles?: SpeechBubble[] // Comic format only
}

export interface ImageQuality {
  compression: number // 0-100
  maxWidth: number
  maxHeight: number
}

/**
 * Font configuration for a specific use case
 */
export interface FontConfig {
  family: string // CSS font-family value
  weight: number // Font weight (400, 700, etc.)
  style?: 'normal' | 'italic'
  fallback: string // Fallback for PDF generation
  // Optional URLs to TTF/OTF files to embed in PDF generation
  pdf?: {
    normal?: string
    bold?: string
    italic?: string
    bolditalic?: string
  }
}

/**
 * Typography configuration for a story
 * Each story can have its own fonts for headlines and body text
 */
export interface StoryTypography {
  kitUrl?: string // TypeKit/Google Fonts CSS URL (loaded dynamically)
  headline: FontConfig
  body: FontConfig
}

/**
 * Comic-specific settings for speech bubbles and styling
 */
export interface ComicSettings {
  addSpeechBubbles?: boolean
  bubbleStyle?: 'classic' | 'modern'
  fontFamily?: string
  fontSize?: number
  bubbleColor?: string
  bubbleBorderColor?: string
  bubbleBorderWidth?: number
  textColor?: string
}

export interface StorySettings {
  maxRegenerations: number
  defaultAspectRatio: AspectRatio
  geminiModel: string
  processingTimeout: number // Seconds
  imageQuality: ImageQuality
  comicSettings?: ComicSettings // Comic format only
}

export interface StoryConfig {
  id: string
  version: string
  format?: StoryFormat // 'book' (default) or 'comic'
  title: LocalizedText
  description: LocalizedText
  metadata: StoryMetadata
  pages: StoryPage[]
  settings: StorySettings
  thumbnail?: string // Optional thumbnail image path
  typography?: StoryTypography // Custom fonts for this story
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
 * Speech bubble text content for comics
 */
export interface SpeechBubbleText {
  speaker: string
  type: BubbleType
  text: string
}

/**
 * Narrative text for a single page
 * Used for PDF generation with proper story text
 */
export interface PageText {
  pageNumber: number
  title: string
  text?: string // Contains {childName} placeholder for interpolation (book format)
  speechBubbles?: SpeechBubbleText[] // Comic format
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
 * Loaded from Strapi CMS
 */
export interface StoryTexts {
  locale: string
  pages: PageText[]
  cover: CoverText
  backCover: BackCoverText
}
