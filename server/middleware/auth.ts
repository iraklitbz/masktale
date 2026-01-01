/**
 * Middleware de autenticación del servidor
 * Extrae el token JWT y obtiene el usuario desde Strapi
 * Establece event.context.user para endpoints protegidos
 */

export default defineEventHandler(async (event) => {
  // Solo aplicar en rutas de API que requieren autenticación
  const path = event.path || event.node?.req?.url || 'unknown'

  // Lista de rutas que requieren autenticación
  const protectedRoutes = [
    '/api/orders',
    '/api/session',
  ]

  // Verificar si la ruta requiere autenticación
  const requiresAuth = protectedRoutes.some(route => path.startsWith(route))

  if (!requiresAuth) {
    return
  }

  try {
    // Obtener el token JWT de las cookies
    // El módulo Nuxt Strapi usa 'strapi_jwt' como nombre de cookie por defecto
    let token = getCookie(event, 'strapi_jwt')

    // Si no encuentra con ese nombre, intentar con otros nombres posibles
    if (!token) {
      token = getCookie(event, 'jwt')
    }
    if (!token) {
      token = getCookie(event, 'token')
    }
    if (!token) {
      token = getCookie(event, 'strapi-jwt')
    }

    if (!token) {
      // No hay token, el usuario no está autenticado
      // Los endpoints decidirán si esto es un error o no
      return
    }

    // Verificar el token con Strapi y obtener el usuario
    const config = useRuntimeConfig()
    const strapiUrl = config.public.strapiUrl

    const response = await fetch(`${strapiUrl}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      // Token inválido, limpiar cookie
      deleteCookie(event, 'strapi_jwt')
      return
    }

    const userData = await response.json()

    // Establecer el usuario en el contexto del evento
    event.context.user = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      confirmed: userData.confirmed,
    }
  } catch (error: any) {
    console.error('[Auth Middleware] Error al verificar token:', error)
    // En caso de error, continuar sin usuario (los endpoints decidirán qué hacer)
  }
})
