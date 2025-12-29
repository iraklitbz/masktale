<script setup lang="ts">
import { useSwipe, useMagicKeys } from '@vueuse/core'

interface Page {
  pageNumber: number
  version: number
  imageUrl: string
  generatedAt: string
}

interface Props {
  pages: Page[]
  sessionId: string
  canRegenerate?: (pageNumber: number) => boolean
}

const props = withDefaults(defineProps<Props>(), {
  canRegenerate: () => true,
})

const emit = defineEmits<{
  regenerate: [pageNumber: number]
}>()

// Current page index
const currentIndex = ref(0)

// Swipe support for mobile
const carouselRef = ref<HTMLElement>()
const { direction } = useSwipe(carouselRef, {
  passive: true,
  onSwipeEnd(e, direction) {
    if (direction === 'left') {
      nextPage()
    } else if (direction === 'right') {
      prevPage()
    }
  },
})

// Keyboard navigation
const { arrowleft, arrowright } = useMagicKeys()
watch(arrowleft, (pressed) => {
  if (pressed) prevPage()
})
watch(arrowright, (pressed) => {
  if (pressed) nextPage()
})

// Navigation methods
const nextPage = () => {
  if (currentIndex.value < props.pages.length - 1) {
    currentIndex.value++
  }
}

const prevPage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const goToPage = (index: number) => {
  currentIndex.value = index
}

// Current page computed
const currentPage = computed(() => props.pages[currentIndex.value])

// Regenerate current page
const handleRegenerate = () => {
  if (currentPage.value) {
    emit('regenerate', currentPage.value.pageNumber)
  }
}
</script>

<template>
  <div class="page-carousel">
    <!-- Main carousel -->
    <div
      ref="carouselRef"
      class="carousel-container"
    >
      <!-- Navigation buttons -->
      <button
        v-if="currentIndex > 0"
        class="nav-button nav-button-prev"
        @click="prevPage"
        aria-label="Previous page"
      >
        <svg
          class="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <!-- Pages container with transitions -->
      <div class="pages-wrapper">
        <TransitionGroup name="slide">
          <div
            v-for="(page, index) in pages"
            v-show="index === currentIndex"
            :key="page.pageNumber"
            class="page-slide"
          >
            <div class="page-content">
              <!-- Page image -->
              <img
                :src="page.imageUrl"
                :alt="`Page ${page.pageNumber}`"
                class="page-image"
              />

              <!-- Page info overlay -->
              <div class="page-info">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">
                    Página {{ page.pageNumber }} de {{ pages.length }}
                  </span>
                  <span class="text-xs text-gray-400">
                    v{{ page.version }}
                  </span>
                </div>
              </div>

              <!-- Regenerate button -->
              <button
                v-if="canRegenerate(page.pageNumber)"
                class="regenerate-button"
                @click="handleRegenerate"
                title="Regenerar esta página"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span class="ml-2">Regenerar</span>
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Next button -->
      <button
        v-if="currentIndex < pages.length - 1"
        class="nav-button nav-button-next"
        @click="nextPage"
        aria-label="Next page"
      >
        <svg
          class="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>

    <!-- Page indicators (dots) -->
    <div class="page-indicators">
      <button
        v-for="(page, index) in pages"
        :key="page.pageNumber"
        :class="[
          'indicator-dot',
          { 'indicator-dot-active': index === currentIndex },
        ]"
        @click="goToPage(index)"
        :aria-label="`Go to page ${page.pageNumber}`"
      />
    </div>

    <!-- Keyboard hint -->
    <div class="keyboard-hint">
      Usa las flechas ← → para navegar
    </div>
  </div>
</template>

<style scoped>
.page-carousel {
  width: 100%;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
}

.carousel-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
}

@media (min-width: 768px) {
  .carousel-container {
    min-height: 600px;
  }
}

/* Navigation buttons */
.nav-button {
  position: absolute;
  z-index: 10;
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-radius: 9999px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.nav-button:hover {
  background-color: white;
  transform: scale(1.1);
}

.nav-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px #a855f7;
}

.nav-button-prev {
  left: 0.5rem;
}

@media (min-width: 768px) {
  .nav-button-prev {
    left: 1rem;
  }
}

.nav-button-next {
  right: 0.5rem;
}

@media (min-width: 768px) {
  .nav-button-next {
    right: 1rem;
  }
}

/* Pages wrapper */
.pages-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 4rem;
  padding-right: 4rem;
}

@media (min-width: 768px) {
  .pages-wrapper {
    padding-left: 5rem;
    padding-right: 5rem;
  }
}

.page-slide {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-content {
  position: relative;
  width: 100%;
  max-width: 48rem;
}

/* Page image */
.page-image {
  width: 100%;
  height: auto;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* Page info overlay */
.page-info {
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  border-radius: 0.5rem;
  color: white;
}

/* Regenerate button */
.regenerate-button {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  background-color: #9333ea;
  color: white;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-weight: 500;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s;
}

.regenerate-button:hover {
  background-color: #7e22ce;
}

.regenerate-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px #a855f7, 0 0 0 4px white;
}

/* Page indicators */
.page-indicators {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.indicator-dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 9999px;
  background-color: #d1d5db;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.indicator-dot:hover {
  background-color: #9ca3af;
}

.indicator-dot:focus {
  outline: none;
  box-shadow: 0 0 0 2px #a855f7;
}

.indicator-dot-active {
  background-color: #9333ea;
  width: 2rem;
}

/* Keyboard hint */
.keyboard-hint {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 1rem;
  display: none;
}

@media (min-width: 768px) {
  .keyboard-hint {
    display: block;
  }
}

/* Slide transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease-in-out;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(2rem);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-2rem);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .page-info {
    font-size: 0.75rem;
  }

  .regenerate-button {
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
  }

  .regenerate-button span {
    display: none;
  }

  .nav-button {
    padding: 0.5rem;
  }

  .nav-button svg {
    width: 1.5rem;
    height: 1.5rem;
  }
}
</style>
