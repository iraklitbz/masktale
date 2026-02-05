<template>
  <div class="bubble-editor">
    <div class="editor-header">
      <h3>Editar posición de bocadillos</h3>
      <p class="subtitle">Arrastra los bocadillos para ajustar su posición</p>
    </div>

    <div class="editor-container" ref="containerRef">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Cargando editor...</p>
      </div>

      <template v-else>
        <!-- Image with bubbles overlay -->
        <div class="canvas-wrapper" :style="canvasStyle">
          <img
            ref="imageRef"
            :src="imageUrl"
            class="comic-image"
            @load="onImageLoad"
          />
          
          <!-- Draggable bubbles -->
          <div
            v-for="bubble in editableBubbles"
            :key="bubble.id"
            class="draggable-bubble"
            :class="[
              bubble.type,
              { dragging: bubble.isDragging },
              { selected: selectedBubble === bubble.id }
            ]"
            :style="getBubbleStyle(bubble)"
            @mousedown="startDrag($event, bubble)"
            @touchstart="startDrag($event, bubble)"
            @click="selectBubble(bubble.id)"
          >
            <div class="bubble-content">
              <span class="bubble-text">{{ bubble.text }}</span>
            </div>
            <div 
              class="bubble-tail"
              :class="bubble.tailDirection"
            />
            <div class="bubble-handle">
              <Icon name="mdi:drag" size="16" />
            </div>
          </div>

          <!-- Face position indicator (for reference) -->
          <div
            v-if="facePosition"
            class="face-indicator"
            :style="getFaceIndicatorStyle()"
            title="Posición de la cara (referencia)"
          >
            <div class="face-circle" />
            <span class="face-label">Cara</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="editor-controls">
          <div class="bubble-list">
            <h4>Bocadillos:</h4>
            <div
              v-for="bubble in editableBubbles"
              :key="bubble.id"
              class="bubble-item"
              :class="{ active: selectedBubble === bubble.id }"
              @click="selectBubble(bubble.id)"
            >
              <span class="bubble-type-badge" :class="bubble.type">
                {{ getBubbleTypeLabel(bubble.type) }}
              </span>
              <span class="bubble-preview">{{ truncateText(bubble.text, 30) }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <button
              class="btn btn-secondary"
              @click="resetPositions"
              :disabled="saving"
            >
              <Icon name="mdi:refresh" />
              Restaurar posiciones
            </button>
            <button
              class="btn btn-primary"
              @click="savePositions"
              :disabled="saving || !hasChanges"
            >
              <Icon name="mdi:check" v-if="!saving" />
              <Icon name="mdi:loading" class="spin" v-else />
              {{ saving ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Success notification -->
    <div v-if="showSuccess" class="success-toast">
      <Icon name="mdi:check-circle" />
      <span>¡Posiciones guardadas correctamente!</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Bubble {
  id: string
  type: 'speech' | 'thought' | 'sfx'
  text: string
  originalPosition: { x: number; y: number }
  currentPosition: { x: number; y: number }
  tailDirection?: string
  size?: 'small' | 'medium' | 'large'
  speaker?: string
  isDragging?: boolean
}

interface Props {
  sessionId: string
  pageNumber: number
  locale?: string
}

const props = withDefaults(defineProps<Props>(), {
  locale: 'es'
})

const emit = defineEmits<{
  saved: [path: string]
  close: []
}>()

// State
const loading = ref(true)
const saving = ref(false)
const imageUrl = ref('')
const bubbles = ref<Bubble[]>([])
const editableBubbles = ref<Bubble[]>([])
const facePosition = ref<{ x: number; y: number } | null>(null)
const selectedBubble = ref<string | null>(null)
const showSuccess = ref(false)
const hasChanges = ref(false)

// Refs
const containerRef = ref<HTMLElement>()
const imageRef = ref<HTMLImageElement>()
const canvasSize = ref({ width: 0, height: 0 })

// Drag state
const dragState = ref<{
  bubbleId: string | null
  startX: number
  startY: number
  initialX: number
  initialY: number
}>({
  bubbleId: null,
  startX: 0,
  startY: 0,
  initialX: 0,
  initialY: 0
})

// Load editor data
onMounted(async () => {
  await loadEditorData()
})

async function loadEditorData() {
  try {
    loading.value = true
    const response = await $fetch(`/api/session/${props.sessionId}/comic/edit-bubbles`, {
      query: {
        page: props.pageNumber,
        locale: props.locale
      }
    })

    if (response.success) {
      imageUrl.value = response.image
      bubbles.value = response.bubbles
      editableBubbles.value = response.bubbles.map((b: Bubble) => ({
        ...b,
        currentPosition: { ...b.currentPosition },
        isDragging: false
      }))
      facePosition.value = response.facePosition
    }
  } catch (error) {
    console.error('Error loading editor:', error)
    alert('Error al cargar el editor. Por favor, intenta de nuevo.')
  } finally {
    loading.value = false
  }
}

function onImageLoad() {
  if (imageRef.value) {
    canvasSize.value = {
      width: imageRef.value.naturalWidth,
      height: imageRef.value.naturalHeight
    }
  }
}

// Canvas style
const canvasStyle = computed(() => ({
  aspectRatio: canvasSize.value.width / canvasSize.value.height || 3/4
}))

// Bubble styling
function getBubbleStyle(bubble: Bubble) {
  const sizeMultiplier = bubble.size === 'small' ? 0.8 : bubble.size === 'large' ? 1.2 : 1
  const baseWidth = 180 * sizeMultiplier
  
  return {
    left: `${bubble.currentPosition.x * 100}%`,
    top: `${bubble.currentPosition.y * 100}%`,
    width: `${baseWidth}px`,
    transform: 'translate(-50%, -50%)',
    zIndex: selectedBubble.value === bubble.id ? 10 : 1
  }
}

// Face indicator style
function getFaceIndicatorStyle() {
  if (!facePosition.value) return {}
  
  const radius = 18 // Protection radius in %
  return {
    left: `${facePosition.value.x * 100}%`,
    top: `${facePosition.value.y * 100}%`,
    width: `${radius * 2}%`,
    height: `${radius * 2 * 0.75}%`, // Aspect ratio adjustment
    transform: 'translate(-50%, -50%)'
  }
}

// Drag handlers
function startDrag(event: MouseEvent | TouchEvent, bubble: Bubble) {
  event.preventDefault()
  event.stopPropagation()
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  dragState.value = {
    bubbleId: bubble.id,
    startX: clientX,
    startY: clientY,
    initialX: bubble.currentPosition.x,
    initialY: bubble.currentPosition.y
  }
  
  bubble.isDragging = true
  selectedBubble.value = bubble.id
  
  // Add global listeners
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)
}

function onDrag(event: MouseEvent | TouchEvent) {
  if (!dragState.value.bubbleId || !containerRef.value) return
  
  event.preventDefault()
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  const rect = containerRef.value.getBoundingClientRect()
  const deltaX = (clientX - dragState.value.startX) / rect.width
  const deltaY = (clientY - dragState.value.startY) / rect.height
  
  const bubble = editableBubbles.value.find(b => b.id === dragState.value.bubbleId)
  if (bubble) {
    // Constrain to canvas bounds (0-1)
    bubble.currentPosition.x = Math.max(0.05, Math.min(0.95, dragState.value.initialX + deltaX))
    bubble.currentPosition.y = Math.max(0.05, Math.min(0.95, dragState.value.initialY + deltaY))
    hasChanges.value = true
  }
}

function stopDrag() {
  const bubble = editableBubbles.value.find(b => b.id === dragState.value.bubbleId)
  if (bubble) {
    bubble.isDragging = false
  }
  
  dragState.value.bubbleId = null
  
  // Remove global listeners
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

// Selection
function selectBubble(id: string) {
  selectedBubble.value = id
}

// Reset positions
function resetPositions() {
  editableBubbles.value.forEach((bubble, index) => {
    const original = bubbles.value[index]
    if (original) {
      bubble.currentPosition = { ...original.originalPosition }
    }
  })
  hasChanges.value = false
}

// Save positions
async function savePositions() {
  try {
    saving.value = true
    
    const response = await $fetch(`/api/session/${props.sessionId}/comic/edit-bubbles`, {
      method: 'POST',
      body: {
        pageNumber: props.pageNumber,
        bubbles: editableBubbles.value.map(b => ({
          type: b.type,
          text: b.text,
          position: b.currentPosition,
          tailDirection: b.tailDirection,
          size: b.size
        })),
        locale: props.locale
      }
    })

    if (response.success) {
      showSuccess.value = true
      hasChanges.value = false
      emit('saved', response.customPath)
      
      setTimeout(() => {
        showSuccess.value = false
      }, 3000)
    }
  } catch (error) {
    console.error('Error saving positions:', error)
    alert('Error al guardar las posiciones. Por favor, intenta de nuevo.')
  } finally {
    saving.value = false
  }
}

// Helpers
function getBubbleTypeLabel(type: string) {
  const labels: Record<string, string> = {
    speech: 'Diálogo',
    thought: 'Pensamiento',
    sfx: 'Efecto'
  }
  return labels[type] || type
}

function truncateText(text: string, maxLength: number) {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// Cleanup
onBeforeUnmount(() => {
  stopDrag()
})
</script>

<style scoped lang="scss">
.bubble-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.editor-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  
  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .subtitle {
    margin: 0.25rem 0 0;
    color: #6b7280;
    font-size: 0.875rem;
  }
}

.editor-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.canvas-wrapper {
  position: relative;
  flex: 1;
  background: #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
  min-height: 400px;
}

.comic-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

// Face indicator
.face-indicator {
  position: absolute;
  pointer-events: none;
  
  .face-circle {
    width: 100%;
    height: 100%;
    border: 2px dashed #ef4444;
    border-radius: 50%;
    opacity: 0.4;
  }
  
  .face-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 10px;
    color: #ef4444;
    background: rgba(255, 255, 255, 0.8);
    padding: 2px 6px;
    border-radius: 4px;
  }
}

// Draggable bubbles
.draggable-bubble {
  position: absolute;
  cursor: grab;
  user-select: none;
  transition: transform 0.1s, box-shadow 0.2s;
  
  &:active, &.dragging {
    cursor: grabbing;
    transform: translate(-50%, -50%) scale(1.05);
    z-index: 100 !important;
  }
  
  &.selected {
    z-index: 10;
    
    .bubble-content {
      box-shadow: 0 0 0 3px #3b82f6, 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
  
  .bubble-content {
    background: white;
    border: 2px solid #000;
    border-radius: 12px;
    padding: 8px 12px;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &.thought .bubble-content {
    border-radius: 50%;
    aspect-ratio: 1;
  }
  
  &.sfx .bubble-content {
    background: transparent;
    border: none;
    box-shadow: none;
  }
  
  .bubble-text {
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    line-height: 1.3;
  }
  
  .bubble-handle {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  &:hover .bubble-handle {
    opacity: 1;
  }
}

// Bubble tail (simplified visual)
.bubble-tail {
  position: absolute;
  width: 0;
  height: 0;
  
  &.bottom-left {
    bottom: -10px;
    left: 20%;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 15px solid #000;
  }
  
  &.bottom-right {
    bottom: -10px;
    right: 20%;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 15px solid #000;
  }
  
  &.top-left {
    top: -10px;
    left: 20%;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 15px solid #000;
  }
  
  &.top-right {
    top: -10px;
    right: 20%;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 15px solid #000;
  }
}

// Editor controls
.editor-controls {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  @media (min-width: 768px) {
    width: 280px;
  }
}

.bubble-list {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  
  h4 {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }
}

.bubble-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover, &.active {
    background: #e5e7eb;
  }
  
  .bubble-type-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    
    &.speech {
      background: #dbeafe;
      color: #1e40af;
    }
    
    &.thought {
      background: #fce7f3;
      color: #9d174d;
    }
    
    &.sfx {
      background: #fef3c7;
      color: #92400e;
    }
  }
  
  .bubble-preview {
    font-size: 0.875rem;
    color: #4b5563;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: auto;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.btn-primary {
    background: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
  }
  
  &.btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover:not(:disabled) {
      background: #e5e7eb;
    }
  }
}

.success-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #10b981;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.spin {
  animation: spin 1s linear infinite;
}
</style>
