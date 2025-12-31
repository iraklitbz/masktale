<script setup lang="ts">
import CartIcon from '~/components/cart/CartIcon.vue'

const {user, isAuthenticated, logout} = useAuth()
const authInitialized = useState('auth-initialized', () => false)

// User menu visibility
const showUserMenu = ref(false)

// Handle logout
const handleLogout = async () => {
  showUserMenu.value = false
  await logout()
}

// Close menu when clicking outside
const userMenuRef = ref<HTMLElement | null>(null)

onMounted(() => {
  console.log(showUserMenu)
  const handleClickOutside = (event: MouseEvent) => {
    if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
      showUserMenu.value = false
    }
  }

  document.addEventListener('click', handleClickOutside)

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
    <!-- Header -->
    <header class="border-b border-white/50 bg-white/70 backdrop-blur-sm sticky top-0 z-50">
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <!-- Logo/Brand -->
          <NuxtLink to="/" class="flex items-center gap-2">
            <h1 class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🎨 Mask Stories
            </h1>
          </NuxtLink>

          <!-- Cart & Auth section -->
          <div class="flex items-center gap-4">
            <!-- Cart Icon -->
            <CartIcon />

            <!-- Loading state while auth initializes -->
            <div v-if="!authInitialized" class="w-8 h-8">
              <div class="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>

            <!-- Authenticated user -->
            <div v-else-if="isAuthenticated && user" class="relative" ref="userMenuRef">
              <button
                class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white/80 transition-colors"
                @click="showUserMenu = !showUserMenu"
              >
                <div
                  class="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  {{ user.username.charAt(0).toUpperCase() }}
                </div>
                <span class="hidden sm:inline">{{ user.username }}</span>
                <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': showUserMenu }" fill="none"
                     stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <!-- Dropdown menu -->
              <Transition name="fade-scale">
                <div
                  v-if="showUserMenu"
                  class="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 py-1"
                >
                  <div class="px-4 py-2 border-b border-gray-100">
                    <p class="text-sm font-semibold text-gray-900">{{ user.username }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ user.email }}</p>
                  </div>
                  <NuxtLink
                    to="/profile"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    @click="showUserMenu = false"
                  >
                    <span class="flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      Mi Perfil
                    </span>
                  </NuxtLink>
                  <button
                    class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    @click="handleLogout"
                  >
                    <span class="flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                      Cerrar Sesión
                    </span>
                  </button>
                </div>
              </Transition>
            </div>

            <!-- Guest user -->
            <div v-else-if="authInitialized" class="flex items-center gap-2">
              <NuxtLink
                to="/login"
                class="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
              >
                Iniciar Sesión
              </NuxtLink>
              <NuxtLink
                to="/register"
                class="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                Registrarse
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <slot/>

    <!-- Footer -->
    <footer class="mt-20 border-t border-gray-200 bg-white/50 py-6 backdrop-blur-sm">
      <div class="mx-auto max-w-7xl px-4 text-center text-sm text-gray-600 sm:px-6 lg:px-8">
        <p>Mask Stories © 2025 - Cuentos personalizados con IA</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s ease;
}

.fade-scale-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
