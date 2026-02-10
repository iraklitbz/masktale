<script setup lang="ts">
import type { StoryTexts, StoryConfig } from '~/types/story'
import type { Session, CurrentState } from '~/types/session'

interface Props {
  sessionId: string
  session: Session
  currentState: CurrentState
  storyTexts: StoryTexts
  storyConfig: StoryConfig
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

// Comic generator composable
const { generatePreview } = useComicGenerator()

// State
const selectedLayout = ref('classic-2-1')
const includeBubbles = ref(true)
const comicImageUrl = ref<string | null>(null)
const isLoading = ref(false)
const isDownloading = ref(false)
const availableLayouts = ref<string[]>([])

// Layout display names
const layoutNames: Record<string, string> = {
  'vertical-equal': 'Vertical (3 iguales)',
  'classic-1-2': 'Clasico 1+2',
  'classic-2-1': 'Clasico 2+1',
  'dynamic-action': 'Accion Dinamica',
  'hero-reveal': 'Revelacion Heroe',
  'story-progression': 'Progresion Historia',
  'cat-rescue': 'Rescate Gatito',
}

// Generate preview on mount and when options change
const loadPreview = async () => {
  isLoading.value = true
  try {
    const result = await generatePreview({
      sessionId: props.sessionId,
      layout: selectedLayout.value,
      locale: props.storyTexts.locale || 'es',
      includeBubbles: includeBubbles.value,
      quality: 'preview',
    })

    if (result) {
      comicImageUrl.value = result.imageData
      availableLayouts.value = result.availableLayouts
    }
  } finally {
    isLoading.value = false
  }
}

// Handle layout change
const handleLayoutChange = async () => {
  await loadPreview()
}

// Handle bubbles toggle
const handleBubblesToggle = async () => {
  await loadPreview()
}

// Handle download PDF — fetch full quality image from server, then build PDF
const handleDownloadPdf = async () => {
  if (!comicImageUrl.value) {
    toast.error('Error', 'No hay imagen del comic para descargar. Espera a que cargue el preview.')
    return
  }

  isDownloading.value = true
  toast.info('Generando PDF', 'Generando comic en alta calidad...')

  try {
    // Fetch full-quality image from server (A4@300dpi)
    const fullResult = await generatePreview({
      sessionId: props.sessionId,
      layout: selectedLayout.value,
      locale: props.storyTexts.locale || 'es',
      includeBubbles: includeBubbles.value,
      quality: 'full',
    })

    if (!fullResult) {
      toast.error('Error', 'No se pudo generar la imagen en alta calidad')
      return
    }

    // Create PDF
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = 210
    const pageHeight = 297
    const margin = 10

    // Cover page
    pdf.setFillColor(147, 51, 234)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(36)
    pdf.text('COMIC', pageWidth / 2, 100, { align: 'center' })
    pdf.setFontSize(24)
    const childName = props.session.userPhoto?.childName || 'Protagonista'
    pdf.text(childName, pageWidth / 2, 140, { align: 'center' })

    // Comic page with full-quality image
    pdf.addPage()

    const imgWidth = pageWidth - (margin * 2)
    // A4 proportions: 2480/3508 ≈ 0.707
    const imgHeight = imgWidth / 0.707

    const x = margin
    const y = (pageHeight - imgHeight) / 2

    pdf.addImage(fullResult.imageData, 'PNG', x, y, imgWidth, imgHeight)

    // Back cover
    pdf.addPage()
    pdf.setFillColor(147, 51, 234)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(24)
    pdf.text('Fin', pageWidth / 2, pageHeight / 2, { align: 'center' })

    // Save
    const safeName = childName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '').replace(/\s+/g, '_')
    pdf.save(`${safeName}_Comic.pdf`)

    toast.success('PDF generado', 'Comic descargado correctamente')
  } catch (error: any) {
    console.error('[ComicPreview] PDF error:', error)
    toast.error('Error', 'No se pudo generar el PDF')
  } finally {
    isDownloading.value = false
  }
}

// Keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  await loadPreview()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    class="comic-preview-overlay"
    @click.self="$emit('close')"
  >
    <div class="comic-preview-container">
      <!-- Header -->
      <div class="comic-preview-header">
        <h2 class="comic-preview-title">Vista Previa del Comic</h2>
        <button
          class="close-button"
          @click="$emit('close')"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Main content -->
      <div class="comic-preview-content">
        <!-- Comic image preview -->
        <div class="comic-image-wrapper">
          <div
            v-if="isLoading"
            class="loading-state"
          >
            <div class="spinner" />
            <p>Componiendo comic...</p>
          </div>
          <div
            v-else-if="comicImageUrl"
            class="comic-image-container"
          >
            <img
              :src="comicImageUrl"
              alt="Comic preview"
              class="comic-image"
            >
          </div>
          <div
            v-else
            class="empty-state"
          >
            <svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No se pudo generar la vista previa</p>
          </div>
        </div>

        <!-- Controls -->
        <div class="comic-controls">
          <!-- Layout selector -->
          <div class="control-group">
            <label for="layout-select" class="control-label">Layout</label>
            <select
              id="layout-select"
              v-model="selectedLayout"
              class="control-select"
              :disabled="isLoading"
              @change="handleLayoutChange"
            >
              <option
                v-for="layout in availableLayouts"
                :key="layout"
                :value="layout"
              >
                {{ layoutNames[layout] || layout }}
              </option>
            </select>
          </div>

          <!-- Bubbles toggle -->
          <div class="control-group">
            <label class="control-checkbox">
              <input
                type="checkbox"
                v-model="includeBubbles"
                :disabled="isLoading"
                @change="handleBubblesToggle"
              >
              <span class="checkbox-label">Incluir bocadillos</span>
            </label>
          </div>

          <!-- Download button -->
          <button
            class="download-button"
            :disabled="isLoading || isDownloading || !comicImageUrl"
            @click="handleDownloadPdf"
          >
            <div
              v-if="isDownloading"
              class="spinner-small"
            />
            <svg
              v-else
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
            <span>{{ isDownloading ? 'Generando...' : 'Descargar PDF A4' }}</span>
          </button>

          <!-- Refresh button -->
          <button
            class="refresh-button"
            :disabled="isLoading"
            @click="loadPreview"
          >
            <svg
              class="w-5 h-5"
              :class="{ 'animate-spin': isLoading }"
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
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <!-- Footer info -->
      <div class="comic-preview-footer">
        <p class="text-sm text-gray-500">
          El PDF se generara en formato A4 vertical (210x297mm) con las vinetas seleccionadas.
        </p>
        <p class="text-xs text-gray-400 mt-1">
          Presiona ESC para cerrar
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comic-preview-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.92);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.comic-preview-container {
  background-color: white;
  border-radius: 1rem;
  width: 95vw;
  max-width: 1200px;
  height: 95vh;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.comic-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.comic-preview-title {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(to right, #9333ea, #db2777);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.close-button {
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.comic-preview-content {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
  min-height: 0;
}

.comic-image-wrapper {
  flex: 1;
  background-color: #1a1a2e;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 0;
  padding: 1rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #9ca3af;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #e9d5ff;
  border-top-color: #9333ea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-small {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.comic-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comic-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 20px 40px -10px rgba(0, 0, 0, 0.5);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #9ca3af;
}

.comic-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.75rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.control-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.control-select {
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background-color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.control-select:hover:not(:disabled) {
  border-color: #9333ea;
}

.control-select:focus {
  outline: none;
  border-color: #9333ea;
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
}

.control-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 0;
}

.control-checkbox input {
  width: 1rem;
  height: 1rem;
  accent-color: #9333ea;
  cursor: pointer;
}

.checkbox-label {
  font-size: 0.875rem;
  color: #374151;
}

.download-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(to right, #9333ea, #db2777);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;
}

.download-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
}

.download-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-button:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
  color: #374151;
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comic-preview-footer {
  padding: 0.75rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .comic-preview-overlay {
    padding: 0.5rem;
  }

  .comic-preview-container {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .comic-preview-header {
    padding: 0.5rem 1rem;
  }

  .comic-preview-content {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .comic-image-wrapper {
    padding: 0.5rem;
    border-radius: 0.5rem;
  }

  .comic-controls {
    flex-direction: column;
    align-items: stretch;
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .download-button {
    margin-left: 0;
    justify-content: center;
  }

  .control-group {
    width: 100%;
  }

  .control-select {
    width: 100%;
  }

  .comic-preview-footer {
    padding: 0.5rem 1rem;
  }

  .comic-preview-footer p {
    font-size: 0.75rem;
  }
}
</style>
