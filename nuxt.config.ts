import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    'nuxt-svgo',
  ],
  css: ['./app/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  svgo: {
    global: false,
    defaultImport: 'component',
    customComponent: 'Icon',
  },
  runtimeConfig: {
    geminiApiKey: '',
  },
})
