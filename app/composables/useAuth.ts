/**
 * Authentication Composable
 * Handles all authentication logic with Strapi
 */
import type { User, LoginCredentials, RegisterData, ForgotPasswordData, ResetPasswordData, AuthResponse } from '~/types/auth'

export const useAuth = () => {
  const router = useRouter()
  const toast = useToast()

  // Get Strapi auth composable
  let strapiLogin: any
  let strapiLogout: any
  let user: any
  let fetchUser: any
  let setUser: any
  let setToken: any

  try {
    const strapiAuth = useStrapiAuth()
    strapiLogin = strapiAuth?.login
    strapiLogout = strapiAuth?.logout
    user = strapiAuth?.user || ref(null)
    fetchUser = strapiAuth?.fetchUser
    setUser = strapiAuth?.setUser
    setToken = strapiAuth?.setToken
  } catch (error) {
    console.error('[useAuth] Error initializing Strapi auth:', error)
    // Fallback to default values
    user = ref(null)
  }

  /**
   * Login with email and password
   */
  const login = async (credentials: LoginCredentials) => {
    try {
      if (!strapiLogin) {
        throw new Error('Strapi auth not initialized')
      }

      const response = await strapiLogin(credentials)

      if (response) {
        toast.success('¡Bienvenido!', `Has iniciado sesión como ${response.user.username}`)
        return { success: true, user: response.user }
      }

      throw new Error('No se recibió respuesta del servidor')
    } catch (error: any) {
      console.error('[useAuth] Login error:', error)
      const errorMessage = error?.error?.message || error?.message || 'Error al iniciar sesión'
      toast.error('Error de autenticación', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Register new user
   */
  const register = async (data: RegisterData) => {
    try {
      if (!setToken || !setUser) {
        throw new Error('Strapi auth not initialized')
      }

      const client = useStrapiClient()

      const response = await client<AuthResponse>('/auth/local/register', {
        method: 'POST',
        body: data,
      })

      if (response.jwt && response.user) {
        // Set token and user
        setToken(response.jwt)
        setUser(response.user)

        toast.success('¡Cuenta creada!', `Bienvenido ${response.user.username}`)
        return { success: true, user: response.user }
      }

      throw new Error('No se recibió respuesta del servidor')
    } catch (error: any) {
      console.error('[useAuth] Register error:', error)
      const errorMessage = error?.error?.message || error?.message || 'Error al crear la cuenta'
      toast.error('Error de registro', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Logout current user
   */
  const logout = async () => {
    try {
      if (!strapiLogout) {
        throw new Error('Strapi auth not initialized')
      }

      await strapiLogout()
      toast.info('Sesión cerrada', 'Has cerrado sesión correctamente')
      router.push('/')
      return { success: true }
    } catch (error: any) {
      console.error('[useAuth] Logout error:', error)
      toast.error('Error', 'Hubo un problema al cerrar sesión')
      return { success: false, error: error.message }
    }
  }

  /**
   * Request password reset
   */
  const forgotPassword = async (data: ForgotPasswordData) => {
    try {
      const client = useStrapiClient()

      await client('/auth/forgot-password', {
        method: 'POST',
        body: data,
      })

      toast.success('Email enviado', 'Revisa tu correo para restablecer tu contraseña')
      return { success: true }
    } catch (error: any) {
      console.error('[useAuth] Forgot password error:', error)
      const errorMessage = error?.error?.message || error?.message || 'Error al enviar el email'
      toast.error('Error', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Reset password with code
   */
  const resetPassword = async (data: ResetPasswordData) => {
    try {
      if (!setToken || !setUser) {
        throw new Error('Strapi auth not initialized')
      }

      const client = useStrapiClient()

      const response = await client<AuthResponse>('/auth/reset-password', {
        method: 'POST',
        body: data,
      })

      if (response.jwt && response.user) {
        // Auto-login after password reset
        setToken(response.jwt)
        setUser(response.user)

        toast.success('Contraseña cambiada', 'Tu contraseña ha sido actualizada correctamente')
        return { success: true, user: response.user }
      }

      throw new Error('No se recibió respuesta del servidor')
    } catch (error: any) {
      console.error('[useAuth] Reset password error:', error)
      const errorMessage = error?.error?.message || error?.message || 'Error al cambiar la contraseña'
      toast.error('Error', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = computed(() => {
    return !!(user && user.value)
  })

  /**
   * Get current user info
   */
  const getCurrentUser = async () => {
    try {
      if (fetchUser) {
        await fetchUser()
      }
      return { success: true, user: user?.value || null }
    } catch (error: any) {
      console.error('[useAuth] Get user error:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    // State
    user,
    isAuthenticated,

    // Methods
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    getCurrentUser,
  }
}
