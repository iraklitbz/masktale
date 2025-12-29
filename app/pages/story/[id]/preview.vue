<script setup lang="ts">
import PageCarousel from '~/components/story/PageCarousel.vue'
import CarouselSkeleton from '~/components/story/CarouselSkeleton.vue'
import ConfirmDialog from '~/components/ConfirmDialog.vue'

// Get session ID from route
const route = useRoute()
const router = useRouter()
const sessionId = computed(() => route.params.id as string)

// Toast notifications
const toast = useToast()

// Load session state
const {
  pages,
  session,
  currentState,
  isLoading,
  error,
  canRegenerate,
  refresh,
} = useSessionState(sessionId.value)

// Regeneration state
const isRegenerating = ref(false)
const regeneratingPage = ref<number | null>(null)

// Confirmation dialog state
const showConfirmDialog = ref(false)
const confirmDialogData = ref({
  pageNumber: 0,
})

// Handle page regeneration
const handleRegenerate = async (pageNumber: number) => {
  if (!canRegenerate(pageNumber)) {
    toast.warning(
      'Límite alcanzado',
      'Esta página ya ha alcanzado el límite máximo de 3 regeneraciones.'
    )
    return
  }

  // Show confirmation dialog
  confirmDialogData.value.pageNumber = pageNumber
  showConfirmDialog.value = true
}

const confirmRegenerate = async () => {
  const pageNumber = confirmDialogData.value.pageNumber

  try {
    isRegenerating.value = true
    regeneratingPage.value = pageNumber

    // Call regenerate API
    const { data: result, error: apiError } = await useFetch(
      `/api/session/${sessionId.value}/regenerate`,
      {
        method: 'POST',
        body: {
          pageNumber,
        },
      }
    )

    if (apiError.value) {
      throw new Error(apiError.value.message || 'Error al regenerar la página')
    }

    // Refresh session state to get new version
    await refresh()

    // Success notification
    toast.success(
      '¡Regeneración exitosa!',
      `La página ${pageNumber} ha sido regenerada con una nueva versión.`
    )
  } catch (err: any) {
    console.error('[Preview] Regeneration error:', err)
    toast.error(
      'Error al regenerar',
      err.message || 'No se pudo regenerar la página. Intenta nuevamente.'
    )
  } finally {
    isRegenerating.value = false
    regeneratingPage.value = null
  }
}

// Handle finish/download (placeholder for future phase)
const handleFinish = () => {
  toast.info(
    'Próximamente',
    'La función de descarga PDF estará disponible en la próxima fase.'
  )
}

// Check if story is incomplete
const isIncomplete = computed(() => {
  if (!session.value || !pages.value) return false
  return pages.value.length < session.value.progress.totalPages
})

const missingPagesCount = computed(() => {
  if (!session.value || !pages.value) return 0
  return session.value.progress.totalPages - pages.value.length
})

const goBackToGenerate = () => {
  router.push(`/story/${sessionId.value}/generate`)
}
</script>

<template>
  <div class="preview-page">
    <!-- Header -->
    <header class="preview-header">
      <div class="container">
        <NuxtLink
          to="/"
          class="back-button"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span class="ml-2">Volver al inicio</span>
        </NuxtLink>

        <h1 class="preview-title">
          {{ session?.storyId ? 'Tu Cuento Personalizado' : 'Preview' }}
        </h1>

        <div class="header-actions">
          <button
            v-if="session?.status === 'completed'"
            class="btn-finish"
            @click="handleFinish"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span class="ml-2">Descargar PDF</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="preview-main">
      <div class="container">
        <!-- Loading state -->
        <Transition
          name="fade"
          mode="out-in"
        >
          <div
            v-if="isLoading"
            key="loading"
            class="loading-state"
          >
            <CarouselSkeleton />
            <p class="loading-text">Cargando tu cuento...</p>
          </div>

          <!-- Error state -->
          <div
            v-else-if="error"
            key="error"
            class="error-state"
          >
          <svg
            class="error-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 class="error-title">Error al cargar el cuento</h2>
          <p class="error-message">{{ error.message }}</p>
          <NuxtLink
            to="/"
            class="btn-primary mt-4"
          >
            Volver al inicio
          </NuxtLink>
        </div>

          <!-- Carousel with pages -->
          <div
            v-else-if="pages && pages.length > 0"
            key="carousel"
            class="carousel-section"
          >
          <!-- Regenerating overlay -->
          <div
            v-if="isRegenerating"
            class="regenerating-overlay"
          >
            <div class="regenerating-content">
              <div class="spinner" />
              <p class="regenerating-text">
                Regenerando página {{ regeneratingPage }}...
              </p>
              <p class="text-sm text-gray-400 mt-2">
                Esto puede tomar algunos segundos
              </p>
            </div>
          </div>

          <!-- Incomplete Warning -->
          <div
            v-if="isIncomplete"
            class="mb-8 rounded-2xl bg-gradient-to-r from-orange-400 to-red-400 p-6 text-white shadow-lg"
          >
            <div class="flex items-start gap-4">
              <svg
                class="w-8 h-8 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div class="flex-1">
                <h3 class="text-lg font-bold mb-2">
                  ⚠️ Cuento Incompleto
                </h3>
                <p class="text-orange-50 mb-3">
                  Faltan <strong>{{ missingPagesCount }}</strong> {{ missingPagesCount === 1 ? 'página' : 'páginas' }} por generar.
                  Algunas páginas fallaron durante la generación.
                </p>
                <button
                  class="px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                  @click="goBackToGenerate"
                >
                  Volver a Generar Páginas Faltantes
                </button>
              </div>
            </div>
          </div>

          <!-- Page Carousel Component -->
          <PageCarousel
            :pages="pages"
            :session-id="sessionId"
            :can-regenerate="canRegenerate"
            @regenerate="handleRegenerate"
          />

          <!-- Info section -->
          <div class="info-section">
            <div class="info-card">
              <h3 class="info-title">Sobre las regeneraciones</h3>
              <p class="info-text">
                Puedes regenerar cada página hasta <strong>3 veces</strong> para obtener
                diferentes versiones de las ilustraciones. Las versiones anteriores se guardan
                automáticamente.
              </p>
            </div>
          </div>
        </div>

          <!-- Empty state -->
          <div
            v-else
            key="empty"
            class="empty-state"
          >
            <svg
              class="empty-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 2 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <h2 class="empty-title">No hay páginas generadas</h2>
            <p class="empty-message">
              Este cuento aún no tiene páginas generadas.
            </p>
            <NuxtLink
              :to="`/story/${sessionId}/upload`"
              class="btn-primary mt-4"
            >
              Subir foto y generar
            </NuxtLink>
          </div>
        </Transition>
      </div>
    </main>

    <!-- Confirmation Dialog -->
    <ConfirmDialog
      v-model="showConfirmDialog"
      title="¿Regenerar página?"
      :message="`¿Estás seguro de que deseas regenerar la página ${confirmDialogData.pageNumber}? Esto creará una nueva versión de la ilustración.`"
      confirm-text="Regenerar"
      cancel-text="Cancelar"
      type="warning"
      @confirm="confirmRegenerate"
    />
  </div>
