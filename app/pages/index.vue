<script setup lang="ts">
const prompt = ref('')
const imageUrl = ref(null)
const loading = ref(false)
const error = ref(null)
const uploadedImage = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function removeImage() {
  uploadedImage.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function generateImage() {
  if (!uploadedImage.value) {
    error.value = 'Por favor sube una foto primero'
    return
  }

  loading.value = true
  error.value = null
  try {
    const response = await $fetch('/api/generate-image', {
      method: 'POST',
      body: {
        prompt: prompt.value,
        userImage: uploadedImage.value,
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

    <!-- Upload de imagen -->
    <div class="mb-8 rounded-lg border-2 border-dashed border-gray-300 p-6">
      <h2 class="mb-4 text-lg font-semibold">
        1. Sube una foto de la persona
      </h2>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileUpload"
      >

      <div v-if="!uploadedImage">
        <button
          class="w-full rounded-lg bg-gray-100 px-6 py-8 text-gray-600 transition hover:bg-gray-200"
          @click="fileInput?.click()"
        >
          <div class="text-4xl">
            📸
          </div>
          <div class="mt-2">
            Haz clic para subir una foto
          </div>
        </button>
      </div>

      <div v-else class="relative">
        <img :src="uploadedImage" alt="Foto subida" class="mx-auto max-h-64 rounded-lg">
        <button
          class="absolute right-0 top-0 rounded-full bg-red-500 p-2 text-white hover:bg-red-600"
          @click="removeImage"
        >
          ✕
        </button>
      </div>
    </div>

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
      :disabled="loading || !uploadedImage"
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
