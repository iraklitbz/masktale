import { loadStripe, type Stripe } from '@stripe/stripe-js'

/**
 * Plugin de Stripe para el cliente
 * Carga Stripe.js y lo hace disponible globalmente
 */
export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  const stripePublicKey = config.public.stripePublicKey

  if (!stripePublicKey) {
    console.error('NUXT_PUBLIC_STRIPE_PUBLIC_KEY no está configurada')
    return {
      provide: {
        stripe: null,
      },
    }
  }

  try {
    // Cargar Stripe.js
    const stripe = await loadStripe(stripePublicKey)

    if (!stripe) {
      console.error('No se pudo cargar Stripe.js')
      return {
        provide: {
          stripe: null,
        },
      }
    }

    // Hacer Stripe disponible globalmente
    return {
      provide: {
        stripe,
      },
    }
  } catch (error) {
    console.error('Error al cargar Stripe:', error)
    return {
      provide: {
        stripe: null,
      },
    }
  }
})
