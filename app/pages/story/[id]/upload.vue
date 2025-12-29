<script setup lang="ts">
import { useDropZone, useFileDialog } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const storyId = route.params.id as string

// Toast notifications
const toast = useToast()

// Session management
const { session, loadSession } = useSession()

// Upload state
const uploadedFiles = ref<File[]>([])
const previews = ref<string[]>([])
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref<string | null>(null)

const MAX_FILES = 3
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// Load session on mount
onMounted(async () => {
  const sessionId = localStorage.getItem('mask-session-id')
  if (sessionId) {
    await loadSession(sessionId)
  } else {
    // No session, redirect to home
    router.push('/')
  }
})

// Drop zone
const dropZoneRef = ref<HTMLDivElement>()
const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop,
  dataTypes: ALLOWED_TYPES,
})

// File dialog
const { open: openFileDialog, onChange } = useFileDialog({
  accept: ALLOWED_TYPES.join(','),
  multiple: true,
})

onChange((files) => {
  if (files) {
    handleFiles(Array.from(files))
  }
})

function onDrop(files: File[] | null) {
  if (files) {
    handleFiles(files)
  }
}

function handleFiles(files: File[]) {
  error.value = null

  // Check total count
  const totalFiles = uploadedFiles.value.length + files.length
  if (totalFiles > MAX_FILES) {
    error.value = `Máximo ${MAX_FILES} fotos permitidas`
    toast.warning('Límite alcanzado', `Solo puedes subir hasta ${MAX_FILES} fotos`)
    return
  }

  // Validate each file
  for (const file of files) {
    // Check type
    if (!ALLOWED_TYPES.includes(file.type)) {
      error.value = `Formato no válido: ${file.name}. Solo JPEG, PNG, WebP`
      toast.error('Formato inválido', `${file.name} no es un formato soportado`)
      return
    }

    // Check size
    if (file.size > MAX_SIZE) {
      error.value = `Archivo muy grande: ${file.name}. Máximo 10MB`
      toast.error('Archivo muy grande', `${file.name} excede el tamaño máximo de 10MB`)
      return
    }
  }

  // Add files
  uploadedFiles.value.push(...files)
  toast.success('Foto agregada', `${files.length} ${files.length === 1 ? 'foto agregada' : 'fotos agregadas'} correctamente`)

  // Generate previews
  files.forEach((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        previews.value.push(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  })
}

function removeFile(index: number) {
  const fileName = uploadedFiles.value[index]?.name
  uploadedFiles.value.splice(index, 1)
  previews.value.splice(index, 1)
  error.value = null
  toast.info('Foto eliminada', fileName || 'Foto removida de la lista')
}

async function uploadPhotos() {
  if (uploadedFiles.value.length === 0) {
    error.value = 'Por favor sube al menos 1 foto'
    toast.warning('Faltan fotos', 'Debes subir al menos 1 foto para continuar')
    return
  }

  if (!session.value) {
    error.value = 'No hay sesión activa'
    toast.error('Error de sesión', 'No hay una sesión activa. Por favor reinicia el proceso')
    return
  }

  uploading.value = true
  uploadProgress.value = 0
  error.value = null

  try {
    // Create FormData
    const formData = new FormData()
    uploadedFiles.value.forEach((file, index) => {
      formData.append(`photo-${index}`, file)
    })

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 200)

    // Upload
    await $fetch(`/api/session/${session.value.id}/upload-photo`, {
      method: 'POST',
      body: formData,
    })

    clearInterval(progressInterval)
    uploadProgress.value = 100

    toast.success('¡Fotos subidas!', `${uploadedFiles.value.length} ${uploadedFiles.value.length === 1 ? 'foto subida' : 'fotos subidas'} exitosamente`)

    // Wait a bit to show 100%
    await new Promise(resolve => setTimeout(resolve, 500))

    // Navigate to generation page
    await navigateTo(`/story/${storyId}/generate`)
  } catch (e: any) {
    error.value = e.data?.statusMessage || e.message || 'Error al subir fotos'
    toast.error('Error al subir', error.value)
    console.error('Upload error:', e)
    uploadProgress.value = 0
  } finally {
    uploading.value = false
  }
}

