import { createPaymentIntent } from '../../utils/stripe'
import { eurosToCents } from '~/config/products'

/**
 * Endpoint para crear un Payment Intent en Stripe
 * POST /api/checkout/create-intent
 */
export default defineEventHandler(async (event) => {
  try {
    // Leer el body
    const body = await readBody(event)
    const { amount, currency = 'eur', metadata } = body

    // Validar amount
    if (!amount || typeof amount !== 'number') {
      throw createError({
        statusCode: 400,
        statusMessage: 'El monto es requerido y debe ser un número',
      })
    }

    if (amount <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El monto debe ser mayor que 0',
      })
    }

    // Validar que el monto no sea excesivo (máximo 10,000 EUR)
    if (amount > 10000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El monto excede el límite máximo permitido',
      })
    }

    // Validar currency
    const validCurrencies = ['eur', 'usd', 'gbp']
    if (!validCurrencies.includes(currency.toLowerCase())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Moneda no soportada',
      })
    }

    // Validar metadata
    if (metadata) {
      if (!metadata.customerEmail || !metadata.customerName) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Información de cliente incompleta',
        })
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(metadata.customerEmail)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Email inválido',
        })
      }
    }

    // Convertir euros a centavos
    const amountInCents = eurosToCents(amount)

    // Validar que la conversión sea válida
    if (amountInCents < 50) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El monto es demasiado pequeño (mínimo 0.50 EUR)',
      })
    }

    // Crear Payment Intent
    const paymentIntent = await createPaymentIntent(
      amountInCents,
      currency,
      metadata
    )

    if (!paymentIntent.client_secret) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No se pudo generar el client secret',
      })
    }

    // Retornar solo el clientSecret (no exponer datos sensibles)
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error: any) {
    console.error('[create-intent] Error:', error)

    // Si ya es un error de H3, re-lanzarlo
    if (error.statusCode) {
      throw error
    }

    // Si es un error de Stripe, mapear a un mensaje amigable
    if (error.type === 'StripeError') {
      throw createError({
        statusCode: 400,
        statusMessage: error.message || 'Error al procesar con Stripe',
      })
    }

    // Error genérico
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al crear Payment Intent',
    })
  }
})
