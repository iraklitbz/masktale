<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'guest',
})

const router = useRouter()
const route = useRoute()
const { resetPassword } = useAuth()

// Get reset code from URL
const code = ref(route.query.code as string || '')

// Form state
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Validation errors
const errors = ref({
  password: '',
  confirmPassword: '',
})

// Check if code is present
const hasCode = computed(() => !!code.value)

// Validate password
const validatePassword = () => {
  if (!password.value) {
    errors.value.password = 'La contraseña es requerida'
    return false
  }
  if (password.value.length < 6) {
    errors.value.password = 'La contraseña debe tener al menos 6 caracteres'
    return false
  }
  errors.value.password = ''
  return true
}

// Validate confirm password
const validateConfirmPassword = () => {
  if (!confirmPassword.value) {
    errors.value.confirmPassword = 'Debes confirmar la contraseña'
    return false
  }
  if (confirmPassword.value !== password.value) {
    errors.value.confirmPassword = 'Las contraseñas no coinciden'
    return false
  }
  errors.value.confirmPassword = ''
  return true
}

// Password strength
const passwordStrength = computed(() => {
  if (!password.value) return { label: '', color: '', width: 0 }

  let strength = 0
  if (password.value.length >= 6) strength++
  if (password.value.length >= 10) strength++
  if (/[a-z]/.test(password.value) && /[A-Z]/.test(password.value)) strength++
  if (/\d/.test(password.value)) strength++
  if (/[^a-zA-Z0-9]/.test(password.value)) strength++

  if (strength <= 2) return { label: 'Débil', color: 'bg-red-500', width: 33 }
  if (strength <= 3) return { label: 'Media', color: 'bg-yellow-500', width: 66 }
  return { label: 'Fuerte', color: 'bg-green-500', width: 100 }
})

// Handle form submit
const handleSubmit = async () => {
  // Validate all fields
  const passwordValid = validatePassword()
  const confirmPasswordValid = validateConfirmPassword()

  if (!passwordValid || !confirmPasswordValid) {
    return
  }

  loading.value = true

  try {
    const result = await resetPassword({
      code: code.value,
      password: password.value,
      passwordConfirmation: confirmPassword.value,
    })

    if (result.success) {
      // Redirect to home (user is auto-logged in)
      router.push('/')
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
          <!-- No Code State -->
          <div v-if="!hasCode" key="no-code" class="text-center">
            <div class="mb-6">
              <div class="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            <h2 class="text-2xl font-bold text-gray-900 mb-3">
              Enlace Inválido
            </h2>

            <p class="text-gray-600 mb-6">
              El enlace de restablecimiento de contraseña no es válido o ha expirado.
            </p>

            <p class="text-sm text-gray-500 mb-6">
              Por favor, solicita un nuevo enlace de restablecimiento.
            </p>

            <NuxtLink
              to="/forgot-password"
              class="inline-block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              Solicitar Nuevo Enlace
            </NuxtLink>
          </div>

          <!-- Form State -->
          <div v-else key="form">
            <h2 class="text-2xl font-bold text-gray-900 mb-3">
              Restablecer Contraseña
            </h2>

            <p class="text-gray-600 mb-6">
              Ingresa tu nueva contraseña para completar el proceso.
            </p>

            <form @submit.prevent="handleSubmit">
              <!-- Password Field -->
              <div class="mb-4">
                <label
                  for="password"
                  class="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Nueva Contraseña
                </label>
                <div class="relative">
                  <input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors pr-12"
                    :class="{ 'border-red-500': errors.password }"
                    placeholder="••••••••"
                    @blur="validatePassword"
                    @input="errors.password = ''"
                  >
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    @click="showPassword = !showPassword"
                  >
                    <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
                <!-- Password Strength Indicator -->
                <div v-if="password" class="mt-2">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        :class="passwordStrength.color"
                        class="h-full transition-all duration-300"
                        :style="{ width: `${passwordStrength.width}%` }"
                      />
                    </div>
                    <span class="text-xs font-medium text-gray-600">
                      {{ passwordStrength.label }}
                    </span>
                  </div>
                </div>
                <Transition name="fade">
                  <p v-if="errors.password" class="text-red-500 text-sm mt-1">
                    {{ errors.password }}
                  </p>
                </Transition>
              </div>

              <!-- Confirm Password Field -->
              <div class="mb-6">
                <label
                  for="confirmPassword"
                  class="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Confirmar Contraseña
                </label>
                <div class="relative">
                  <input
                    id="confirmPassword"
                    v-model="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors pr-12"
                    :class="{ 'border-red-500': errors.confirmPassword }"
                    placeholder="••••••••"
                    @blur="validateConfirmPassword"
                    @input="errors.confirmPassword = ''"
                  >
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    @click="showConfirmPassword = !showConfirmPassword"
                  >
                    <svg v-if="!showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
                <Transition name="fade">
                  <p v-if="errors.confirmPassword" class="text-red-500 text-sm mt-1">
                    {{ errors.confirmPassword }}
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
                  Restableciendo...
                </span>
                <span v-else>Restablecer Contraseña</span>
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
