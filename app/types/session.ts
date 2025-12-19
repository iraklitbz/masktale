/**
 * Session Type Definitions
 * Types for managing user sessions and generation state
 */

export type SessionStatus =
  | 'created' // Session initialized
  | 'photo-uploaded' // User photo received
  | 'generating' // AI generation in progress
  | 'completed' // All pages generated
  | 'expired' // Session timeout

export interface PhotoMetadata {
  width: number
  height: number
  format: string
  size: number // Bytes
}

export interface UserPhoto {
  originalPath: string
  processedPath?: string
  uploadedAt: string
  metadata: PhotoMetadata
}

export interface GenerationError {
  pageNumber: number
  attempt: number
  error: string
  timestamp: string
}

export interface GenerationProgress {
  totalPages: number
  pagesGenerated: number
  currentPage?: number
  startedAt?: string
  completedAt?: string
  errors: GenerationError[]
}

export interface Session {
  id: string
  storyId: string
  createdAt: string
  expiresAt: string
  status: SessionStatus
  userPhoto?: UserPhoto
  progress: GenerationProgress
}

/**
 * Version info for a generated page
 */
export interface PageVersion {
  version: number // 1, 2, or 3
  generatedAt: string
  imagePath: string // Relative path from session dir
}

/**
 * Current state of the story generation
 * Tracks which version of each page is selected
 */
export interface CurrentState {
  storyId: string
  sessionId: string
  selectedVersions: {
    [pageNumber: string]: PageVersion
  }
  regenerationCount: {
    [pageNumber: string]: number
  }
  lastUpdated: string
}

/**
 * Request/Response types for API endpoints
 */
export interface CreateSessionRequest {
  storyId: string
}

export interface CreateSessionResponse {
  sessionId: string
  expiresAt: string
  storyId: string
}

export interface UploadPhotoResponse {
  success: boolean
  photoPath: string
  metadata: PhotoMetadata
}

export interface GeneratePageRequest {
  sessionId: string
  pageNumber: number
  regenerate?: boolean
}

export interface GeneratePageResponse {
  success: boolean
  imageData: string // Base64 data URL
  version: number
  generatedAt: string
}
