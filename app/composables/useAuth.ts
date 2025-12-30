/**
 * Authentication Composable
 * Handles all authentication logic with Strapi
 */
import type { User, LoginCredentials, RegisterData, ForgotPasswordData, ResetPasswordData, AuthResponse } from '~/types/auth'

export const useAuth = () => {
  const router = useRouter()
  const toast = useToast()
  const client = useStrapiClient()
  const token = useStrapiToken()

  // Use useState for global state that persists across components
  const user = useState<User | null>('auth-user', () => null)

  /**
   * Computed: Check if user is authenticated
   */
  const isAuthenticated = computed(() => {
    return !!user.value && !!token.value
  })

  /**
   * Login with email and password
   */
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await client<AuthResponse>('/auth/local', {
        method: 'POST',
        body: credentials,
      })

      if (response.jwt && response.user) {
        // Save token
        token.value = response.jwt
        // Save user
        user.value = response.user

        toast.success('¡Bienvenido!', `Has iniciado sesión como ${response.user.username}`)
        return { success: true, user: response.user }
      }

      throw new Error('No se recibió respuesta del servidor')
    } catch (error: any) {
      console.error('[useAuth] Login error:', error)

      // Handle specific error cases
      const errorMessage = error?.error?.message || error?.message || 'Error al iniciar sesión'

      // Check if email is not confirmed
      if (errorMessage.toLowerCase().includes('confirm') || errorMessage.toLowerCase().includes('not confirmed')) {
        toast.error('Email no confirmado', 'Por favor, revisa tu bandeja de entrada y confirma tu email antes de iniciar sesión.')
        return { success: false, error: 'Email no confirmado' }
      }

      toast.error('Error de autenticación', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Register new user
   */
  const register = async (data: RegisterData) => {
    try {
      const response = await client<AuthResponse>('/auth/local/register', {
        method: 'POST',
        body: data,
      })

      // When email confirmation is enabled, Strapi doesn't return JWT
      // The user needs to confirm their email before logging in
      if (response.user) {
        // Check if JWT is present (email confirmation disabled)
        if (response.jwt) {
          // Auto-login: Set token and user
          token.value = response.jwt
          user.value = response.user
          toast.success('¡Cuenta creada!', `Bienvenido ${response.user.username}`)
        } else {
          // Email confirmation enabled: just return success
          // The UI will show the "check your email" message
          console.log('[useAuth] User created, email confirmation required')
        }

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
      // Clear token and user
      token.value = null
      user.value = null

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
      const response = await client<AuthResponse>('/auth/reset-password', {
        method: 'POST',
        body: data,
      })

      if (response.jwt && response.user) {
        // Auto-login after password reset
        token.value = response.jwt
        user.value = response.user

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
   * Get current user info
   */
  const getCurrentUser = async () => {
    try {
      if (!token.value) {
        return { success: false, error: 'No token available' }
      }

      const response = await client<User>('/users/me')

      if (response) {
        user.value = response
        return { success: true, user: response }
      }

      return { success: false, error: 'No user data' }
    } catch (error: any) {
      console.error('[useAuth] Get user error:', error)
      // Clear invalid token
      token.value = null
      user.value = null
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
