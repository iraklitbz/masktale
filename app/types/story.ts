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

export interface StoryMetadata {
  author?: string
  illustrationStyle: IllustrationStyle
  theme: Theme
  ageRange: AgeRange
  createdAt?: string
  updatedAt?: string
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
