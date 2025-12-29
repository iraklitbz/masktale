<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'guest',
})

const router = useRouter()
const { login } = useAuth()

// Form state
const email = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

// Validation errors
const errors = ref({
  email: '',
  password: '',
})

// Validate email
const validateEmail = () => {
  if (!email.value) {
    errors.value.email = 'El email es requerido'
    return false
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    errors.value.email = 'Email inválido'
    return false
  }
  errors.value.email = ''
  return true
}

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

// Handle form submit
const handleSubmit = async () => {
  // Validate
  const emailValid = validateEmail()
  const passwordValid = validatePassword()

  if (!emailValid || !passwordValid) {
    return
  }

  loading.value = true

  try {
    const result = await login({
      identifier: email.value,
      password: password.value,
    })

    if (result.success) {
      // Redirect to home
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

      <!-- Login Card -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">
          Iniciar Sesión
        </h2>

        <form @submit.prevent="handleSubmit">
          <!-- Email Field -->
          <div class="mb-4">
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
              :class="{ 'border-red-500': errors.email }"
              placeholder="tu@email.com"
              @blur="validateEmail"
              @input="errors.email = ''"
            >
            <Transition name="fade">
              <p v-if="errors.email" class="text-red-500 text-sm mt-1">
                {{ errors.email }}
              </p>
            </Transition>
          </div>

          <!-- Password Field -->
          <div class="mb-6">
            <label
              for="password"
              class="block text-sm font-semibold text-gray-700 mb-2"
            >
              Contraseña
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
            <Transition name="fade">
              <p v-if="errors.password" class="text-red-500 text-sm mt-1">
                {{ errors.password }}
              </p>
            </Transition>
          </div>

          <!-- Forgot Password Link -->
          <div class="text-right mb-6">
            <NuxtLink
              to="/forgot-password"
              class="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </NuxtLink>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            :disabled="loading"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Iniciando sesión...
            </span>
            <span v-else>Iniciar Sesión</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center gap-4">
          <div class="flex-1 h-px bg-gray-200" />
          <span class="text-sm text-gray-500">o</span>
          <div class="flex-1 h-px bg-gray-200" />
        </div>

        <!-- Register Link -->
        <p class="text-center text-gray-600">
          ¿No tienes cuenta?
          <NuxtLink
            to="/register"
            class="text-purple-600 hover:text-purple-700 font-semibold"
          >
            Regístrate aquí
          </NuxtLink>
        </p>
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
  transition: all 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-leave-to {
  opacity: 0;
}
</style>
