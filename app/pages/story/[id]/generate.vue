<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const storyId = route.params.id as string

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
    // Start generation automatically
    await startGeneration()
  }
})

async function startGeneration() {
  if (!session.value || !story.value) return

  generating.value = true
  error.value = null

  try {
    // Generate each page sequentially
    for (let pageNum = 1; pageNum <= totalPages.value; pageNum++) {
      currentPage.value = pageNum
      pageStatus.value[pageNum] = 'generating'

      try {
        const response = await $fetch(
          `/api/session/${session.value.id}/generate`,
          {
            method: 'POST',
            body: {
              pageNumber: pageNum,
              regenerate: false,
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
        error.value = `Error en página ${pageNum}: ${e.data?.statusMessage || e.message}`
        // Continue with next page instead of stopping
      }

      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // All done
    if (!error.value) {
      console.log('All pages generated successfully!')
      // Wait a bit before redirecting
      await new Promise(resolve => setTimeout(resolve, 2000))
      // TODO: Redirect to preview page (Phase 6)
      alert('¡Todas las páginas generadas!\n\nEn la Fase 6 verás el preview con carrusel.')
    }
  } catch (e: any) {
    error.value = e.data?.statusMessage || e.message || 'Error durante la generación'
  } finally {
    generating.value = false
  }
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
      <div v-if="generating && currentPageData" class="mb-8 rounded-2xl bg-white p-8 shadow-lg">
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

      <!-- Success Message -->
      <div
        v-if="allCompleted"
        class="animate-bounce rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 p-8 text-center text-white shadow-2xl"
      >
        <div class="mb-4 text-6xl">🎉</div>
        <h3 class="mb-2 text-2xl font-bold">
          ¡Cuento Completado!
        </h3>
        <p class="text-green-50">
          Todas las páginas han sido generadas exitosamente
        </p>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="rounded-2xl bg-red-50 p-6 text-red-700 shadow-lg"
      >
        <div class="flex items-center gap-3">
          <span class="text-3xl">⚠️</span>
          <div>
            <h3 class="font-bold">Error durante la generación</h3>
            <p class="text-sm">{{ error }}</p>
          </div>
        </div>
      </div>

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
