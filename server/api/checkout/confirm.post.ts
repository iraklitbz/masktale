/**
 * Endpoint: POST /api/checkout/confirm
 *
 * Confirma una orden después de un pago exitoso en Stripe
 *
 * Flujo:
 * 1. Verifica que el pago fue exitoso en Stripe
 * 2. Crea la orden en Strapi
 * 3. Procesa los PDFs para cada item
 * 4. Actualiza el estado a "processing"
 * 5. Retorna la orden creada
 */

import { z } from 'zod'
import type { CheckoutData, Order, OrderItem } from '~/types/checkout'
import type { CartItem } from '~/types/cart'

// Schema de validación (flexible para aceptar campos extra)
const confirmOrderSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment Intent ID es requerido'),
  formData: z.object({
    customerEmail: z.string().email(),
    customerName: z.string().min(1),
    customerPhone: z.string().min(1).optional(), // Opcional si no viene en el payload
    billingAddress: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    }).passthrough(), // Permite campos adicionales como firstName, lastName, etc.
    shippingAddress: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    }).passthrough(), // Permite campos adicionales
    sameAsBilling: z.boolean(),
    acceptTerms: z.boolean(),
    userId: z.number().optional(),
  }).passthrough(), // Permite campos adicionales en formData
  cartItems: z.array(z.object({
    sessionId: z.string(),
    bookTitle: z.string(),
    childName: z.string(),
    age: z.number().optional(), // Opcional si no viene
    quantity: z.number(),
    price: z.number(),
  }).passthrough()), // Permite campos adicionales como id, storyId, addedAt
  total: z.number().positive(),
})

export default defineEventHandler(async (event) => {
  try {
    // 1. Leer y validar el body
    const body = await readBody(event)

    let validatedData
    try {
      validatedData = confirmOrderSchema.parse(body)
    } catch (err: any) {
      console.error('[confirm] Error de validación:', err)
      throw createError({
        statusCode: 400,
        statusMessage: 'Datos inválidos',
        data: err.errors,
      })
    }

    const { paymentIntentId, formData, cartItems, total } = validatedData

    // Normalizar customerPhone si viene en billingAddress.phone
    if (!formData.customerPhone && (formData.billingAddress as any).phone) {
      formData.customerPhone = (formData.billingAddress as any).phone
    }

    console.log(`[confirm] Confirmando orden para Payment Intent: ${paymentIntentId}`)

    // 2. Verificar que el pago fue exitoso en Stripe
    let paymentIntent
    try {
      paymentIntent = await getPaymentIntent(paymentIntentId)
    } catch (err: any) {
      console.error('[confirm] Error al obtener Payment Intent:', err)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error al verificar el pago',
      })
    }

    // Validar estado del pago
    if (paymentIntent.status !== 'succeeded') {
      console.error(`[confirm] Payment Intent no exitoso. Estado: ${paymentIntent.status}`)
      throw createError({
        statusCode: 400,
        statusMessage: `El pago no ha sido completado. Estado: ${paymentIntent.status}`,
      })
    }

    // Validar que el monto coincide
    const expectedAmountInCents = Math.round(total * 100)
    if (paymentIntent.amount !== expectedAmountInCents) {
      console.error(
        `[confirm] Monto no coincide. Esperado: ${expectedAmountInCents}, Recibido: ${paymentIntent.amount}`
      )
      throw createError({
        statusCode: 400,
        statusMessage: 'El monto del pago no coincide con el total de la orden',
      })
    }

    console.log('[confirm] Pago verificado exitosamente')

    // 3. Verificar que no exista ya una orden para este Payment Intent
    const existingOrder = await getOrderByPaymentIntentId(paymentIntentId)
    if (existingOrder) {
      console.log(`[confirm] Orden ya existe para este Payment Intent: ${existingOrder.id}`)
      return {
        success: true,
        order: existingOrder,
        message: 'Orden ya confirmada previamente',
      }
    }

    // 4. Crear la orden en Strapi
    let order
    try {
      order = await createOrderInStrapi(
        paymentIntentId,
        formData as CheckoutData,
        cartItems as CartItem[],
        total
      )
    } catch (err: any) {
      console.error('[confirm] Error al crear orden en Strapi:', err)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error al crear la orden',
        data: { error: err.message },
      })
    }

    console.log(`[confirm] Orden creada en Strapi con ID: ${order.id}`)

    // 5. Procesar PDFs y enviar email en segundo plano (no bloquea la respuesta)
    // Esto se ejecutará de forma asíncrona
    processPdfsAndSendEmail(order)

    // 6. Retornar la orden
    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        state: order.state,
        total: order.total,
        currency: order.currency,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        items: order.items.map(item => ({
          id: item.id,
          bookTitle: item.bookTitle,
          childName: item.childName,
          quantity: item.quantity,
        })),
      },
      message: 'Orden confirmada exitosamente',
    }
  } catch (error: any) {
    console.error('[confirm] Error:', error)

    // Si es un error de createError, dejarlo pasar
    if (error.statusCode) {
      throw error
    }

    // Error genérico
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al confirmar la orden',
      data: { error: error.message },
    })
  }
})

/**
 * Procesa los PDFs y envía email en segundo plano
 * No bloquea la respuesta al cliente
 */
async function processPdfsAndSendEmail(order: any) {
  try {
    console.log(`[processPdfsAndSendEmail] Iniciando procesamiento para orden ${order.id}`)

    // Procesar PDFs
    const pdfUrls = await processPdfsForOrder(order.items)

    console.log(`[processPdfsAndSendEmail] ${pdfUrls.size} PDFs procesados`)

    // Actualizar estado de la orden a "processing"
    const updated = await updateOrderState(order.id, 'processing', 'pending')

    if (updated) {
      console.log(`[processPdfsAndSendEmail] Orden ${order.id} actualizada a estado "processing"`)
    } else {
      console.error(`[processPdfsAndSendEmail] No se pudo actualizar el estado de la orden ${order.id}`)
    }

    // Enviar email de confirmación
    const { sendOrderConfirmationEmail } = await import('../../utils/email-sender')
    const emailResult = await sendOrderConfirmationEmail(order)

    if (emailResult.success) {
      console.log(`[processPdfsAndSendEmail] Email de confirmación enviado. ID: ${emailResult.emailId}`)
    } else {
      console.error(`[processPdfsAndSendEmail] Error enviando email:`, emailResult.error)
    }
  } catch (error: any) {
    console.error(`[processPdfsAndSendEmail] Error procesando PDFs para orden ${order.id}:`, error)
    // Intentar marcar la orden como fallida
    await updateOrderState(order.id, 'failed', 'pending')
  }
}
