<script setup lang="ts">
import type { PageVersion } from '~/types/session'

interface Props {
  sessionId: string
  pageNumber: number
  versions: PageVersion[]
  currentVersion: number
  favoriteVersion?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectVersion: [version: number]
  setFavorite: [version: number | null]
  compare: [versions: number[]]
}>()

const toast = useToast()

// Selection for comparison
const selectedForComparison = ref<number[]>([])

const handleSelectVersion = (version: number) => {
  if (version === props.currentVersion) {
    toast.info('Versión actual', 'Esta versión ya está seleccionada')
    return
  }
  emit('selectVersion', version)
}

const handleToggleFavorite = (version: number) => {
  if (props.favoriteVersion === version) {
    emit('setFavorite', null) // Unset favorite
  } else {
    emit('setFavorite', version)
  }
}

const toggleComparisonSelection = (version: number) => {
  const index = selectedForComparison.value.indexOf(version)
  if (index > -1) {
    selectedForComparison.value.splice(index, 1)
  } else {
    if (selectedForComparison.value.length >= 3) {
      toast.warning('Máximo 3 versiones', 'Solo puedes comparar hasta 3 versiones a la vez')
      return
    }
    selectedForComparison.value.push(version)
  }
}

const startComparison = () => {
  if (selectedForComparison.value.length < 2) {
    toast.warning('Selecciona versiones', 'Debes seleccionar al menos 2 versiones para comparar')
    return
  }
  emit('compare', [...selectedForComparison.value])
}

const clearComparison = () => {
  selectedForComparison.value = []
}

const getImageUrl = (version: PageVersion) => {
  return `/api/session/${props.sessionId}/image/${props.pageNumber}?version=${version.version}`
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isSelected = (version: number) => {
  return selectedForComparison.value.includes(version)
}

// Sort versions by version number
const sortedVersions = computed(() => {
  return [...props.versions].sort((a, b) => a.version - b.version)
})
</script>

<template>
  <div class="version-history">
    <div class="history-header">
      <h3 class="history-title">
        Historial de Versiones - Página {{ pageNumber }}
      </h3>
      <p class="history-subtitle">
        {{ versions.length }} {{ versions.length === 1 ? 'versión generada' : 'versiones generadas' }}
      </p>
    </div>

    <!-- Comparison mode actions -->
    <div
      v-if="selectedForComparison.length > 0"
      class="comparison-actions"
    >
      <p class="comparison-text">
        {{ selectedForComparison.length }} {{ selectedForComparison.length === 1 ? 'versión seleccionada' : 'versiones seleccionadas' }}
      </p>
      <div class="comparison-buttons">
        <button
          class="btn-compare"
          :disabled="selectedForComparison.length < 2"
          @click="startComparison"
        >
          Comparar
        </button>
        <button
          class="btn-cancel"
          @click="clearComparison"
        >
          Cancelar
        </button>
      </div>
    </div>

    <!-- Version grid -->
    <div class="version-grid">
      <div
        v-for="version in sortedVersions"
        :key="version.version"
        :class="[
          'version-card',
          { 'is-current': version.version === currentVersion },
          { 'is-selected': isSelected(version.version) },
        ]"
      >
        <!-- Selection checkbox for comparison -->
        <div class="version-checkbox">
          <input
            :id="`version-${version.version}`"
            type="checkbox"
            :checked="isSelected(version.version)"
            @change="toggleComparisonSelection(version.version)"
          >
        </div>

        <!-- Image -->
        <div class="version-image-container">
          <img
            :src="getImageUrl(version)"
            :alt="`Versión ${version.version}`"
            class="version-image"
          >

          <!-- Current badge -->
          <div
            v-if="version.version === currentVersion"
            class="version-badge current-badge"
          >
            Actual
          </div>

          <!-- Favorite badge -->
          <button
            :class="['favorite-button', { 'is-favorite': favoriteVersion === version.version }]"
            @click="handleToggleFavorite(version.version)"
          >
            <svg
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        </div>

        <!-- Version info -->
        <div class="version-info">
          <div class="version-header">
            <span class="version-number">Versión {{ version.version }}</span>
            <span class="version-date">{{ formatDate(version.generatedAt) }}</span>
          </div>

          <!-- Select button -->
          <button
            v-if="version.version !== currentVersion"
            class="btn-select"
            @click="handleSelectVersion(version.version)"
          >
            Seleccionar
          </button>
          <div
            v-else
            class="current-indicator"
          >
            En uso
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.version-history {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.history-header {
  margin-bottom: 1.5rem;
}

.history-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.history-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* Comparison actions */
.comparison-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: linear-gradient(to right, #ede9fe, #fce7f3);
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.comparison-text {
  font-weight: 600;
  color: #7c3aed;
  margin: 0;
}

.comparison-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-compare,
.btn-cancel {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-compare {
  background-color: #7c3aed;
  color: white;
}

.btn-compare:hover:not(:disabled) {
  background-color: #6d28d9;
}

.btn-compare:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background-color: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover {
  background-color: #f9fafb;
}

/* Version grid */
.version-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.version-card {
  position: relative;
  border-radius: 0.75rem;
  border: 2px solid transparent;
  transition: all 0.2s;
  background: #f9fafb;
}

.version-card.is-current {
  border-color: #10b981;
  background: #f0fdf4;
}

.version-card.is-selected {
  border-color: #7c3aed;
  background: #f5f3ff;
}

.version-checkbox {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 10;
}

.version-checkbox input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  accent-color: #7c3aed;
}

.version-image-container {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 0.5rem;
  overflow: hidden;
  margin: 0.5rem;
}

.version-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.version-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.current-badge {
  background-color: #10b981;
  color: white;
}

.favorite-button {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.2s;
}

.favorite-button:hover {
  color: #fbbf24;
  transform: scale(1.1);
}

.favorite-button.is-favorite {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
}

.version-info {
  padding: 0.75rem;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.version-number {
  font-weight: 600;
  color: #111827;
  font-size: 0.875rem;
}

.version-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.btn-select {
  width: 100%;
  padding: 0.5rem;
  background-color: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-select:hover {
  background-color: #6d28d9;
  transform: translateY(-1px);
}

.current-indicator {
  text-align: center;
  padding: 0.5rem;
  color: #10b981;
  font-weight: 600;
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .version-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .comparison-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .comparison-buttons {
    width: 100%;
  }

  .btn-compare,
  .btn-cancel {
    flex: 1;
  }
}
</style>
