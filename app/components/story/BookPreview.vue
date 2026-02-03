<script setup lang="ts">
import type { StoryTexts, PageText } from '~/types/story'
import type { Session, CurrentState } from '~/types/session'

interface Props {
  sessionId: string
  session: Session
  currentState: CurrentState
  storyTexts: StoryTexts
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

// Get child name
const childName = computed(() => props.session.userPhoto?.childName || 'Protagonista')

// Interpolate text with child name
const interpolateText = (text: string): string => {
  return text.replace(/\{childName\}/g, childName.value)
}

// Current spread index (0 = cover, 1-5 = story spreads, 6 = back cover)
const currentSpread = ref(0)
const totalSpreads = computed(() => props.storyTexts.pages.length + 2) // +2 for cover and back cover

// Get image URL for a page
const getImageUrl = (pageNumber: number): string => {
  const selectedVersions = props.currentState.selectedVersions
  const favoriteVersions = props.currentState.favoriteVersions || {}

  let version = selectedVersions[pageNumber]?.version || 1
  if (favoriteVersions[pageNumber]) {
    version = favoriteVersions[pageNumber]
  }

  return `/api/session/${props.sessionId}/image/${pageNumber}?version=${version}`
}

// Get page text for current spread
const currentPageText = computed((): PageText | null => {
  if (currentSpread.value === 0 || currentSpread.value === totalSpreads.value - 1) {
    return null
  }
  return props.storyTexts.pages[currentSpread.value - 1] || null
})

// Navigation
const goToPrevious = () => {
  if (currentSpread.value > 0) {
    currentSpread.value--
  }
}

const goToNext = () => {
  if (currentSpread.value < totalSpreads.value - 1) {
    currentSpread.value++
  }
}

const goToSpread = (index: number) => {
  currentSpread.value = index
}

// Keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft') {
    goToPrevious()
  } else if (e.key === 'ArrowRight') {
    goToNext()
  } else if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    class="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div class="relative w-full max-w-6xl flex flex-col items-center gap-6">
      <!-- Close button -->
      <button
        class="absolute -top-12 right-0 p-2 bg-white/10 border-none rounded-lg text-white cursor-pointer transition-all hover:bg-white/20 hover:scale-110"
        @click="$emit('close')"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Book spread view -->
      <div class="flex w-full aspect-[2/1] max-h-[70vh] shadow-2xl rounded-lg overflow-hidden md:flex-row flex-col md:aspect-[2/1] aspect-[1/1.5]">
        <!-- COVER -->
        <template v-if="currentSpread === 0">
          <div class="flex-1 relative flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white">
            <div class="text-center max-w-[80%]">
              <h1 class="text-xl md:text-3xl lg:text-5xl font-bold mb-2 drop-shadow-lg">
                {{ storyTexts.cover.title }}
              </h1>
              <p class="text-sm md:text-base lg:text-xl opacity-90 italic">
                {{ storyTexts.cover.tagline }}
              </p>
              <div class="w-16 h-1 bg-white/50 mx-auto my-4 md:my-6 rounded" />
              <p class="text-sm md:text-base opacity-80 mb-2">
                {{ storyTexts.cover.subtitle }}
              </p>
              <h2 class="text-xl md:text-2xl lg:text-4xl font-bold mt-2">
                {{ childName }}
              </h2>
            </div>
          </div>
          <div class="flex-1 relative flex items-center justify-center p-4 bg-gray-50">
            <div class="w-full h-full flex items-center justify-center">
              <img
                v-if="currentState.selectedVersions[1]"
                :src="getImageUrl(1)"
                alt="Preview portada"
                class="w-full h-full object-cover rounded-lg"
              >
              <div v-else class="flex flex-col items-center justify-center w-full h-full bg-gray-100 rounded-lg">
                <svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </template>

        <!-- STORY SPREADS (Text left, Image right) -->
        <template v-else-if="currentSpread > 0 && currentSpread < totalSpreads - 1">
          <div class="flex-1 relative flex flex-col items-center justify-center p-4 md:p-8 bg-gray-50">
            <div class="max-w-[90%] text-center">
              <h2 class="text-lg md:text-xl lg:text-3xl font-bold text-purple-600 mb-4">
                {{ currentPageText?.title }}
              </h2>
              <div class="w-12 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 mx-auto mb-6 rounded" />
              <p class="text-sm md:text-base lg:text-lg leading-relaxed text-gray-700">
                {{ interpolateText(currentPageText?.text || '') }}
              </p>
            </div>
            <span class="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-400">
              {{ (currentSpread * 2) - 1 }}
            </span>
          </div>
          <div class="flex-1 relative flex items-center justify-center p-4 bg-white">
            <img
              v-if="currentPageText && currentState.selectedVersions[currentPageText.pageNumber]"
              :src="getImageUrl(currentPageText.pageNumber)"
              :alt="`Ilustracion pagina ${currentPageText.pageNumber}`"
              class="w-full h-full object-contain rounded-lg shadow-lg"
            >
            <div v-else class="flex flex-col items-center justify-center w-full h-full bg-gray-100 rounded-lg">
              <svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-gray-400 mt-2">Imagen no disponible</p>
            </div>
            <span class="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-400">
              {{ currentSpread * 2 }}
            </span>
          </div>
        </template>

        <!-- BACK COVER -->
        <template v-else>
          <div class="flex-1 relative flex items-center justify-center p-4 md:p-8 bg-gray-50">
            <div class="text-center max-w-[80%]">
              <p class="text-base md:text-lg lg:text-2xl leading-relaxed text-gray-600 italic">
                {{ interpolateText(storyTexts.backCover.message) }}
              </p>
              <div class="w-10 h-0.5 bg-purple-600 mx-auto my-6 md:my-8 rounded" />
              <h2 class="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-600">
                {{ storyTexts.backCover.footer }}
              </h2>
            </div>
          </div>
          <div class="flex-1 relative flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-500">
            <div class="w-full h-full flex items-center justify-center">
              <img
                v-if="currentState.selectedVersions[storyTexts.pages.length]"
                :src="getImageUrl(storyTexts.pages.length)"
                alt="Preview contraportada"
                class="w-full h-full object-cover"
              >
              <div
                v-else
                class="w-full h-full"
                style="background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 20px 20px;"
              />
            </div>
          </div>
        </template>
      </div>

      <!-- Navigation controls -->
      <div class="flex items-center gap-8">
        <button
          class="p-3 bg-white/10 border-none rounded-full text-white cursor-pointer transition-all hover:bg-white/20 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white/10"
          :disabled="currentSpread === 0"
          @click="goToPrevious"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex gap-2">
          <button
            v-for="i in totalSpreads"
            :key="i"
            class="w-3 h-3 rounded-full border-none cursor-pointer transition-all"
            :class="currentSpread === i - 1 ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/50'"
            @click="goToSpread(i - 1)"
          />
        </div>

        <button
          class="p-3 bg-white/10 border-none rounded-full text-white cursor-pointer transition-all hover:bg-white/20 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white/10"
          :disabled="currentSpread === totalSpreads - 1"
          @click="goToNext"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Spread info -->
      <div class="text-white/70 text-sm">
        <span v-if="currentSpread === 0">Portada</span>
        <span v-else-if="currentSpread === totalSpreads - 1">Contraportada</span>
        <span v-else>Paginas {{ (currentSpread * 2) - 1 }}-{{ currentSpread * 2 }}</span>
      </div>

      <!-- Keyboard hint -->
      <p class="text-white/40 text-xs hidden md:block">
        Usa las flechas del teclado para navegar
      </p>
    </div>
  </div>
</template>
