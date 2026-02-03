<script setup lang="ts">
/**
 * Existing Book Modal
 * Shows when user tries to create a new story while having an existing one
 * Offers options to continue with existing book or delete it
 */

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  continueExisting: []
  deleteAndCreate: []
}>()

const { loading } = useSession()

// Close on escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.show) {
      emit('close')
    }
  }
  document.addEventListener('keydown', handleEscape)
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <!-- Modal -->
        <div class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <!-- Close button -->
          <button
            class="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            @click="emit('close')"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Icon -->
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <svg class="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>

          <!-- Title -->
          <h3 class="mb-2 text-center text-xl font-bold text-gray-900">
            Ya tienes un cuento en progreso
          </h3>

          <!-- Description -->
          <p class="mb-6 text-center text-gray-600">
            Tienes un cuento que ya has generado. ¿Quieres continuar con él o crear uno nuevo?
          </p>

          <!-- Warning -->
          <div class="mb-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            <div class="flex items-start gap-2">
              <svg class="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Si creas un nuevo cuento, el anterior se eliminará con todas sus imágenes.</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-3">
            <button
              class="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-[0.98]"
              :disabled="loading"
              @click="emit('continueExisting')"
            >
              Continuar con mi cuento
            </button>
            <button
              class="w-full rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 active:scale-[0.98]"
              :disabled="loading"
              @click="emit('deleteAndCreate')"
            >
              <span v-if="loading" class="flex items-center justify-center gap-2">
                <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Eliminando...
              </span>
              <span v-else>Eliminar y crear nuevo</span>
            </button>
            <button
              class="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              @click="emit('close')"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from > div:last-child {
  transform: scale(0.9) translateY(20px);
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to > div:last-child {
  transform: scale(0.9) translateY(20px);
}
</style>
