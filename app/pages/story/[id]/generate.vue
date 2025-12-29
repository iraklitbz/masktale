<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const storyId = route.params.id as string

// Toast notifications
const toast = useToast()

// State
const { session, loadSession } = useSession()
const generating = ref(false)
const currentPage = ref(0)
const totalPages = ref(5)
const error = ref<string | null>(null)
const generatedImages = ref<Record<number, string>>({})
const pageStatus = ref<Record<number, 'pending' | 'generating' | 'completed' | 'error'>>({})

// Load session and story
const { data: story } = await useFetch(`/api/story/${storyId}`)

onMounted(async () => {
  const sessionId = localStorage.getItem('mask-session-id')
  if (!sessionId) {
    toast.error('No hay sesión', 'Por favor crea una nueva sesión')
    router.push('/')
    return
  }

  await loadSession(sessionId)

  if (story.value) {
    totalPages.value = story.value.pages.length
    // Initialize page status
    for (let i = 1; i <= totalPages.value; i++) {
      pageStatus.value[i] = 'pending'
    }
    toast.info('Iniciando generación', `Se generarán ${totalPages.value} páginas personalizadas`)
    // Start generation automatically
    await startGeneration()
  } else {
    toast.error('Error', 'No se pudo cargar el cuento')
  }
})

async function generatePage(pageNum: number, isRetry = false) {
  if (!session.value) return

  pageStatus.value[pageNum] = 'generating'
  currentPage.value = pageNum

  try {
    const response = await $fetch(
      `/api/session/${session.value.id}/generate`,
      {
        method: 'POST',
        body: {
          pageNumber: pageNum,
          regenerate: isRetry,
        },
      }
    )

    // Store generated image
    generatedImages.value[pageNum] = response.imageData
    pageStatus.value[pageNum] = 'completed'

    console.log(`Page ${pageNum} generated successfully`)
  } catch (e: any) {
    console.error(`Error generating page ${pageNum}:`, e)
    pageStatus.value[pageNum] = 'error'
    toast.error(`Página ${pageNum} falló`, e.message || 'Error al generar la página')
  }
}

