/**
 * Session Manager Utilities
 * Handles creation, retrieval, and cleanup of user sessions
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Session, SessionStatus, CurrentState } from '~/app/types/session'

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions')
const SESSION_EXPIRY_HOURS = 24

/**
 * Ensure sessions directory exists
 */
async function ensureSessionsDir() {
  try {
    await fs.mkdir(SESSIONS_DIR, { recursive: true })
  } catch (error) {
    console.error('[SessionManager] Failed to create sessions directory:', error)
    throw error
  }
}

/**
 * Get session directory path
 */
function getSessionPath(sessionId: string): string {
  return path.join(SESSIONS_DIR, sessionId)
}

/**
 * Get session metadata file path
 */
function getSessionMetadataPath(sessionId: string): string {
  return path.join(getSessionPath(sessionId), 'metadata.json')
}

/**
 * Get current state file path
 */
function getCurrentStatePath(sessionId: string): string {
  return path.join(getSessionPath(sessionId), 'current-state.json')
}

/**
 * Create a new session
 *
 * @param storyId - ID of the story for this session
 * @returns Created session object
 */
export async function createSession(storyId: string): Promise<Session> {
  await ensureSessionsDir()

  const sessionId = randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000)

  const session: Session = {
    id: sessionId,
    storyId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'created',
    progress: {
      totalPages: 0, // Will be set when story config is loaded
      pagesGenerated: 0,
      errors: [],
    },
  }

  // Create session directory
  const sessionPath = getSessionPath(sessionId)
  await fs.mkdir(sessionPath, { recursive: true })

  // Save session metadata
  await saveSession(sessionId, session)

  console.log(`[SessionManager] Created session ${sessionId} for story ${storyId}`)
  return session
}

/**
 * Get an existing session by ID
 *
 * @param sessionId - Session ID
 * @returns Session object or null if not found/expired
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  try {
    const metadataPath = getSessionMetadataPath(sessionId)
    const data = await fs.readFile(metadataPath, 'utf-8')
    const session: Session = JSON.parse(data)

    // Check if session is expired
    const now = new Date()
    const expiresAt = new Date(session.expiresAt)

    if (now > expiresAt) {
      console.log(`[SessionManager] Session ${sessionId} has expired`)
      session.status = 'expired'
      await saveSession(sessionId, session)
      return null
    }

    return session
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`[SessionManager] Session ${sessionId} not found`)
      return null
    }
    console.error(`[SessionManager] Error reading session ${sessionId}:`, error)
    throw error
  }
}

/**
 * Save session metadata
 *
 * @param sessionId - Session ID
 * @param session - Session object to save
 */
export async function saveSession(sessionId: string, session: Session): Promise<void> {
  try {
    const metadataPath = getSessionMetadataPath(sessionId)
    await fs.writeFile(metadataPath, JSON.stringify(session, null, 2), 'utf-8')
    console.log(`[SessionManager] Saved session ${sessionId}`)
  } catch (error) {
    console.error(`[SessionManager] Error saving session ${sessionId}:`, error)
    throw error
  }
}

/**
 * Update session status
 *
 * @param sessionId - Session ID
 * @param status - New status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus
): Promise<void> {
  const session = await getSession(sessionId)
  if (!session) {
    throw new Error(`Session ${sessionId} not found`)
  }

  session.status = status
  await saveSession(sessionId, session)
}

/**
 * Get current state for a session
 *
 * @param sessionId - Session ID
 * @returns Current state or null if not found
 */
export async function getCurrentState(sessionId: string): Promise<CurrentState | null> {
  try {
    const statePath = getCurrentStatePath(sessionId)
    const data = await fs.readFile(statePath, 'utf-8')
    return JSON.parse(data)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null
    }
    console.error(`[SessionManager] Error reading current state for ${sessionId}:`, error)
    throw error
  }
}

/**
 * Save current state for a session
 *
 * @param sessionId - Session ID
 * @param state - Current state to save
 */
export async function saveCurrentState(
  sessionId: string,
  state: CurrentState
): Promise<void> {
  try {
    const statePath = getCurrentStatePath(sessionId)
    state.lastUpdated = new Date().toISOString()
    await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8')
    console.log(`[SessionManager] Saved current state for ${sessionId}`)
  } catch (error) {
    console.error(`[SessionManager] Error saving current state for ${sessionId}:`, error)
    throw error
  }
}

/**
 * Clean up expired sessions
 * Deletes session directories older than 24 hours
 *
 * @returns Number of sessions cleaned
 */
export async function cleanExpiredSessions(): Promise<number> {
  try {
    await ensureSessionsDir()
    const entries = await fs.readdir(SESSIONS_DIR)
    const now = new Date()
    let cleanedCount = 0

    for (const entry of entries) {
      const sessionPath = getSessionPath(entry)
      const metadataPath = getSessionMetadataPath(entry)

      try {
        const data = await fs.readFile(metadataPath, 'utf-8')
        const session: Session = JSON.parse(data)
        const expiresAt = new Date(session.expiresAt)

        if (now > expiresAt) {
          // Delete entire session directory
          await fs.rm(sessionPath, { recursive: true, force: true })
          console.log(`[SessionManager] Cleaned expired session ${entry}`)
          cleanedCount++
        }
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.error(`[SessionManager] Error cleaning session ${entry}:`, error)
        }
      }
    }

    console.log(`[SessionManager] Cleaned ${cleanedCount} expired session(s)`)
    return cleanedCount
  } catch (error) {
    console.error('[SessionManager] Error during cleanup:', error)
    return 0
  }
}

/**
 * Get generated image path for a specific page and version
 *
 * @param sessionId - Session ID
 * @param pageNumber - Page number
 * @param version - Version number (1-3)
 * @returns Absolute path to the generated image
 */
export function getGeneratedImagePath(
  sessionId: string,
  pageNumber: number,
  version: number
): string {
  return path.join(
    getSessionPath(sessionId),
    'generated',
    `page-${String(pageNumber).padStart(2, '0')}-v${version}.png`
  )
}

/**
 * Get user photo directory path
 *
 * @param sessionId - Session ID
 * @returns Absolute path to user photos directory
 */
export function getUserPhotoPath(sessionId: string): string {
  return path.join(getSessionPath(sessionId), 'user-photos')
}
