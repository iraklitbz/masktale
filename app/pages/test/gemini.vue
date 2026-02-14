<script setup lang="ts">
const generating = ref(false)
const resultImage = ref('')
const resultTiming = ref<Record<string, string>>({})
const resultCharacter = ref('')
const error = ref('')

// Photo
const photoPreview = ref('')
const photoBase64 = ref('')
const photoInput = ref<HTMLInputElement>()

// Engine: 'gemini' or 'ipadapter'
const engine = ref<'gemini' | 'ipadapter'>('gemini')

// Model (for Gemini)
const model = ref('gemini-3-pro-image-preview')
const aspectRatio = ref<'3:4' | '4:3' | '1:1' | '16:9'>('3:4')

// Pipeline toggles (for Gemini)
const analyzeCharacter = ref(true)
const faceSwap = ref(false)
const faceRestore = ref(false)
const faceSwapModel = ref('cdingram/face-swap')

// Restoration settings
const restoreModel = ref<'codeformer' | 'gfpgan'>('codeformer')
const codeformerFidelity = ref(0.5)

// IP-Adapter settings
const ipStrength = ref(0.7)
const ipSteps = ref(30)

// Prompt presets
const presets = {
  'ilustrado-sin-swap': {
    name: 'Ilustrado puro (sin face-swap)',
    faceSwap: false,
    prompt: `You are an expert children's book illustrator. Create a beautiful, magical Disney-Pixar style illustration for a classic fairy tale: Little Red Riding Hood.

SCENE: A young child is the MAIN CHARACTER and CENTER of the image. The child stands at the front door of a cozy cottage kitchen, happily holding a wicker basket with a red checkered cloth. The child wears a bright red hooded cape over a white cream dress and looks excited to begin her adventure. The mother is barely visible — only her hand or arm at the edge of the frame handing the basket. The child takes up most of the composition.

ENVIRONMENT: Charming rustic cottage interior with wooden furniture, flowers on the windowsill, copper pots, hanging herbs, and a stone fireplace. The front door is open showing a beautiful green garden path with trees beyond. Morning sunlight (around 9 AM) floods through the door and windows with warm golden light.

STYLE: Semi-realistic Pixar Disney digital painting, Tangled and Brave aesthetic, warm cinematic lighting, vibrant saturated colors, painterly backgrounds, magical storybook atmosphere.

CHILD: The child from the reference photo. Wearing a bright red hooded cape (hood down around shoulders) over a white/cream dress. Hair visible and flowing naturally. Holding the wicker basket. Expression of happy excitement and eagerness, thrilled to be given a grown-up responsibility.

EYE DETAIL:
- Eyes should have realistic human proportions — not oversized cartoon eyes
- Clear iris with natural color, well-defined round pupils
- Clean white sclera, natural eyelids and lashes
- Both eyes symmetrical, same size, looking in the same direction

IMPORTANT:
- The child's face should clearly resemble the reference photo
- Style should be illustrated/painted, NOT photorealistic
- NO text, NO speech bubbles, NO words anywhere
- Warm, cozy, safe cottage atmosphere with morning golden light
- The RED CAPE is the most vibrant color element in the scene`,
  },
  'hibrido-con-swap': {
    name: 'Cara realista + entorno ilustrado (para face-swap)',
    faceSwap: true,
    prompt: `You are an expert children's book illustrator. Create an illustration for Little Red Riding Hood where the CHILD'S FACE is semi-realistic (like Pixar's most realistic rendering in Coco/Encanto) while the ENVIRONMENT is painterly and illustrated.

SCENE: A young child is the MAIN CHARACTER and CENTER of the image. The child stands at the front door of a cozy cottage kitchen, happily holding a wicker basket with a red checkered cloth. The child wears a bright red hooded cape over a white cream dress and looks excited to begin her adventure. The mother is barely visible — only her hand or arm at the edge of the frame.

ENVIRONMENT: Charming rustic cottage interior — painterly illustrated style. Wooden furniture, flowers, copper pots, stone fireplace. Open door showing garden. Morning golden light.

STYLE: HYBRID — the child's face should be rendered with HIGH REALISM (smooth skin texture, realistic eye detail, natural lighting on face) while the body, clothing, and environment use a painterly Disney-Pixar illustrated style.

CHILD: The child from the reference photo. The FACE must be rendered with near-photographic quality — real skin texture, accurate eye color and shape, natural hair texture. Wearing a bright red hooded cape over white dress. Expression of happy excitement.

FACE RENDERING (CRITICAL):
- Render the child's face with realistic skin, real eye detail, natural lip color
- The face should look like a high-quality Pixar render, NOT flat cartoon
- Smooth transition from realistic face to illustrated body/clothing
- This makes the face compatible with post-processing

EYE RENDERING (VERY IMPORTANT - avoid artifacts):
- Eyes must be REALISTIC HUMAN proportions — NOT oversized anime/cartoon eyes
- Render clear, well-defined iris with natural color matching the reference photo
- Pupils must be round, centered, and properly sized (not too large, not too small)
- White sclera should be clean with subtle natural shading, no spots or discoloration
- Eyelids and eyelashes rendered with realistic detail
- Both eyes must be symmetrical, same size, looking in the same direction
- Natural eye reflections (single small catchlight per eye)
- NO heavy dark circles, NO unnatural shadows around the eye area
- Eye area skin should be smooth and well-lit, matching the rest of the face

IMPORTANT:
- NO text, NO speech bubbles, NO words anywhere
- Face = semi-realistic, Environment = illustrated
- The RED CAPE is the most vibrant color element`,
  },
  'ipadapter': {
    name: 'IP-Adapter (sin Gemini, ~$0.01)',
    faceSwap: false,
    engine: 'ipadapter' as const,
    prompt: `A young child wearing a bright red hooded cape over a white dress, standing at the front door of a cozy fairy tale cottage kitchen, happily holding a wicker basket. Disney Pixar style illustration, warm morning golden light, charming storybook atmosphere, vibrant colors, magical. The child is the main character in the center of the image.`,
  },
  'dragon': {
    name: 'Dragón (prompt original)',
    faceSwap: false,
    prompt: `You are an expert children's book illustrator. Create a beautiful, magical Disney-Pixar style illustration.

SCENE: A child riding on the back of a friendly, large emerald-green dragon soaring through a sunset sky. The dragon has big kind eyes, small wings that shimmer, and a long curving tail. The child sits on the dragon's back holding onto its neck, laughing with joy and wonder.

ENVIRONMENT: Epic sunset sky with warm orange, pink and purple clouds. Below them a fairy tale landscape with rolling green hills, a sparkling river, and a small medieval village with towers. Golden sunlight bathes everything.

STYLE: Semi-realistic Pixar Disney digital painting, How to Train Your Dragon aesthetic, warm cinematic lighting, vibrant saturated colors, painterly backgrounds, magical atmosphere.

CHILD: The child from the reference photo. Wearing casual summer clothes (bright t-shirt and shorts). Hair flowing in the wind. Expression of pure joy and excitement.

IMPORTANT:
- The child's face should clearly resemble the reference photo
- Style should be illustrated/painted, NOT photorealistic
- NO text, NO speech bubbles, NO words anywhere
- Warm, magical, child-friendly atmosphere`,
  },
}

