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
  }
}
