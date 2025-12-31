import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

/**
 * Obtiene una instancia única del cliente de Stripe
 * @returns Instancia configurada de Stripe
 */
export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const config = useRuntimeConfig()
    const secretKey = config.stripeSecretKey

    if (!secretKey) {
      throw new Error('NUXT_STRIPE_SECRET_KEY no está configurada en las variables de entorno')
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia', // Última versión estable
      typescript: true,
    })
  }

  return stripeInstance
}

/**
 * Crea un Payment Intent en Stripe
 * @param amount - Monto en centavos (ej: 2999 para €29.99)
 * @param currency - Código de moneda ISO (default: 'eur')
 * @param metadata - Metadata adicional para el payment intent
 * @returns Payment Intent creado
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'eur',
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient()

  return await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  })
}

/**
 * Obtiene un Payment Intent por su ID
 * @param paymentIntentId - ID del Payment Intent
 * @returns Payment Intent
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient()
  return await stripe.paymentIntents.retrieve(paymentIntentId)
}

/**
 * Verifica la firma de un webhook de Stripe
 * @param payload - Cuerpo de la request (raw)
 * @param signature - Header stripe-signature
 * @returns Evento verificado de Stripe
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const config = useRuntimeConfig()
  const webhookSecret = config.stripeWebhookSecret

  if (!webhookSecret) {
    throw new Error('NUXT_STRIPE_WEBHOOK_SECRET no está configurada en las variables de entorno')
  }

  const stripe = getStripeClient()
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
