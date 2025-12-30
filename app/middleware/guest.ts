/**
 * Guest Middleware
 * Redirects authenticated users away from guest-only pages
 * (like login, register, etc.)
 */
export default defineNuxtRouteMiddleware(async () => {
  const { user, getCurrentUser } = useAuth()
  const token = useStrapiToken()

  // If user is not loaded but we have a token, try to load user first
  if (!user.value && token.value) {
    await getCurrentUser()
  }

  // If user is already authenticated, redirect to profile
  if (user.value && token.value) {
    return navigateTo('/profile')
  }
})
