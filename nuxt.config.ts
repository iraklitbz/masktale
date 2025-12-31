import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: {enabled: true},
  modules: [
    'nuxt-svgo',
    '@vueuse/nuxt',
    '@nuxtjs/strapi',
  ],
  css: ['./app/assets/css/main.css'],
  strapi: {
    url: process.env.STRAPI_URL || 'https://cms.iraklitbz.dev',
    prefix: '/api',
    version: 'v5',
    cookie: {
      path: '/',
      maxAge: 14 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
    optimizeDeps: {
      include: ['qs']
    }
  },
  svgo: {
    global: false,
    defaultImport: 'component',
    customComponent: 'Icon',
  },
  runtimeConfig: {
    geminiApiKey: '',
    // Stripe (server-side only)
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    // Strapi API Token (server-side only)
    strapiApiToken: '',
    public: {
      // Stripe Public Key (client-side)
      stripePublicKey: '',
      // Strapi URL (client + server)
      strapiUrl: '',
    }
  },
})
