<script setup lang="ts">
import type { StoryTexts, PageText, StoryTypography } from '~/types/story'
import type { Session, CurrentState } from '~/types/session'

interface Props {
  sessionId: string
  session: Session
  currentState: CurrentState
  storyTexts: StoryTexts
  typography?: StoryTypography
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

// Font loading
const {
  loadTypography,
  getHeadlineStyle,
  getBodyStyle,
  isLoading: fontsLoading,
  isLoaded: fontsLoaded,
} = useStoryFonts()

// Load fonts when component mounts
onMounted(async () => {
  await loadTypography(props.typography)
})

// Get child name
const childName = computed(() => props.session.userPhoto?.childName || 'Protagonista')

// Typography styles
const headlineStyle = computed(() => getHeadlineStyle(props.typography))
const bodyStyle = computed(() => getBodyStyle(props.typography))

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

// Download PDF with high quality for print
const isGeneratingPdf = ref(false)

const downloadPdf = async () => {
  if (isGeneratingPdf.value) return
  
  isGeneratingPdf.value = true
  const toast = useToast()
  toast.info('Generando PDF', 'Preparando libro en alta calidad...')
  
  try {
    const { jsPDF } = await import('jspdf')
    
    // Create high-quality PDF (1000x500mm landscape as original template)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [1000, 500],
    })
    
    const childName = props.session.userPhoto?.childName || 'Protagonista'
    
    // Helper to load image as base64
    const loadImage = async (url: string): Promise<string> => {
      const response = await fetch(url)
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }
    
    // Cover page (left: gradient, right: first image)
    pdf.setFillColor(147, 51, 234)
    pdf.rect(0, 0, 500, 500, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(60)
    pdf.text(props.storyTexts.cover.title, 250, 200, { align: 'center' })
    pdf.setFontSize(30)
    pdf.text(`${props.storyTexts.cover.subtitle} ${childName}`, 250, 280, { align: 'center' })
    pdf.setFontSize(24)
    pdf.text(props.storyTexts.cover.tagline, 250, 340, { align: 'center' })
    
    // Right side - first page image
    try {
      const imgData = await loadImage(getImageUrl(1))
      pdf.addImage(imgData, 'JPEG', 500, 0, 500, 500)
    } catch (e) {
      console.warn('Could not load cover image')
    }
    
    // Story pages
    for (let i = 0; i < props.storyTexts.pages.length; i++) {
      const page = props.storyTexts.pages[i]
      const pageNum = i + 1
      
      pdf.addPage()
      
      // White background
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, 1000, 500, 'F')
      
      // Left side - Image
      try {
        const imgData = await loadImage(getImageUrl(pageNum))
        // Add with proper aspect ratio
        pdf.addImage(imgData, 'JPEG', 30, 30, 440, 440)
      } catch (e) {
        console.warn(`Could not load image for page ${pageNum}`)
      }
      
      // Right side - Text
      pdf.setTextColor(31, 41, 55)
      pdf.setFontSize(32)
      pdf.text(page.title, 520, 80)
      
      pdf.setFontSize(20)
      const text = page.text?.replace(/\{childName\}/g, childName) || ''
      const splitText = pdf.splitTextToSize(text, 440)
      pdf.text(splitText, 520, 130)
      
      // Page number
      pdf.setFontSize(16)
      pdf.text(`${pageNum}`, 950, 470)
    }
    
    // Back cover
    pdf.addPage()
    pdf.setFillColor(147, 51, 234)
    pdf.rect(0, 0, 1000, 500, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(32)
    const message = props.storyTexts.backCover.message.replace(/\{childName\}/g, childName)
    const splitMessage = pdf.splitTextToSize(message, 900)
    pdf.text(splitMessage, 500, 250, { align: 'center' })
    pdf.setFontSize(24)
    pdf.text(props.storyTexts.backCover.footer, 500, 400, { align: 'center' })
    
    // Save
    const safeName = childName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '').replace(/\s+/g, '_')
    pdf.save(`${safeName}_Libro.pdf`)
    
