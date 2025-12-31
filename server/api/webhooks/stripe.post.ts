/**
 * Endpoint: POST /api/webhooks/stripe
 *
 * Webhook de Stripe para procesar eventos de pago
 *
 * Eventos manejados:
 * - payment_intent.succeeded: Pago exitoso
 * - payment_intent.payment_failed: Pago fallido
 * - payment_intent.processing: Pago en procesamiento
 * - payment_intent.canceled: Pago cancelado
 *
 * IMPORTANTE: Este endpoint debe estar configurado en Stripe Dashboard
 * URL: https://tudominio.com/api/webhooks/stripe
 *
 * Para desarrollo local, usar Stripe CLI:
 * stripe listen --forward-to localhost:3000/api/webhooks/stripe
 */

import type Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const webhookSecret = config.stripeWebhookSecret

    if (!webhookSecret) {
      console.error('[webhook] NUXT_STRIPE_WEBHOOK_SECRET no está configurado')
      throw createError({
        statusCode: 500,
        statusMessage: 'Webhook secret no configurado',
      })
    }

    // 1. Obtener el raw body (necesario para verificar firma)
    const body = await readRawBody(event)
    if (!body) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No se recibió body',
      })
    }

    // 2. Obtener la firma del header
    const signature = getHeader(event, 'stripe-signature')
    if (!signature) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Firma de Stripe no encontrada',
      })
    }

    // 3. Verificar firma y construir evento
    let stripeEvent: Stripe.Event
    try {
      stripeEvent = await verifyWebhookSignature(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('[webhook] Error al verificar firma:', err.message)
      throw createError({
        statusCode: 400,
        statusMessage: `Firma inválida: ${err.message}`,
      })
    }

    console.log(`[webhook] Evento recibido: ${stripeEvent.type} (${stripeEvent.id})`)

    // 4. Procesar el evento según su tipo
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.processing':
        await handlePaymentProcessing(stripeEvent.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.canceled':
        await handlePaymentCanceled(stripeEvent.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`[webhook] Evento no manejado: ${stripeEvent.type}`)
    }

    // 5. Retornar 200 para confirmar recepción
    return {
      received: true,
      eventId: stripeEvent.id,
      eventType: stripeEvent.type,
    }
  } catch (error: any) {
    console.error('[webhook] Error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Error procesando webhook',
    })
  }
})

/**
 * Maneja evento: payment_intent.succeeded
 * El pago fue exitoso
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id

  console.log(`[webhook] Pago exitoso: ${paymentIntentId}`)

  try {
    // Buscar la orden asociada
    const order = await getOrderByPaymentIntentId(paymentIntentId)

    if (!order) {
      console.log(`[webhook] No se encontró orden para Payment Intent: ${paymentIntentId}`)
      // Esto es normal si el webhook llega antes de que se cree la orden
      // La orden se creará cuando el frontend llame a /api/checkout/confirm
      return
    }

    console.log(`[webhook] Orden encontrada: ${order.id} (${order.orderNumber})`)

    // Actualizar estado según el estado actual
    if (order.state === 'pending') {
      // Si está pendiente, moverla a processing
      const updated = await updateOrderState(order.id, 'processing', order.state)

      if (updated) {
        console.log(`[webhook] Orden ${order.id} actualizada a "processing"`)
      }
    } else if (order.state === 'processing') {
      // Ya está en processing, no hacer nada
      console.log(`[webhook] Orden ${order.id} ya está en estado "processing"`)
    } else {
      console.log(`[webhook] Orden ${order.id} en estado ${order.state}, no se actualiza`)
    }

    // TODO: Enviar email de confirmación al cliente
  } catch (error: any) {
    console.error(`[webhook] Error manejando pago exitoso:`, error)
  }
}

/**
 * Maneja evento: payment_intent.payment_failed
 * El pago falló
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id

  console.log(`[webhook] Pago fallido: ${paymentIntentId}`)
  console.log(`[webhook] Razón: ${paymentIntent.last_payment_error?.message || 'Desconocida'}`)

  try {
    // Buscar la orden asociada
    const order = await getOrderByPaymentIntentId(paymentIntentId)

    if (!order) {
      console.log(`[webhook] No se encontró orden para Payment Intent: ${paymentIntentId}`)
      return
    }

    console.log(`[webhook] Orden encontrada: ${order.id} (${order.orderNumber})`)

    // Actualizar estado a failed
    const updated = await updateOrderState(order.id, 'failed', order.state)

    if (updated) {
      console.log(`[webhook] Orden ${order.id} marcada como "failed"`)
    }

    // TODO: Enviar email notificando el fallo
  } catch (error: any) {
    console.error(`[webhook] Error manejando pago fallido:`, error)
  }
}

/**
 * Maneja evento: payment_intent.processing
 * El pago está siendo procesado (ej: transferencia bancaria)
 */
async function handlePaymentProcessing(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id

  console.log(`[webhook] Pago en procesamiento: ${paymentIntentId}`)

  try {
    const order = await getOrderByPaymentIntentId(paymentIntentId)

    if (!order) {
      console.log(`[webhook] No se encontró orden para Payment Intent: ${paymentIntentId}`)
      return
    }

    console.log(`[webhook] Orden encontrada: ${order.id} (${order.orderNumber})`)

    // La orden ya debería estar en estado "pending" o "processing"
    if (order.state === 'pending') {
      console.log(`[webhook] Orden ${order.id} en procesamiento, manteniendo estado "pending"`)
    }

    // TODO: Notificar al cliente que el pago está siendo procesado
  } catch (error: any) {
    console.error(`[webhook] Error manejando pago en procesamiento:`, error)
  }
}

/**
 * Maneja evento: payment_intent.canceled
 * El pago fue cancelado
 */
async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id

  console.log(`[webhook] Pago cancelado: ${paymentIntentId}`)

  try {
    const order = await getOrderByPaymentIntentId(paymentIntentId)

    if (!order) {
      console.log(`[webhook] No se encontró orden para Payment Intent: ${paymentIntentId}`)
      return
    }

    console.log(`[webhook] Orden encontrada: ${order.id} (${order.orderNumber})`)

    // Marcar como failed
    const updated = await updateOrderState(order.id, 'failed', order.state)

    if (updated) {
      console.log(`[webhook] Orden ${order.id} marcada como "failed" (cancelado)`)
    }

    // TODO: Notificar al cliente
  } catch (error: any) {
    console.error(`[webhook] Error manejando pago cancelado:`, error)
  }
}