const activePreset = ref<string>('ilustrado-sin-swap')
const prompt = ref(presets['ilustrado-sin-swap'].prompt)

function applyPreset(key: string) {
  activePreset.value = key
  const preset = presets[key as keyof typeof presets]
  prompt.value = preset.prompt
  faceSwap.value = preset.faceSwap
  faceRestore.value = preset.faceSwap
  engine.value = ('engine' in preset ? preset.engine : 'gemini') as 'gemini' | 'ipadapter'
}

const models = [
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (~$0.13)' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image (gratis)' },
]

function onPhotoChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    photoPreview.value = dataUrl
    photoBase64.value = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  }
  reader.readAsDataURL(file)
}

async function generate() {
  if (!photoBase64.value) {
    error.value = 'Sube una foto primero'
    return
  }
  generating.value = true
  error.value = ''
  resultImage.value = ''
  resultCharacter.value = ''

  try {
    if (engine.value === 'ipadapter') {
      // IP-Adapter: single step, no Gemini
      const response = await $fetch('/api/test/generate-ipadapter', {
        method: 'POST',
        body: {
          facePhoto: photoBase64.value,
          prompt: prompt.value,
          strength: ipStrength.value,
          steps: ipSteps.value,
        },
        timeout: 300000,
      })
      resultImage.value = response.imageData
      resultTiming.value = response.timing
      resultCharacter.value = ''
    } else {
      // Gemini pipeline
      const response = await $fetch('/api/test/generate-gemini', {
        method: 'POST',
        body: {
          facePhoto: photoBase64.value,
          prompt: prompt.value,
          model: model.value,
          aspectRatio: aspectRatio.value,
          analyzeCharacter: analyzeCharacter.value,
          faceSwap: faceSwap.value,
          faceSwapModel: faceSwapModel.value,
          faceRestore: faceRestore.value,
          restoreModel: restoreModel.value,
          codeformerFidelity: codeformerFidelity.value,
        },
        timeout: 300000,
      })
      resultImage.value = response.imageData
      resultTiming.value = response.timing
      resultCharacter.value = response.characterDescription || ''
    }
  } catch (e: any) {
    error.value = e.data?.statusMessage || e.message || 'Error al generar'
    console.error('Generate error:', e)
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8">
    <div class="mx-auto max-w-7xl">
      <h1 class="text-2xl font-bold mb-1">Gemini + Face-Swap Tester</h1>
      <p class="text-sm text-gray-400 mb-6">Prueba Gemini con/sin face-swap. Sin sesiones, sin Strapi.</p>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- LEFT: Controls -->
        <div class="space-y-4">
          <!-- Photo -->
          <div class="rounded-xl bg-gray-900 p-4">
            <h3 class="text-sm font-semibold text-gray-300 mb-3">Foto de referencia</h3>
            <input ref="photoInput" type="file" accept="image/*" class="hidden" @change="onPhotoChange">
            <div
              v-if="!photoPreview"
              class="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-700 py-10 hover:border-purple-500 transition-colors"
              @click="photoInput?.click()"
            >
              <span class="text-gray-500">Click para subir foto</span>
            </div>
            <div v-else class="flex items-start gap-3">
              <img :src="photoPreview" class="h-24 w-24 rounded-lg object-cover border border-gray-700">
              <button class="text-xs text-red-400 hover:text-red-300" @click="photoPreview = ''; photoBase64 = ''">Eliminar</button>
            </div>
          </div>

          <!-- Presets -->
          <div class="rounded-xl bg-gray-900 p-4">
            <h3 class="text-sm font-semibold text-gray-300 mb-3">Presets</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(preset, key) in presets"
                :key="key"
                class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                :class="activePreset === key ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
                @click="applyPreset(key as string)"
              >
                {{ preset.name }}
              </button>
            </div>
          </div>

          <!-- Engine indicator -->
          <div class="rounded-xl p-3 text-center text-xs font-semibold" :class="engine === 'ipadapter' ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-blue-900/50 text-blue-300 border border-blue-700'">
            {{ engine === 'ipadapter' ? 'IP-Adapter Face Inpaint (Replicate ~$0.01)' : 'Gemini + Pipeline' }}
          </div>

          <!-- Model & Settings (Gemini only) -->
          <div v-if="engine === 'gemini'" class="rounded-xl bg-gray-900 p-4 space-y-3">
            <h3 class="text-sm font-semibold text-gray-300">Configuración Gemini</h3>

            <div>
              <label class="block text-xs text-gray-400 mb-1">Modelo Gemini</label>
              <select v-model="model" class="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-200 focus:border-purple-500 focus:outline-none">
                <option v-for="m in models" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs text-gray-400 mb-1">Aspect Ratio</label>
              <div class="flex gap-2">
                <button
                  v-for="ar in ['3:4', '4:3', '1:1', '16:9'] as const"
                  :key="ar"
                  class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  :class="aspectRatio === ar ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
                  @click="aspectRatio = ar"
                >
                  {{ ar }}
                </button>
              </div>
            </div>
          </div>

          <!-- Pipeline (Gemini only) -->
          <div v-if="engine === 'gemini'" class="rounded-xl bg-gray-900 p-4 space-y-3">
            <h3 class="text-sm font-semibold text-gray-300">Pipeline</h3>

            <label class="flex items-center gap-3 cursor-pointer">
              <input v-model="analyzeCharacter" type="checkbox" class="rounded accent-purple-500">
              <div>
                <span class="text-sm text-gray-200">Analizar personaje</span>
                <p class="text-[10px] text-gray-500">Gemini describe la cara antes de generar</p>
              </div>
            </label>

            <label class="flex items-center gap-3 cursor-pointer">
              <input v-model="faceSwap" type="checkbox" class="rounded accent-purple-500">
              <div>
                <span class="text-sm text-gray-200">Face-swap (Replicate)</span>
                <p class="text-[10px] text-gray-500">Pega la cara real sobre la ilustración</p>
              </div>
            </label>

            <label class="flex items-center gap-3 cursor-pointer" :class="{ 'opacity-40': !faceSwap }">
              <input v-model="faceRestore" type="checkbox" class="rounded accent-purple-500" :disabled="!faceSwap">
              <div>
                <span class="text-sm text-gray-200">Face Restore</span>
                <p class="text-[10px] text-gray-500">Mejora la cara después del swap</p>
              </div>
            </label>

            <!-- Restore model selector -->
            <div v-if="faceRestore && faceSwap" class="ml-8 space-y-2 border-l-2 border-gray-700 pl-3">
              <div>
                <label class="block text-xs text-gray-400 mb-1">Modelo de restauración</label>
                <div class="flex gap-2">
                  <button
                    class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    :class="restoreModel === 'codeformer' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
                    @click="restoreModel = 'codeformer'"
                  >
                    CodeFormer (recomendado)
                  </button>
                  <button
                    class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    :class="restoreModel === 'gfpgan' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
                    @click="restoreModel = 'gfpgan'"
                  >
                    GFPGAN
                  </button>
                </div>
              </div>

              <div v-if="restoreModel === 'codeformer'">
                <label class="block text-xs text-gray-400 mb-1">
                  Fidelity: {{ codeformerFidelity.toFixed(1) }}
                  <span class="text-gray-600 ml-1">(0 = max calidad, 1 = max fidelidad)</span>
                </label>
                <input v-model.number="codeformerFidelity" type="range" min="0" max="1" step="0.1" class="w-full accent-emerald-500">
                <div class="flex justify-between text-[10px] text-gray-600">
                  <span>Corrige ojos/artefactos</span>
                  <span>Preserva original</span>
                </div>
              </div>
            </div>
          </div>

          <!-- IP-Adapter Settings -->
          <div v-if="engine === 'ipadapter'" class="rounded-xl bg-gray-900 p-4 space-y-3">
            <h3 class="text-sm font-semibold text-gray-300">IP-Adapter Settings</h3>

            <p class="text-[10px] text-gray-400">Genera la ilustracion directamente desde la foto. Sin Gemini, sin face-swap. Un solo paso.</p>

            <div>
              <label class="block text-xs text-gray-400 mb-1">Steps ({{ ipSteps }})</label>
              <input v-model.number="ipSteps" type="range" min="10" max="50" step="5" class="w-full accent-green-500">
              <p class="text-[10px] text-gray-500">Mas steps = mejor calidad, mas lento</p>
            </div>
          </div>

          <!-- Prompt -->
          <div class="rounded-xl bg-gray-900 p-4">
            <h3 class="text-sm font-semibold text-gray-300 mb-2">Prompt</h3>
            <textarea v-model="prompt" rows="14" class="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-xs text-gray-200 font-mono leading-relaxed focus:border-purple-500 focus:outline-none"></textarea>
          </div>

          <!-- Generate -->
          <button
            class="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="generating || !photoBase64"
            @click="generate"
          >
            {{ generating ? 'Generando...' : 'Generar con Gemini' }}
          </button>

          <div v-if="error" class="rounded-lg bg-red-900/50 border border-red-700 p-3 text-sm text-red-300">
            {{ error }}
          </div>
        </div>

        <!-- RIGHT: Result -->
        <div class="space-y-4">
          <div class="rounded-xl bg-gray-900 p-4 min-h-[500px] flex items-center justify-center">
            <div v-if="generating" class="text-center">
              <div class="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500 mb-4"></div>
              <p class="text-gray-400 text-sm">Generando con Gemini...</p>
              <p class="text-gray-600 text-xs mt-1">
                {{ faceSwap ? 'Gemini → Face-swap → GFPGAN (30-60s)' : 'Solo Gemini (15-30s)' }}
              </p>
            </div>

            <img
              v-else-if="resultImage"
              :src="resultImage"
              alt="Generated test image"
              class="max-h-[700px] rounded-lg shadow-2xl"
            >

            <div v-else class="text-center text-gray-600">
              <p class="text-lg mb-1">Sin resultado aún</p>
              <p class="text-xs">Sube foto, ajusta el prompt y dale a generar</p>
            </div>
          </div>

          <!-- Timing -->
          <div v-if="Object.keys(resultTiming).length > 0" class="rounded-xl bg-gray-900 p-4">
            <h3 class="text-sm font-semibold text-gray-300 mb-2">Tiempos</h3>
            <div class="grid grid-cols-2 gap-2">
              <div v-for="(time, step) in resultTiming" :key="step" class="flex justify-between text-xs">
                <span class="text-gray-400 capitalize">{{ step }}</span>
                <span class="font-mono" :class="time === 'skipped' ? 'text-gray-600' : 'text-green-400'">{{ time }}</span>
              </div>
            </div>
          </div>

          <!-- Character description -->
          <details v-if="resultCharacter" class="rounded-xl bg-gray-900 p-4">
            <summary class="text-sm font-semibold text-gray-300 cursor-pointer">Descripción del personaje</summary>
            <pre class="mt-2 whitespace-pre-wrap text-xs text-gray-400 bg-gray-800 p-3 rounded-lg">{{ resultCharacter }}</pre>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>
