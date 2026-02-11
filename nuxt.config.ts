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
    },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'THIS_IS_UNDEFINED') return
          warn(warning)
        }
      }
    }
  },
  svgo: {
    global: false,
    defaultImport: 'component',
    customComponent: 'Icon',
  },
  nitro: {},
  runtimeConfig: {
    geminiApiKey: '',
    // Stripe (server-side only)
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    // Strapi API Token (server-side only)
    strapiApiToken: '',
    // Resend API Key (server-side only)
    resendApiKey: '',
    // Replicate API Token (server-side face-swap)
    replicateApiToken: '',
    public: {
      // Stripe Public Key (client-side)
      stripePublicKey: '',
      // Strapi URL (client + server)
      strapiUrl: '',
      // Email From (client + server)
      emailFrom: 'Mask Stories <onboarding@resend.dev>',
    }
  },
})
