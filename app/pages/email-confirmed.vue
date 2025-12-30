<script setup lang="ts">
definePageMeta({
  layout: false,
  ssr: false,
})

const route = useRoute()
const router = useRouter()

// Check if confirmation was successful
const confirmed = computed(() => route.query.confirmed === 'true')
const error = computed(() => route.query.error)

// Auto redirect to login after 5 seconds
onMounted(() => {
  if (confirmed.value) {
    setTimeout(() => {
      router.push('/login')
    }, 5000)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Mask
        </h1>
        <p class="text-gray-600">
          Cuentos Personalizados con IA
        </p>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <Transition name="fade" mode="out-in">
          <!-- Success State -->
          <div v-if="confirmed" key="success" class="text-center">
            <div class="mb-6">
              <div class="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 class="text-3xl font-bold text-gray-900 mb-3">
              ¡Email Confirmado!
            </h2>

            <p class="text-gray-600 mb-6">
              Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión y comenzar a crear cuentos personalizados.
            </p>

            <div class="bg-blue-50 rounded-lg p-4 mb-6">
              <p class="text-sm text-blue-800">
                Serás redirigido al login en 5 segundos...
              </p>
            </div>

            <NuxtLink
              to="/login"
              class="inline-block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              Iniciar Sesión Ahora
            </NuxtLink>
          </div>

          <!-- Error State -->
          <div v-else key="error" class="text-center">
            <div class="mb-6">
              <div class="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            <h2 class="text-3xl font-bold text-gray-900 mb-3">
              Error de Confirmación
            </h2>

            <p class="text-gray-600 mb-2">
              No se pudo confirmar tu email.
            </p>

            <p v-if="error" class="text-sm text-red-600 mb-6">
              {{ error }}
            </p>

            <p class="text-sm text-gray-500 mb-6">
              El enlace puede haber expirado o ya fue usado. Por favor, intenta registrarte de nuevo o contacta con soporte.
            </p>

            <div class="flex gap-3">
              <NuxtLink
                to="/register"
                class="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-center"
              >
                Registrarse
              </NuxtLink>
              <NuxtLink
                to="/"
                class="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                Volver al Inicio
              </NuxtLink>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
