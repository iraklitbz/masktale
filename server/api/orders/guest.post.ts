/**
 * Endpoint: POST /api/orders/guest
 *
 * Permite a usuarios no autenticados buscar su pedido usando
 * el número de orden y el email de compra
 *
 * Body:
 * - orderNumber: string
 * - email: string
 *
 * Retorna:
 * - Orden encontrada o null
 */

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { orderNumber, email } = body

    if (!orderNumber || !email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Se requiere número de orden y email',
      })
    }

    console.log(`[POST /api/orders/guest] Buscando orden ${orderNumber} para ${email}`)

    const config = useRuntimeConfig()
    const strapiUrl = config.public.strapiUrl
    const apiToken = config.strapiApiToken

    // Buscar orden por número y email
    const response = await fetch(
      `${strapiUrl}/api/orders?filters[orderNumber][$eq]=${orderNumber}&filters[customerEmail][$eq]=${email}&populate=items`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Error al buscar orden: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.data || result.data.length === 0) {
      console.log('[POST /api/orders/guest] Orden no encontrada')
      return {
        success: false,
        order: null,
      }
    }

    // Obtener la primera orden (debería ser única)
    const orderData = result.data[0]
    const attrs = orderData.attributes

    // Transformar items
    const items = attrs.items?.data?.map((item: any) => ({
      id: item.documentId,
      sessionId: item.attributes.sessionId,
      bookTitle: item.attributes.bookTitle,
      childName: item.attributes.childName,
      quantity: item.attributes.quantity,
      unitPrice: item.attributes.unitPrice,
      subtotal: item.attributes.subtotal,
      pdfUrl: item.attributes.pdfUrl,
    })) || []

    const order = {
      id: orderData.documentId,
      orderNumber: attrs.orderNumber,
      state: attrs.state,
      totalAmount: attrs.totalAmount,
      currency: attrs.currency,
      customerEmail: attrs.customerEmail,
      customerName: attrs.customerName,
      stripePaymentIntentId: attrs.stripePaymentIntentId,
      items,
      billingAddress: attrs.billingAddress,
      shippingAddress: attrs.shippingAddress,
      createdAt: attrs.createdAt,
      updatedAt: attrs.updatedAt,
    }

    console.log('[POST /api/orders/guest] Orden encontrada')

    return {
      success: true,
      order,
    }
  } catch (error: any) {
    console.error('[POST /api/orders/guest] Error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Error al buscar la orden',
    })
  }
})