async function startGeneration() {
  if (!session.value || !story.value) return

  generating.value = true
  error.value = null

  try {
    // Generate each page sequentially
    for (let pageNum = 1; pageNum <= totalPages.value; pageNum++) {
      // Skip already completed pages
      if (pageStatus.value[pageNum] === 'completed') continue

      await generatePage(pageNum)

      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Check if all completed
    if (allCompleted.value) {
      console.log('All pages generated successfully!')
      toast.success('¡Cuento completado!', 'Todas las páginas fueron generadas exitosamente')
      // Wait a bit before redirecting
      await new Promise(resolve => setTimeout(resolve, 2000))
      // Redirect to preview page
      router.push(`/story/${session.value.id}/preview`)
    } else if (hasErrors.value) {
      toast.warning('Generación parcial', `${completedCount.value} de ${totalPages.value} páginas completadas`)
    }
  } catch (e: any) {
    error.value = e.data?.statusMessage || e.message || 'Error durante la generación'
    toast.error('Error en la generación', error.value)
  } finally {
    generating.value = false
  }
}

async function retryFailedPages() {
  if (!session.value) return

  generating.value = true
  error.value = null

  try {
    const failedPages = Object.entries(pageStatus.value)
      .filter(([_, status]) => status === 'error')
      .map(([page, _]) => parseInt(page))

    for (const pageNum of failedPages) {
      await generatePage(pageNum, true)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Check if all completed now
    if (allCompleted.value) {
      console.log('All pages generated successfully!')
      toast.success('¡Todas las páginas completadas!', 'Las páginas fallidas fueron regeneradas exitosamente')
      await new Promise(resolve => setTimeout(resolve, 2000))
      router.push(`/story/${session.value.id}/preview`)
    } else {
      toast.warning('Aún hay errores', `${errorCount.value} ${errorCount.value === 1 ? 'página' : 'páginas'} no ${errorCount.value === 1 ? 'pudo' : 'pudieron'} ser generada`)
    }
  } catch (e: any) {
    error.value = e.data?.statusMessage || e.message || 'Error durante la generación'
    toast.error('Error al reintentar', error.value)
  } finally {
    generating.value = false
  }
}

function goToPreview() {
  if (!session.value) return
  router.push(`/story/${session.value.id}/preview`)
}

// Computed
const progressPercentage = computed(() => {
  const completed = Object.values(pageStatus.value).filter(s => s === 'completed').length
  return Math.round((completed / totalPages.value) * 100)
})

const currentPageData = computed(() => {
  if (!story.value || currentPage.value === 0) return null
  return story.value.pages.find((p: any) => p.pageNumber === currentPage.value)
})

const allCompleted = computed(() => {
  return Object.values(pageStatus.value).every(s => s === 'completed')
})

const hasErrors = computed(() => {
  return Object.values(pageStatus.value).some(s => s === 'error')
})

const completedCount = computed(() => {
  return Object.values(pageStatus.value).filter(s => s === 'completed').length
})

const errorCount = computed(() => {
  return Object.values(pageStatus.value).filter(s => s === 'error').length
})

const generationFinished = computed(() => {
  return !generating.value && Object.values(pageStatus.value).every(
    s => s === 'completed' || s === 'error'
  )
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
    <!-- Header -->
    <header class="border-b border-white/50 bg-white/70 backdrop-blur-sm">
      <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 class="text-2xl font-bold text-gray-900">
          ✨ Generando tu cuento mágico
        </h1>
        <p class="text-sm text-gray-600">
          Por favor espera mientras la IA crea las ilustraciones personalizadas
        </p>
      </div>
    </header>

    <!-- Main -->
    <main class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <!-- Overall Progress -->
      <div class="mb-8 rounded-2xl bg-white p-8 shadow-lg">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900">
            Progreso General
          </h2>
          <span class="text-2xl font-bold text-purple-600">
            {{ progressPercentage }}%
          </span>
        </div>

        <!-- Progress Bar -->
        <div class="mb-6 h-4 overflow-hidden rounded-full bg-gray-200">
          <div
            class="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-1000 ease-out"
            :style="{ width: `${progressPercentage}%` }"
          />
        </div>

        <!-- Page Grid -->
        <div class="grid grid-cols-5 gap-3">
          <div
            v-for="pageNum in totalPages"
            :key="pageNum"
            class="flex flex-col items-center gap-2"
          >
            <!-- Status Icon -->
            <div
              class="flex h-16 w-16 items-center justify-center rounded-xl border-2 transition-all duration-300"
              :class="{
                'border-gray-300 bg-gray-50': pageStatus[pageNum] === 'pending',
                'animate-pulse border-purple-500 bg-purple-100': pageStatus[pageNum] === 'generating',
                'border-green-500 bg-green-100': pageStatus[pageNum] === 'completed',
                'border-red-500 bg-red-100': pageStatus[pageNum] === 'error',
              }"
            >
              <span v-if="pageStatus[pageNum] === 'pending'" class="text-2xl opacity-50">⏳</span>
              <span v-else-if="pageStatus[pageNum] === 'generating'" class="text-2xl">✨</span>
              <span v-else-if="pageStatus[pageNum] === 'completed'" class="text-2xl">✅</span>
              <span v-else-if="pageStatus[pageNum] === 'error'" class="text-2xl">❌</span>
            </div>

            <!-- Page Number -->
            <span
              class="text-xs font-medium"
              :class="{
                'text-gray-500': pageStatus[pageNum] === 'pending',
                'text-purple-600': pageStatus[pageNum] === 'generating',
                'text-green-600': pageStatus[pageNum] === 'completed',
                'text-red-600': pageStatus[pageNum] === 'error',
              }"
            >
              Pág. {{ pageNum }}
            </span>
          </div>
        </div>
      </div>

      <!-- Current Page Info -->
      <Transition name="fade" mode="out-in">
        <div v-if="generating && currentPageData" key="generating" class="mb-8 rounded-2xl bg-white p-8 shadow-lg">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <span class="text-2xl">🎨</span>
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-900">
              Generando Página {{ currentPage }}
            </h3>
            <p class="text-sm text-gray-600">
              {{ currentPageData.metadata.sceneDescription }}
            </p>
          </div>
        </div>

        <!-- Loading Animation -->
        <div class="flex items-center justify-center py-8">
          <div class="relative">
            <div class="h-20 w-20 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-2xl">✨</span>
            </div>
          </div>
        </div>

        <p class="text-center text-sm text-gray-500">
          La IA está creando una ilustración única con la cara de tu hijo/a...
        </p>
        </div>
      </Transition>

      <!-- Success Message -->
      <Transition name="fade" mode="out-in">
        <div
        v-if="allCompleted && generationFinished"
        class="mb-8 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 p-8 text-center text-white shadow-2xl"
      >
        <div class="mb-4 text-6xl">🎉</div>
        <h3 class="mb-2 text-2xl font-bold">
          ¡Cuento Completado!
        </h3>
        <p class="text-green-50">
          Todas las páginas han sido generadas exitosamente
        </p>
        </div>
      </Transition>

      <!-- Partial Success with Errors -->
      <Transition name="fade" mode="out-in">
        <div
        v-if="hasErrors && generationFinished"
        class="mb-8 rounded-2xl bg-gradient-to-r from-orange-400 to-red-400 p-8 text-center text-white shadow-2xl"
      >
        <div class="mb-4 text-6xl">⚠️</div>
        <h3 class="mb-2 text-2xl font-bold">
          Generación Incompleta
        </h3>
        <p class="text-orange-50 mb-4">
          {{ completedCount }} de {{ totalPages }} páginas generadas correctamente
        </p>
        <p class="text-sm text-orange-100">
          {{ errorCount }} {{ errorCount === 1 ? 'página falló' : 'páginas fallaron' }} durante la generación
        </p>
        </div>
      </Transition>

      <!-- Action Buttons -->
      <Transition name="fade" mode="out-in">
        <div
        v-if="generationFinished"
        class="flex flex-col gap-3 sm:flex-row"
      >
        <!-- Retry Failed Pages Button -->
        <button
          v-if="hasErrors"
          class="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="generating"
          @click="retryFailedPages"
        >
          <span class="flex items-center justify-center gap-2">
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reintentar páginas fallidas ({{ errorCount }})
          </span>
        </button>

        <!-- Go to Preview Button -->
        <button
          v-if="completedCount > 0"
          class="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
          @click="goToPreview"
        >
          <span class="flex items-center justify-center gap-2">
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Ver Preview {{ hasErrors ? `(${completedCount} páginas)` : '' }}
          </span>
        </button>
        </div>
      </Transition>

      <!-- Preview Grid (show generated images) -->
      <div v-if="Object.keys(generatedImages).length > 0" class="mt-8">
        <h3 class="mb-4 text-lg font-bold text-gray-900">
          Páginas Generadas
        </h3>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(imageData, pageNum) in generatedImages"
            :key="pageNum"
            class="overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg"
          >
            <img
              :src="imageData"
              :alt="`Página ${pageNum}`"
              class="h-64 w-full object-cover"
            >
            <div class="p-3">
              <p class="text-sm font-semibold text-gray-900">
                Página {{ pageNum }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
* {
  scroll-behavior: smooth;
}

/* Fade transitions */
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
button {
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
}

button:active:not(:disabled) {
  transform: translateY(0);
}
</style>
