<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'guest',
  ssr: false,
})

const router = useRouter()
const { register } = useAuth()

// Form state
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const registered = ref(false)

// Validation errors
const errors = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

// Validate username
const validateUsername = () => {
  if (!username.value) {
    errors.value.username = 'El nombre de usuario es requerido'
    return false
  }
  if (username.value.length < 3) {
    errors.value.username = 'El nombre debe tener al menos 3 caracteres'
    return false
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.value)) {
    errors.value.username = 'Solo letras, números y guión bajo'
    return false
  }
  errors.value.username = ''
  return true
}

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
  const usernameValid = validateUsername()
  const emailValid = validateEmail()
  const passwordValid = validatePassword()
  const confirmPasswordValid = validateConfirmPassword()

  if (!usernameValid || !emailValid || !passwordValid || !confirmPasswordValid) {
    return
  }

  loading.value = true

  try {
    const result = await register({
      username: username.value,
      email: email.value,
      password: password.value,
    })

    if (result.success) {
      // Show success message instead of redirecting
      registered.value = true
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

      <!-- Register Card -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <Transition name="fade" mode="out-in">
          <!-- Success State - Email Confirmation -->
          <div v-if="registered" key="success" class="text-center">
            <div class="mb-6">
              <div class="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
            </div>

            <h2 class="text-2xl font-bold text-gray-900 mb-3">
              ¡Cuenta Creada!
            </h2>

            <p class="text-gray-600 mb-4">
              Hemos enviado un email de confirmación a:
            </p>

            <p class="text-lg font-semibold text-purple-600 mb-6">
              {{ email }}
            </p>

            <div class="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <p class="text-sm text-blue-900 font-semibold mb-2">
                📧 Siguiente paso:
              </p>
              <p class="text-sm text-blue-800">
                Revisa tu bandeja de entrada y haz clic en el enlace de confirmación para activar tu cuenta.
              </p>
            </div>

            <p class="text-xs text-gray-500 mb-6">
              Si no recibes el email en los próximos minutos, revisa tu carpeta de spam o correo no deseado.
            </p>

            <NuxtLink
              to="/login"
              class="inline-block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              Ir al Login
            </NuxtLink>
          </div>

          <!-- Form State -->
          <div v-else key="form">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">
              Crear Cuenta
            </h2>

            <form @submit.prevent="handleSubmit">
          <!-- Username Field -->
          <div class="mb-4">
            <label
              for="username"
              class="block text-sm font-semibold text-gray-700 mb-2"
            >
              Nombre de usuario
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
              :class="{ 'border-red-500': errors.username }"
              placeholder="usuario123"
              @blur="validateUsername"
              @input="errors.username = ''"
            >
            <Transition name="fade">
              <p v-if="errors.username" class="text-red-500 text-sm mt-1">
                {{ errors.username }}
              </p>
            </Transition>
          </div>

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
          <div class="mb-4">
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
                autocomplete="new-password"
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
                autocomplete="new-password"
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
              Creando cuenta...
            </span>
            <span v-else>Crear Cuenta</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center gap-4">
          <div class="flex-1 h-px bg-gray-200" />
          <span class="text-sm text-gray-500">o</span>
          <div class="flex-1 h-px bg-gray-200" />
        </div>

        <!-- Login Link -->
        <p class="text-center text-gray-600">
          ¿Ya tienes cuenta?
          <NuxtLink
            to="/login"
            class="text-purple-600 hover:text-purple-700 font-semibold"
          >
            Inicia sesión aquí
          </NuxtLink>
        </p>
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
