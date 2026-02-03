/**
 * Session Management Composable
 * Handles session state and localStorage persistence
 */

import type { Session, CurrentState, CreateSessionResponse } from '~/app/types/session'

const STORAGE_KEY = 'mask-session-id'

/**
 * Composable for managing user sessions
 */
export function useSession() {
  // Reactive session state
  const sessionId = useState<string | null>('sessionId', () => null)
  const session = useState<Session | null>('session', () => null)
  const currentState = useState<CurrentState | null>('currentState', () => null)
  const loading = useState<boolean>('sessionLoading', () => false)
  const error = useState<string | null>('sessionError', () => null)

  /**
   * Create a new session for a story
   */
  async function createSession(storyId: string): Promise<string | null> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<CreateSessionResponse>('/api/session/create', {
        method: 'POST',
        body: { storyId },
      })

      // Store session ID
      sessionId.value = response.sessionId

      // Save to localStorage (client-side only)
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, response.sessionId)
      }

      // Load full session data
      await loadSession(response.sessionId)

      console.log('[useSession] Created session:', response.sessionId)
      return response.sessionId
    } catch (e: any) {
      error.value = e.data?.statusMessage || e.message || 'Failed to create session'
      console.error('[useSession] Error creating session:', error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Load an existing session by ID
   */
  async function loadSession(id: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ session: Session; currentState: CurrentState | null }>(
        `/api/session/${id}`
      )

      session.value = response.session
      currentState.value = response.currentState
      sessionId.value = id

      // Update localStorage
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, id)
      }

      console.log('[useSession] Loaded session:', id)
      return true
    } catch (e: any) {
      error.value = e.data?.statusMessage || e.message || 'Failed to load session'
      console.error('[useSession] Error loading session:', error.value)

      // Clear invalid session
      clearSession()
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Restore session from localStorage (call on app mount)
   */
  async function restoreSession(): Promise<boolean> {
    if (!import.meta.client) return false

    const storedId = localStorage.getItem(STORAGE_KEY)
    if (!storedId) return false

    console.log('[useSession] Restoring session from localStorage:', storedId)
    return await loadSession(storedId)
  }

  /**
   * Clear current session (client-side only, does not delete from server)
   */
  function clearSession() {
    sessionId.value = null
    session.value = null
    currentState.value = null
    error.value = null

    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
    }

    console.log('[useSession] Session cleared')
  }

  /**
   * Delete session from server and clear local state
   * Also removes all generated images and files
   */
  async function deleteSession(id?: string): Promise<boolean> {
    const targetId = id || sessionId.value
    if (!targetId) return false

    loading.value = true
    error.value = null

    try {
      await $fetch(`/api/session/${targetId}`, {
        method: 'DELETE',
      })

      // Clear local state
      clearSession()

      console.log('[useSession] Deleted session:', targetId)
      return true
    } catch (e: any) {
      error.value = e.data?.statusMessage || e.message || 'Failed to delete session'
      console.error('[useSession] Error deleting session:', error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if there's a valid session with generated pages
   */
  function hasGeneratedBook(): boolean {
    if (!session.value || !currentState.value) return false

    // Check if session has completed status or has generated pages
    const hasPages = Object.keys(currentState.value.selectedVersions || {}).length > 0
    const isCompleted = session.value.status === 'completed'

    return hasPages || isCompleted
  }

  /**
   * Get the preview URL for the current session
   */
  function getPreviewUrl(): string | null {
    if (!session.value || !sessionId.value) return null
    return `/story/${sessionId.value}/preview`
  }

  /**
   * Check if session is expired
   */
  function isExpired(): boolean {
    if (!session.value) return true

    const now = new Date()
    const expiresAt = new Date(session.value.expiresAt)
    return now > expiresAt
  }

  /**
   * Get time remaining until expiration
   */
  function getTimeRemaining(): number {
    if (!session.value) return 0

    const now = new Date()
    const expiresAt = new Date(session.value.expiresAt)
    return Math.max(0, expiresAt.getTime() - now.getTime())
  }

  return {
    // State
    sessionId: readonly(sessionId),
    session: readonly(session),
    currentState: readonly(currentState),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    createSession,
    loadSession,
    restoreSession,
    clearSession,
    deleteSession,

    // Utilities
    isExpired,
    getTimeRemaining,
    hasGeneratedBook,
    getPreviewUrl,
  }
}
