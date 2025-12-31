/**
 * Endpoint: GET /api/orders/:id
 *
 * Obtiene los detalles de una orden por su ID
 *
 * Seguridad:
 * - Por ahora público (necesario para página de success sin auth)
 * - TODO: En futuro, validar que el usuario sea dueño de la orden
 *   o verificar con email + orderNumber para invitados
 */

export default defineEventHandler(async (event) => {
  try {
    const orderId = getRouterParam(event, 'id')

    if (!orderId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de orden requerido',
      })
    }

    // En Strapi v5, usamos documentId (string/UUID) en lugar de numeric ID
    // Obtener orden
    const order = await getOrderById(orderId)

    if (!order) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Orden no encontrada',
      })
    }

    // Retornar orden
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
          sessionId: item.sessionId,
          bookTitle: item.bookTitle,
          childName: item.childName,
          quantity: item.quantity,
          price: item.price,
          pdfUrl: item.pdfUrl,
        })),
        billingAddress: order.billingAddress,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    }
  } catch (error: any) {
    console.error('[GET /api/orders/:id] Error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Error al obtener la orden',
    })
  }
})
