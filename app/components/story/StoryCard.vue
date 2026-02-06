<script setup lang="ts">
import type { StoryListItem } from '~/types/story'

const props = defineProps<{
  story: StoryListItem
}>()

const emit = defineEmits<{
  select: [storyId: string]
}>()

// Theme colors mapping
const themeColors = {
  education: 'bg-blue-100 text-blue-700 border-blue-200',
  adventure: 'bg-green-100 text-green-700 border-green-200',
  celebration: 'bg-purple-100 text-purple-700 border-purple-200',
  family: 'bg-pink-100 text-pink-700 border-pink-200',
  nature: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  friendship: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

// Theme icons
const themeIcons = {
  education: '📚',
  adventure: '🗺️',
  celebration: '🎉',
  family: '👨‍👩‍👧‍👦',
  nature: '🌳',
  friendship: '🤝',
}

const themeClass = computed(() => themeColors[props.story.theme] || themeColors.education)
const themeIcon = computed(() => themeIcons[props.story.theme] || '📖')

function handleClick() {
  emit('select', props.story.id)
}
</script>

<template>
  <div
    class="group cursor-pointer overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    @click="handleClick"
  >
    <!-- Thumbnail -->
    <div class="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
      <img
        v-if="story.thumbnail"
        :src="story.thumbnail"
        :alt="story.title.es"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
      >
      <div v-else class="flex h-full items-center justify-center text-6xl">
        {{ themeIcon }}
      </div>

      <!-- Theme badge -->
      <div
        class="absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm"
        :class="themeClass"
      >
        {{ themeIcon }} {{ story.theme }}
      </div>
    </div>

    <!-- Content -->
    <div class="p-5">
      <!-- Title -->
      <h3 class="mb-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
        {{ story.title.es }}
      </h3>

      <!-- Description -->
      <p class="mb-4 line-clamp-2 text-sm text-gray-600">
        {{ story.description.es }}
      </p>

      <!-- Meta info -->
      <div class="flex items-center gap-4 text-xs text-gray-500">
        <div class="flex items-center gap-1">
          <span class="text-base">👶</span>
          <span>{{ story.ageRange.min }}-{{ story.ageRange.max }} años</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-base">📄</span>
          <span>{{ story.pageCount }} páginas</span>
        </div>
      </div>

      <!-- CTA Button -->
      <button
        class="mt-4 w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 active:bg-blue-700"
        @click.stop="handleClick"
      >
        Crear mi cuento
      </button>
    </div>
  </div>
</template>
