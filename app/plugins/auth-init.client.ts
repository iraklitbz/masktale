/**
 * Auth Initialization Plugin
 * Loads the authenticated user on app startup if a token exists
 */
export default defineNuxtPlugin(async () => {
  const { user, getCurrentUser } = useAuth()
  const token = useStrapiToken()
  const authInitialized = useState('auth-initialized', () => false)

  // If there's a token but no user loaded, load the user
  if (token.value && !user.value) {
    try {
      await getCurrentUser()
    } catch (error) {
      // Token might be invalid, clear it
      console.log('[Auth Init] Failed to load user, clearing token')
      token.value = null
    }
  }

  // Mark auth as initialized
  authInitialized.value = true
})
