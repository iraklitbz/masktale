/**
 * Email Sender - Envía emails usando Resend
 */

import { Resend } from 'resend'
import { getOrderConfirmationHtml, getOrderCompletedHtml } from './email-templates'
import type { Order } from '~/types/checkout'

/**
 * Inicializa el cliente de Resend
 */
function getResendClient() {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey

  if (!apiKey) {
    throw new Error('NUXT_RESEND_API_KEY no está configurado')
  }

  return new Resend(apiKey)
}

/**
 * Envía email de confirmación de pedido
 */
export async function sendOrderConfirmationEmail(order: Order) {
  try {
    console.log(`[sendOrderConfirmationEmail] Enviando email para orden ${order.orderNumber}`)

    const resend = getResendClient()
    const config = useRuntimeConfig()

    // Renderizar el template HTML
    const emailHtml = getOrderConfirmationHtml({
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      items: order.items.map(item => ({
        bookTitle: item.bookTitle,
        childName: item.childName,
        quantity: item.quantity,
        price: item.price || item.unitPrice || 0,
      })),
      totalAmount: order.total || order.totalAmount || 0,
      orderDate: new Date(order.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    })

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: config.public.emailFrom || 'Mask Stories <onboarding@resend.dev>',
      to: [order.customerEmail],
      subject: `¡Pedido confirmado! ${order.orderNumber}`,
      html: emailHtml,
    })

    if (error) {
      console.error('[sendOrderConfirmationEmail] Error de Resend:', error)
      throw error
    }

    console.log(`[sendOrderConfirmationEmail] Email enviado exitosamente. ID: ${data?.id}`)

    return { success: true, emailId: data?.id }
  } catch (error: any) {
    console.error('[sendOrderConfirmationEmail] Error:', error)
    // No lanzar error para no bloquear el flujo de checkout
    return { success: false, error: error.message }
  }
}

/**
 * Envía email de pedido completado
 */
export async function sendOrderCompletedEmail(order: Order) {
  try {
    console.log(`[sendOrderCompletedEmail] Enviando email para orden ${order.orderNumber}`)

    const resend = getResendClient()
    const config = useRuntimeConfig()

    // Renderizar el template HTML
    const emailHtml = getOrderCompletedHtml({
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      items: order.items.map(item => ({
        bookTitle: item.bookTitle,
        childName: item.childName,
      })),
      completedDate: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    })

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: config.public.emailFrom || 'Mask Stories <onboarding@resend.dev>',
      to: [order.customerEmail],
      subject: `¡Tu pedido ${order.orderNumber} está listo!`,
      html: emailHtml,
    })

    if (error) {
      console.error('[sendOrderCompletedEmail] Error de Resend:', error)
      throw error
    }

    console.log(`[sendOrderCompletedEmail] Email enviado exitosamente. ID: ${data?.id}`)

    return { success: true, emailId: data?.id }
  } catch (error: any) {
    console.error('[sendOrderCompletedEmail] Error:', error)
    return { success: false, error: error.message }
  }
}