    toast.success('PDF generado', 'Libro descargado en alta calidad')
  } catch (error: any) {
    console.error('[BookPreview] PDF error:', error)
    toast.error('Error', 'No se pudo generar el PDF')
  } finally {
    isGeneratingPdf.value = false
  }
}
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
              <h1
                class="text-xl md:text-3xl lg:text-5xl mb-2 drop-shadow-lg"
                :style="headlineStyle"
              >
                {{ storyTexts.cover.title }}
              </h1>
              <p
                class="text-sm md:text-base lg:text-xl opacity-90 italic"
                :style="bodyStyle"
              >
                {{ storyTexts.cover.tagline }}
              </p>
              <div class="w-16 h-1 bg-white/50 mx-auto my-4 md:my-6 rounded" />
              <p
                class="text-sm md:text-base opacity-80 mb-2"
                :style="bodyStyle"
              >
                {{ storyTexts.cover.subtitle }}
              </p>
              <h2
                class="text-xl md:text-2xl lg:text-4xl mt-2"
                :style="headlineStyle"
              >
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

        <!-- STORY SPREADS (Immersive design) -->
        <template v-else-if="currentSpread > 0 && currentSpread < totalSpreads - 1">
          <div class="relative w-full h-full">
            <!-- Background image -->
            <div class="absolute top-0 right-0 w-[60%] h-full">
              <img
                v-if="currentPageText && currentState.selectedVersions[currentPageText.pageNumber]"
                :src="getImageUrl(currentPageText.pageNumber)"
                :alt="`Ilustracion pagina ${currentPageText.pageNumber}`"
                class="w-full h-full object-cover"
              >
              <div v-else class="w-full h-full bg-gray-200" />
            </div>
            <!-- Text overlay with gradient -->
            <div class="absolute top-0 left-0 w-[55%] h-full flex items-center justify-start pl-6 md:pl-10 bg-gradient-to-r from-white from-60% via-white/95 via-75% to-transparent">
              <div class="max-w-[85%] text-left">
                <h2
                  class="text-lg md:text-xl lg:text-3xl text-purple-600 mb-3 md:mb-4"
                  :style="headlineStyle"
                >
                  {{ currentPageText?.title }}
                </h2>
                <div class="w-12 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 mb-4 md:mb-6 rounded" />
                <p
                  class="text-sm md:text-base lg:text-lg leading-relaxed text-gray-700"
                  :style="bodyStyle"
                >
                  {{ interpolateText(currentPageText?.text || '') }}
                </p>
              </div>
            </div>
            <!-- Page numbers -->
            <span class="absolute bottom-4 left-[25%] -translate-x-1/2 text-sm text-gray-400">
              {{ (currentSpread * 2) - 1 }}
            </span>
            <span class="absolute bottom-4 left-[75%] -translate-x-1/2 text-sm text-white/70 drop-shadow">
              {{ currentSpread * 2 }}
            </span>
          </div>
        </template>

        <!-- BACK COVER -->
        <template v-else>
          <div class="flex-1 relative flex items-center justify-center p-4 md:p-8 bg-gray-50">
            <div class="text-center max-w-[80%]">
              <p
                class="text-base md:text-lg lg:text-2xl leading-relaxed text-gray-600 italic"
                :style="bodyStyle"
              >
                {{ interpolateText(storyTexts.backCover.message) }}
              </p>
              <div class="w-10 h-0.5 bg-purple-600 mx-auto my-6 md:my-8 rounded" />
              <h2
                class="text-2xl md:text-3xl lg:text-4xl text-purple-600"
                :style="headlineStyle"
              >
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

      <!-- Download PDF button -->
      <button
        class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isGeneratingPdf"
        @click="downloadPdf"
      >
        <svg v-if="isGeneratingPdf" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {{ isGeneratingPdf ? 'Generando...' : 'Descargar PDF (Alta Calidad)' }}
      </button>

      <!-- Keyboard hint -->
      <p class="text-white/40 text-xs hidden md:block">
        Usa las flechas del teclado para navegar
      </p>
    </div>
  </div>
</template>
