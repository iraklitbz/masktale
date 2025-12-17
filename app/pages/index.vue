<script setup lang="ts">
const prompt = ref('')
const imageUrl = ref(null)
const loading = ref(false)
const error = ref(null)
const uploadedImages = ref<string[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (files && files.length > 0) {
    // Limitar a 3 imágenes
    const filesToProcess = Array.from(files).slice(0, 3 - uploadedImages.value.length)

    filesToProcess.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (uploadedImages.value.length < 3) {
          uploadedImages.value.push(e.target?.result as string)
        }
      }
      reader.readAsDataURL(file)
    })
  }
}

function removeImage(index: number) {
  uploadedImages.value.splice(index, 1)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function generateImage() {
  if (uploadedImages.value.length === 0) {
    error.value = 'Por favor sube al menos una foto'
    return
  }

  loading.value = true
  error.value = null
  try {
    const response = await $fetch('/api/generate-image', {
      method: 'POST',
      body: {
        prompt: prompt.value,
        userImages: uploadedImages.value,
      },
    })
    imageUrl.value = response.image
  } catch (e: any) {
    console.error('Error capturado:', e.data?.statusMessage || e.message)
    error.value = e.data?.statusMessage || e.message || 'Error generando la imagen'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl p-8">
    <h1 class="mb-8 text-center text-3xl font-bold">
      Generador con Estilo Base
    </h1>

    <!-- Upload de imágenes -->
    <ClientOnly>
      <div class="mb-8 rounded-lg border-2 border-dashed border-gray-300 p-6">
        <h2 class="mb-4 text-lg font-semibold">
          1. Sube fotos de la persona (1-3 fotos para mejor parecido)
        </h2>

        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="handleFileUpload"
        >

        <!-- Mostrar imágenes subidas -->
        <div v-if="uploadedImages.length > 0" class="mb-4 grid grid-cols-3 gap-4">
          <div
            v-for="(img, index) in uploadedImages"
            :key="index"
            class="relative"
          >
            <img :src="img" alt="Foto subida" class="h-32 w-full rounded-lg object-cover">
            <button
              class="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-sm text-white hover:bg-red-600"
              @click="removeImage(index)"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Botón para agregar más -->
        <button
          v-if="uploadedImages.length < 3"
          class="w-full rounded-lg bg-gray-100 px-6 py-4 text-gray-600 transition hover:bg-gray-200"
          @click="fileInput?.click()"
        >
          <div class="text-2xl">
            📸
          </div>
          <div class="mt-2 text-sm">
            {{ uploadedImages.length === 0 ? 'Haz clic para subir fotos' : `Agregar más (${uploadedImages.length}/3)` }}
          </div>
        </button>
      </div>
    </ClientOnly>

    <!-- Prompt opcional -->
    <div class="mb-8">
      <h2 class="mb-4 text-lg font-semibold">
        2. Personaliza (opcional)
      </h2>
      <input
        v-model="prompt"
        placeholder="Ej: estilo profesional, fondo azul..."
        class="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
      >
    </div>

    <!-- Botón generar -->
    <button
      :disabled="loading || uploadedImages.length === 0"
      class="w-full rounded-lg bg-blue-500 px-8 py-3 text-lg font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
      @click="generateImage"
    >
      {{ loading ? 'Generando...' : '3. Generar Imagen' }}
    </button>

    <!-- Error -->
    <div v-if="error" class="mt-4 rounded-lg bg-red-50 p-4 text-red-600">
      {{ error }}
    </div>

    <!-- Resultado -->
    <div v-if="imageUrl" class="mt-8 rounded-lg bg-gray-100 p-8 text-center">
      <h3 class="mb-4 text-lg font-semibold">
        Resultado:
      </h3>
      <img :src="imageUrl" alt="Imagen generada" class="mx-auto max-w-full rounded-lg shadow-lg">
    </div>
  </div>
</template>