// Computed
const canUploadMore = computed(() => uploadedFiles.value.length < MAX_FILES)
const canContinue = computed(() => uploadedFiles.value.length > 0 && !uploading.value)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
    <!-- Header -->
    <header class="border-b border-white/50 bg-white/70 backdrop-blur-sm">
      <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div class="flex items-center gap-4">
          <button
            class="rounded-lg p-2 transition-colors hover:bg-gray-100"
            @click="router.push('/')"
          >
            ← Volver
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Sube las fotos
            </h1>
            <p class="text-sm text-gray-600">
              {{ session?.storyId ? 'Paso 2 de 3' : 'Cargando...' }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main -->
    <main class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <!-- Instructions -->
      <div class="mb-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 class="mb-3 text-lg font-semibold text-gray-900">
          📸 ¿Cómo funciona?
        </h2>
        <ul class="space-y-2 text-sm text-gray-600">
          <li class="flex items-start gap-2">
            <span class="text-green-500">✓</span>
            <span>Sube entre 1 y 3 fotos claras de la cara del niño/a</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-green-500">✓</span>
            <span>Mejor resultado con fotos desde diferentes ángulos</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-green-500">✓</span>
            <span>Formatos: JPEG, PNG, WebP (máx. 10MB por foto)</span>
          </li>
        </ul>
      </div>

      <!-- Drop Zone -->
      <div
        v-if="canUploadMore"
        ref="dropZoneRef"
        class="mb-8 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300"
        :class="
          isOverDropZone
            ? 'border-blue-500 bg-blue-50 shadow-lg'
            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
        "
        @click="openFileDialog()"
      >
        <div class="px-6 py-12 text-center">
          <div
            class="mb-4 text-6xl transition-transform duration-300"
            :class="isOverDropZone ? 'scale-110' : ''"
          >
            📤
          </div>
          <h3 class="mb-2 text-xl font-semibold text-gray-900">
            {{ isOverDropZone ? '¡Suelta las fotos aquí!' : 'Arrastra las fotos aquí' }}
          </h3>
          <p class="mb-4 text-sm text-gray-600">
            o haz click para seleccionar
          </p>
          <p class="text-xs text-gray-500">
            {{ uploadedFiles.length }}/{{ MAX_FILES }} fotos subidas
          </p>
        </div>
      </div>

      <!-- Previews -->
      <div v-if="previews.length > 0" class="mb-8">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          Fotos seleccionadas ({{ previews.length }})
        </h3>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(preview, index) in previews"
            :key="index"
            class="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg"
          >
            <img
              :src="preview"
              :alt="`Foto ${index + 1}`"
              class="h-48 w-full object-cover"
            >

            <!-- Overlay on hover -->
            <div
              class="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/50"
            >
              <button
                class="translate-y-10 rounded-full bg-red-500 p-3 text-white opacity-0 shadow-lg transition-all duration-300 hover:bg-red-600 group-hover:translate-y-0 group-hover:opacity-100"
                @click.stop="removeFile(index)"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>

            <!-- File info -->
            <div class="p-3">
              <p class="truncate text-xs font-medium text-gray-900">
                {{ uploadedFiles[index]?.name }}
              </p>
              <p class="text-xs text-gray-500">
                {{ (uploadedFiles[index]?.size / 1024 / 1024).toFixed(2) }} MB
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <Transition name="fade" mode="out-in">
        <div
          v-if="error"
          key="error"
          class="mb-8 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-700"
        >
          <span class="text-2xl">⚠️</span>
          <span class="text-sm">{{ error }}</span>
        </div>
      </Transition>

      <!-- Upload Progress -->
      <Transition name="fade" mode="out-in">
        <div v-if="uploading" key="uploading" class="mb-8 rounded-2xl bg-white p-6 shadow-sm">
        <div class="mb-2 flex items-center justify-between text-sm">
          <span class="font-semibold text-gray-900">Subiendo fotos...</span>
          <span class="text-gray-600">{{ uploadProgress }}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            :style="{ width: `${uploadProgress}%` }"
          />
        </div>
        </div>
      </Transition>

      <!-- Actions -->
      <div class="flex flex-col gap-3 sm:flex-row">
        <button
          v-if="canUploadMore && previews.length > 0"
          class="flex-1 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="uploading"
          @click="openFileDialog()"
        >
          + Añadir más fotos
        </button>

        <button
          class="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canContinue"
          @click="uploadPhotos"
        >
          {{ uploading ? 'Subiendo...' : 'Continuar →' }}
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
* {
  scroll-behavior: smooth;
}

/* Fade transitions */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Enhanced button transitions */
button {
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

/* Image preview hover effect */
.group:hover img {
  transform: scale(1.05);
  transition: transform 0.3s ease;
}
</style>