</template>

<style scoped>
* {
  scroll-behavior: smooth;
}

.preview-page {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #faf5ff, #fce7f3, #eff6ff);
}

/* Header */
.preview-header {
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 20;
}

.preview-header .container {
  max-width: 80rem;
  margin-left: auto;
  margin-right: auto;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-button {
  display: flex;
  align-items: center;
  color: #4b5563;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
  padding: 0.5rem;
  margin: -0.5rem;
  border-radius: 0.5rem;
}

.back-button:hover {
  color: #9333ea;
  background-color: #f3e8ff;
  transform: translateX(-4px);
}

.back-button:active {
  transform: translateX(-2px);
}

.preview-title {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(to right, #9333ea, #db2777);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

@media (min-width: 768px) {
  .preview-title {
    font-size: 1.5rem;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-finish {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #9333ea;
  color: white;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background-color 0.2s;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.btn-finish:hover {
  background-color: #7e22ce;
}

.btn-finish:focus {
  outline: none;
  box-shadow: 0 0 0 2px #a855f7, 0 0 0 4px white;
}

/* Main content */
.preview-main {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

@media (min-width: 768px) {
  .preview-main {
    padding-top: 3rem;
    padding-bottom: 3rem;
  }
}

.container {
  max-width: 80rem;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Loading state */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem 0;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #e9d5ff;
  border-top-color: #9333ea;
  border-radius: 9999px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 1rem;
  color: #4b5563;
  font-weight: 500;
}

/* Error state */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.error-icon {
  width: 4rem;
  height: 4rem;
  color: #ef4444;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-4px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(4px);
  }
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-top: 1rem;
}

.error-message {
  color: #4b5563;
  margin-top: 0.5rem;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: #9ca3af;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-top: 1rem;
}

.empty-message {
  color: #4b5563;
  margin-top: 0.5rem;
}

/* Carousel section */
.carousel-section {
  position: relative;
}

/* Regenerating overlay */
.regenerating-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
}

.regenerating-content {
  background-color: white;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.regenerating-text {
  margin-top: 1rem;
  font-size: 1.125rem;
  font-weight: 500;
  color: #111827;
}

/* Info section */
.info-section {
  margin-top: 3rem;
}

.info-card {
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  max-width: 42rem;
  margin-left: auto;
  margin-right: auto;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.info-card:hover {
  box-shadow: 0 4px 12px 0 rgba(147, 51, 234, 0.15);
  border-color: #e9d5ff;
  transform: translateY(-2px);
}

.info-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.info-text {
  color: #4b5563;
  line-height: 1.625;
}

/* Button styles */
.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: #9333ea;
  color: white;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background-color 0.2s;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.btn-primary:hover {
  background-color: #7e22ce;
}

.btn-primary:focus {
  outline: none;
  box-shadow: 0 0 0 2px #a855f7, 0 0 0 4px white;
}

/* Transitions */
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

/* Enhanced button transitions */
.btn-primary,
.btn-finish {
  transition: all 0.2s ease;
}

.btn-primary:hover,
.btn-finish:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
}

.btn-primary:active,
.btn-finish:active {
  transform: translateY(0);
}

/* Regenerating overlay enhanced transition */
.regenerating-overlay {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(4px);
  }
}

.regenerating-content {
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .preview-title {
    font-size: 1.125rem;
  }

  .btn-finish span {
    display: none;
  }

  .info-section {
    margin-top: 2rem;
  }
}
</style>
