<script setup lang="ts">
/**
 * Floating Book Button
 * Shows when user has a generated book, allowing quick return to preview
 */

const { session, currentState, sessionId, hasGeneratedBook, getPreviewUrl } = useSession()

// Computed to check if button should show
const shouldShow = computed(() => {
  return hasGeneratedBook()
})

// Get the story title from session
const storyTitle = computed(() => {
  return session.value?.storyId || 'tu cuento'
})

// Navigation
const router = useRouter()
const route = useRoute()

// Don't show if already on preview page
const isOnPreviewPage = computed(() => {
  return route.path.includes('/preview')
})

function goToPreview() {
  const url = getPreviewUrl()
  if (url) {
    router.push(url)
  }
}
</script>

<template>
  <Transition name="slide-up">
    <button
      v-if="shouldShow && !isOnPreviewPage"
      class="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
      @click="goToPreview"
    >
      <!-- Book icon -->
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <span class="text-sm font-semibold">Ver mi cuento</span>
    </button>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
