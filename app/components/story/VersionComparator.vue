<script setup lang="ts">
import type { PageVersion } from '~/types/session'

interface Props {
  sessionId: string
  pageNumber: number
  versions: PageVersion[]
  comparingVersions: number[]
  currentVersion: number
  favoriteVersion?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  selectVersion: [version: number]
  setFavorite: [version: number | null]
}>()

const toast = useToast()

const getVersionData = (versionNumber: number) => {
  return props.versions.find(v => v.version === versionNumber)
}

const getImageUrl = (version: number) => {
  return `/api/session/${props.sessionId}/image/${props.pageNumber}?version=${version}`
}

const handleSelectVersion = (version: number) => {
  if (version === props.currentVersion) {
    toast.info('Versión actual', 'Esta versión ya está seleccionada')
    return
  }
  emit('selectVersion', version)
}

const handleToggleFavorite = (version: number) => {
  if (props.favoriteVersion === version) {
    emit('setFavorite', null)
  } else {
    emit('setFavorite', version)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="comparator-overlay">
    <div class="comparator-container">
      <!-- Header -->
      <div class="comparator-header">
        <h2 class="comparator-title">
          Comparar Versiones - Página {{ pageNumber }}
        </h2>
        <button
          class="btn-close"
          @click="emit('close')"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Comparison grid -->
      <div :class="['comparison-grid', `grid-${comparingVersions.length}`]">
        <div
          v-for="versionNumber in comparingVersions"
          :key="versionNumber"
          class="comparison-item"
        >
          <div class="comparison-image-wrapper">
            <img
              :src="getImageUrl(versionNumber)"
              :alt="`Versión ${versionNumber}`"
              class="comparison-image"
            >

            <!-- Badges -->
            <div class="badges">
              <div
                v-if="versionNumber === currentVersion"
                class="badge current-badge"
              >
                Actual
              </div>
              <button
                :class="['badge-favorite', { 'is-favorite': favoriteVersion === versionNumber }]"
                @click="handleToggleFavorite(versionNumber)"
              >
                <svg
                  class="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Version info -->
          <div class="comparison-info">
            <div class="info-row">
              <span class="info-label">Versión</span>
              <span class="info-value">{{ versionNumber }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Generada</span>
              <span class="info-value">{{ formatDate(getVersionData(versionNumber)?.generatedAt || '') }}</span>
            </div>

            <!-- Select button -->
            <button
              v-if="versionNumber !== currentVersion"
              class="btn-select-version"
              @click="handleSelectVersion(versionNumber)"
            >
              Seleccionar esta versión
            </button>
            <div
              v-else
              class="current-label"
            >
              ✓ En uso
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="comparator-footer">
        <p class="footer-text">
          Haz clic en una imagen para verla en tamaño completo
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comparator-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.comparator-container {
  background: white;
  border-radius: 1.5rem;
  max-width: 90rem;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.comparator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.comparator-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.btn-close {
  padding: 0.5rem;
  background: #f3f4f6;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #e5e7eb;
  color: #111827;
}

.comparison-grid {
  display: grid;
  gap: 1.5rem;
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.comparison-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comparison-image-wrapper {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.comparison-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s;
}

.comparison-image:hover {
  transform: scale(1.05);
}

.badges {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.badge,
.badge-favorite {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

.current-badge {
  background: rgba(16, 185, 129, 0.9);
  color: white;
}

.badge-favorite {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: all 0.2s;
}

.badge-favorite:hover {
  color: #fbbf24;
  transform: scale(1.1);
}

.badge-favorite.is-favorite {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
}

.comparison-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

.btn-select-version {
  padding: 0.75rem;
  background-color: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-select-version:hover {
  background-color: #6d28d9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.current-label {
  text-align: center;
  padding: 0.75rem;
  color: #10b981;
  font-weight: 600;
  font-size: 0.875rem;
}

.comparator-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 1.5rem 1.5rem;
}

.footer-text {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

@media (max-width: 1024px) {
  .grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .grid-2,
  .grid-3 {
    grid-template-columns: 1fr;
  }

  .comparator-title {
    font-size: 1.125rem;
  }
}
</style>
