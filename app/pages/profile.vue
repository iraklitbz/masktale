<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  ssr: false,
})

const { user, logout } = useAuth()
const router = useRouter()
const toast = useToast()

// Delete account state
const showDeleteConfirm = ref(false)
const deleteLoading = ref(false)
const confirmText = ref('')

// Handle delete account
const handleDeleteAccount = async () => {
  if (confirmText.value !== user.value?.username) {
    toast.error('Error', 'El nombre de usuario no coincide')
    return
  }

  deleteLoading.value = true

  try {
    const client = useStrapiClient()

    // Delete user account
    await client(`/users/${user.value?.id}`, {
      method: 'DELETE',
    })

    toast.success('Cuenta eliminada', 'Tu cuenta ha sido eliminada correctamente')

    // Logout and redirect
    await logout()
    router.push('/')
  } catch (error: any) {
    console.error('[Profile] Delete account error:', error)
    toast.error('Error', 'No se pudo eliminar la cuenta')
  } finally {
    deleteLoading.value = false
  }
}

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Mi Perfil
        </h1>
        <p class="text-gray-600">
          Administra tu información personal y configuración de cuenta
        </p>
      </div>

      <!-- Profile Card -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
        <!-- Avatar Section -->
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-12 text-center">
          <div class="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-4xl font-bold mb-4">
            {{ user?.username.charAt(0).toUpperCase() }}
          </div>
          <h2 class="text-2xl font-bold text-white mb-1">
            {{ user?.username }}
          </h2>
          <p class="text-purple-100">
            {{ user?.email }}
          </p>
        </div>

        <!-- Info Section -->
        <div class="px-8 py-6 space-y-6">
          <!-- Username -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Nombre de usuario
            </label>
            <div class="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <p class="text-gray-900">{{ user?.username }}</p>
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Correo electrónico
            </label>
            <div class="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
              <p class="text-gray-900">{{ user?.email }}</p>
              <span v-if="user?.confirmed" class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Verificado
              </span>
            </div>
          </div>

          <!-- Account Created -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Cuenta creada
            </label>
            <div class="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <p class="text-gray-900">{{ formatDate(user?.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-red-200">
        <div class="px-8 py-6 bg-red-50">
          <h3 class="text-lg font-bold text-red-900 mb-1">
            Zona de peligro
          </h3>
          <p class="text-sm text-red-700">
            Las acciones aquí son permanentes e irreversibles
          </p>
        </div>

        <div class="px-8 py-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-gray-900 mb-1">
                Eliminar cuenta
              </h4>
              <p class="text-sm text-gray-600">
                Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, ten seguridad.
              </p>
            </div>
            <button
              class="ml-4 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
              @click="showDeleteConfirm = true"
            >
              Eliminar cuenta
            </button>
          </div>
        </div>
      </div>

      <!-- Back to Home -->
      <div class="mt-6 text-center">
        <NuxtLink
          to="/"
          class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Volver al inicio
        </NuxtLink>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Transition name="modal">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        @click.self="showDeleteConfirm = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">
              ¿Estás seguro?
            </h3>
            <p class="text-gray-600">
              Esta acción no se puede deshacer. Se eliminarán permanentemente todos tus datos.
            </p>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Escribe <span class="text-red-600">{{ user?.username }}</span> para confirmar
            </label>
            <input
              v-model="confirmText"
              type="text"
              class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-red-500 focus:outline-none transition-colors"
              :placeholder="user?.username"
            >
          </div>

          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              @click="showDeleteConfirm = false; confirmText = ''"
              :disabled="deleteLoading"
            >
              Cancelar
            </button>
            <button
              class="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleDeleteAccount"
              :disabled="deleteLoading || confirmText !== user?.username"
            >
              <span v-if="deleteLoading" class="flex items-center justify-center gap-2">
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Eliminando...
              </span>
              <span v-else>Eliminar definitivamente</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.9);
}
</style>
