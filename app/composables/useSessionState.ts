/**
 * Composable for managing session state and generated pages
 */

import type { Session, CurrentState } from '~/app/types/session'

export interface SessionStateData {
  session: Session
  currentState: CurrentState
}

export function useSessionState(sessionId: string) {
  const { data, error, refresh, status } = useFetch<SessionStateData>(
    `/api/session/${sessionId}/state`,
    {
      key: `session-state-${sessionId}`,
    }
  )

  /**
   * Get URL for a specific page image
   */
  const getPageImageUrl = (pageNumber: number, version?: number) => {
    const params = version ? `?version=${version}` : ''
    return `/api/session/${sessionId}/image/${pageNumber}${params}`
  }

  /**
   * Get all pages with their current selected versions
   */
  const pages = computed(() => {
    if (!data.value?.currentState) return []

    const { selectedVersions } = data.value.currentState
    return Object.entries(selectedVersions)
      .map(([pageNum, pageVersion]) => ({
        pageNumber: parseInt(pageNum, 10),
        version: pageVersion.version,
        generatedAt: pageVersion.generatedAt,
        imageUrl: getPageImageUrl(parseInt(pageNum, 10)),
      }))
      .sort((a, b) => a.pageNumber - b.pageNumber)
  })

  /**
   * Get regeneration count for a specific page
   */
  const getRegenerationCount = (pageNumber: number) => {
    return data.value?.currentState?.regenerationCount?.[pageNumber] || 0
  }

  /**
   * Check if a page can be regenerated (max 3 times)
   */
  const canRegenerate = (pageNumber: number) => {
    return getRegenerationCount(pageNumber) < 3
  }

  /**
   * Get version history for a specific page
   */
  const getVersionHistory = (pageNumber: number) => {
    return data.value?.currentState?.versionHistory?.[pageNumber] || []
  }

  /**
   * Get favorite version for a specific page
   */
  const getFavoriteVersion = (pageNumber: number) => {
    return data.value?.currentState?.favoriteVersions?.[pageNumber]
  }

  /**
   * Get current selected version number for a page
   */
  const getCurrentVersion = (pageNumber: number) => {
    return data.value?.currentState?.selectedVersions?.[pageNumber]?.version
  }

  /**
   * Check if a page has multiple versions
   */
  const hasMultipleVersions = (pageNumber: number) => {
    const history = getVersionHistory(pageNumber)
    return history.length > 1
  }

  /**
   * Select a specific version of a page
   */
  const selectVersion = async (pageNumber: number, version: number) => {
    try {
      const { error: apiError } = await useFetch(
        `/api/session/${sessionId}/select-version`,
        {
          method: 'POST',
          body: { pageNumber, version },
        }
      )

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Error al seleccionar versión')
      }

      await refresh()
      return { success: true }
    } catch (err: any) {
      console.error('[useSessionState] selectVersion error:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Set or unset favorite version for a page
   */
  const setFavoriteVersion = async (pageNumber: number, version: number | null) => {
    try {
      const { error: apiError } = await useFetch(
        `/api/session/${sessionId}/favorite`,
        {
          method: 'POST',
          body: { pageNumber, version },
        }
      )

      if (apiError.value) {
        throw new Error(apiError.value.message || 'Error al marcar favorito')
      }

      await refresh()
      return { success: true }
    } catch (err: any) {
      console.error('[useSessionState] setFavoriteVersion error:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    // Raw data
    data,
    error,
    status,

    // Computed
    pages,
    session: computed(() => data.value?.session),
    currentState: computed(() => data.value?.currentState),
    isLoading: computed(() => status.value === 'pending'),

    // Methods
    refresh,
    getPageImageUrl,
    getRegenerationCount,
    canRegenerate,

    // NUEVO: Version history methods
    getVersionHistory,
    getFavoriteVersion,
    getCurrentVersion,
    hasMultipleVersions,
    selectVersion,
    setFavoriteVersion,
  }
}
