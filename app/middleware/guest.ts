/**
 * Guest Middleware
 * Redirects authenticated users away from guest-only pages
 * (like login, register, etc.)
 */
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useAuth()

  // If user is already authenticated, redirect to home
  if (isAuthenticated.value) {
    return navigateTo('/')
  }
})
