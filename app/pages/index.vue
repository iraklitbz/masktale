<script setup lang="ts">
import type { StoryListItem } from '~/app/types/story'
import ExistingBookModal from '~/components/session/ExistingBookModal.vue'

// Use session composable
const {
  createSession,
  deleteSession,
  hasGeneratedBook,
  getPreviewUrl,
  sessionId,
  loading: sessionLoading,
  error: sessionError
} = useSession()

// Fetch stories
const { data: stories, pending, error } = await useFetch<StoryListItem[]>('/api/story')

// Modal state
const showExistingBookModal = ref(false)
const pendingStoryId = ref<string | null>(null)

async function handleStorySelect(storyId: string) {
  console.log('Selected story:', storyId)

  // Check if there's an existing book
  if (hasGeneratedBook()) {
    pendingStoryId.value = storyId
    showExistingBookModal.value = true
    return
  }

  // No existing book, create new session directly
  await createNewSession(storyId)
}

async function createNewSession(storyId: string) {
  // Create session for this story
  const newSessionId = await createSession(storyId)

  if (newSessionId) {
    // Navigate to upload page
    console.log('Session created:', newSessionId)
    await navigateTo(`/story/${storyId}/upload`)
  }
}

// Modal handlers
function handleContinueExisting() {
  showExistingBookModal.value = false
  const previewUrl = getPreviewUrl()
  if (previewUrl) {
    navigateTo(previewUrl)
  }
}

async function handleDeleteAndCreate() {
  if (!pendingStoryId.value) return

  // Delete existing session
  const deleted = await deleteSession()

  if (deleted) {
    showExistingBookModal.value = false
    // Create new session
    await createNewSession(pendingStoryId.value)
  }
}

function handleCloseModal() {
  showExistingBookModal.value = false
  pendingStoryId.value = null
}
</script>

<template>
  <div>
    <!-- Hero section -->
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-center">
      <p class="text-lg text-gray-600">
        Crea cuentos personalizados con la cara de tu hijo/a
      </p>
    </div>

    <!-- Main content -->
    <main class="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <!-- Loading state -->
      <div v-if="pending" class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p class="mt-4 text-gray-600">Cargando cuentos...</p>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="mx-auto max-w-md rounded-lg bg-red-50 p-6 text-center">
        <div class="text-4xl">⚠️</div>
        <h3 class="mt-2 text-lg font-semibold text-red-900">
          Error al cargar cuentos
        </h3>
        <p class="mt-1 text-sm text-red-600">
          {{ error.message }}
        </p>
      </div>

      <!-- Stories grid -->
      <div v-else-if="stories && stories.length > 0">
        <!-- Section header -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900">
            Elige tu cuento
          </h2>
          <p class="mt-1 text-gray-600">
            Selecciona uno de nuestros cuentos mágicos para personalizar
          </p>
        </div>

        <!-- Grid -->
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StoryCard
            v-for="story in stories"
            :key="story.id"
            :story="story"
            @select="handleStorySelect"
          />
        </div>

        <!-- Session error -->
        <div v-if="sessionError" class="mt-6 rounded-lg bg-red-50 p-4 text-center text-red-600">
          {{ sessionError }}
        </div>

        <!-- Session loading -->
        <div v-if="sessionLoading" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div class="rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div class="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p class="mt-4 text-lg font-semibold text-gray-900">
              Creando tu sesión...
            </p>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="mx-auto max-w-md rounded-lg bg-white p-8 text-center shadow-sm">
        <div class="text-6xl">📚</div>
        <h3 class="mt-4 text-lg font-semibold text-gray-900">
          No hay cuentos disponibles
        </h3>
        <p class="mt-1 text-sm text-gray-600">
          Vuelve más tarde para ver nuevos cuentos
        </p>
      </div>
    </main>

    <!-- Existing book modal -->
    <ExistingBookModal
      :show="showExistingBookModal"
      @close="handleCloseModal"
      @continue-existing="handleContinueExisting"
      @delete-and-create="handleDeleteAndCreate"
    />
  </div>
</template>
