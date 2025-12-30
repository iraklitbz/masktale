<script setup lang="ts">
definePageMeta({
  layout: false,
  ssr: false,
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { user, getCurrentUser } = useAuth()
const token = useStrapiToken()

// Get access_token from Google OAuth callback
const accessToken = route.query.access_token as string

onMounted(async () => {
  if (!accessToken) {
    toast.error('Error', 'No se recibió el token de autenticación')
    router.push('/login')
    return
  }

  try {
    // Exchange Google access_token for Strapi JWT
    // Strapi v5 doesn't return JWT directly in the redirect URL,
    // so we need to make an additional request to get it
    const authResponse = await $fetch('https://cms.iraklitbz.dev/api/auth/google/callback', {
      method: 'GET',
      params: {
        access_token: accessToken
      }
    })

    if (authResponse && authResponse.jwt && authResponse.user) {
      // Save Strapi JWT and user
      token.value = authResponse.jwt
      user.value = authResponse.user

      toast.success('¡Bienvenido!', `Has iniciado sesión con Google como ${authResponse.user.username}`)
      router.push('/')
    } else {
      throw new Error('No se recibió respuesta válida del servidor')
    }
  } catch (error: any) {
    console.error('[Google OAuth] Error:', error)
    toast.error('Error de autenticación', 'No se pudo completar el inicio de sesión con Google')

    // Clear any invalid data
    token.value = null
    user.value = null

    router.push('/login')
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
    <div class="text-center">
      <div class="w-16 h-16 mx-auto mb-4">
        <div class="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">
        Completando inicio de sesión...
      </h2>
      <p class="text-gray-600">
        Por favor espera un momento
      </p>
    </div>
  </div>
</template>
