/**
 * Authentication Middleware
 * Protects routes that require user authentication
 * Redirects unauthenticated users to login page
 */
export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()

  // If user is not authenticated, redirect to login
  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath, // Save the original destination
      },
    })
  }
})
