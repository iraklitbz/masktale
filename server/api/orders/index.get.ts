/**
 * Endpoint: GET /api/orders
 *
 * Obtiene todas las órdenes del usuario autenticado
 *
 * Requiere:
 * - Usuario autenticado (JWT token)
 *
 * Retorna:
 * - Lista de órdenes del usuario ordenadas por fecha (más reciente primero)
 */

export default defineEventHandler(async (event) => {
  try {
    // Obtener el usuario autenticado desde el token JWT
    const user = event.context.user

    if (!user || !user.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autenticado. Debes iniciar sesión para ver tus pedidos.',
      })
    }

    const config = useRuntimeConfig()
    const strapiUrl = config.public.strapiUrl
    const apiToken = config.strapiApiToken

    // Obtener órdenes del usuario desde Strapi
    const response = await fetch(
      `${strapiUrl}/api/orders?filters[user][id][$eq]=${user.id}&populate=items&sort=createdAt:desc`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Error al obtener órdenes: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.data || result.data.length === 0) {
      return {
        success: true,
        orders: [],
        count: 0,
      }
    }

    // Transformar las órdenes al formato esperado por el frontend
    const orders = result.data.map((orderData: any) => {
      const attrs = orderData.attributes || orderData

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

      return {
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
    })

    return {
      success: true,
      orders,
      count: orders.length,
    }
  } catch (error: any) {
    console.error('[GET /api/orders] Error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Error al obtener las órdenes',
    })
  }
})
