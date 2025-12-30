/**
 * Authentication Middleware
 * Protects routes that require user authentication
 * Redirects unauthenticated users to login page
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, getCurrentUser } = useAuth()
  const token = useStrapiToken()

  // If user is not loaded but we have a token, try to load user first
  if (!user.value && token.value) {
    await getCurrentUser()
  }

  // Now check if user is authenticated
  if (!user.value || !token.value) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath, // Save the original destination
      },
    })
  }
})
