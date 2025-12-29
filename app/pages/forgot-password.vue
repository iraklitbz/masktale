<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'guest',
})

const { forgotPassword } = useAuth()

// Form state
const email = ref('')
const loading = ref(false)
const success = ref(false)

// Validation errors
const emailError = ref('')

// Validate email
const validateEmail = () => {
  if (!email.value) {
    emailError.value = 'El email es requerido'
    return false
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Email inválido'
    return false
  }
  emailError.value = ''
  return true
}

// Handle form submit
const handleSubmit = async () => {
  // Validate
  const emailValid = validateEmail()

  if (!emailValid) {
    return
  }

  loading.value = true

  try {
    const result = await forgotPassword({
      email: email.value,
    })

    if (result.success) {
      success.value = true
    }
  } finally {
    loading.value = false
  }
}
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
          <div v-if="success" key="success" class="text-center">
            <div class="mb-6">
              <div class="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 class="text-2xl font-bold text-gray-900 mb-3">
              Email Enviado
            </h2>

            <p class="text-gray-600 mb-6">
              Hemos enviado un email a <strong>{{ email }}</strong> con las instrucciones para restablecer tu contraseña.
            </p>

            <p class="text-sm text-gray-500 mb-6">
              Si no recibes el email en los próximos minutos, revisa tu carpeta de spam.
            </p>

            <NuxtLink
              to="/login"
              class="inline-block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              Volver al Login
            </NuxtLink>
          </div>

          <!-- Form State -->
          <div v-else key="form">
            <h2 class="text-2xl font-bold text-gray-900 mb-3">
              ¿Olvidaste tu contraseña?
            </h2>

            <p class="text-gray-600 mb-6">
              No te preocupes, te enviaremos un email con instrucciones para restablecerla.
            </p>

            <form @submit.prevent="handleSubmit">
              <!-- Email Field -->
              <div class="mb-6">
                <label
                  for="email"
                  class="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
                  :class="{ 'border-red-500': emailError }"
                  placeholder="tu@email.com"
                  @blur="validateEmail"
                  @input="emailError = ''"
                >
                <Transition name="fade">
                  <p v-if="emailError" class="text-red-500 text-sm mt-1">
                    {{ emailError }}
                  </p>
                </Transition>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                :disabled="loading"
              >
                <span v-if="loading" class="flex items-center justify-center gap-2">
                  <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </span>
                <span v-else>Enviar Email</span>
              </button>
            </form>

            <!-- Login Link -->
            <div class="mt-6 text-center">
              <NuxtLink
                to="/login"
                class="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                ← Volver al login
              </NuxtLink>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Back to Home -->
      <div class="text-center mt-6">
        <NuxtLink
          to="/"
          class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Volver al inicio
        </NuxtLink>
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
