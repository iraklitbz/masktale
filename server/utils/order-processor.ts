/**
 * Order Processor - Lógica de negocio para órdenes
 *
 * Este archivo contiene toda la lógica de procesamiento de órdenes:
 * - Creación de órdenes en Strapi
 * - Actualización de estados
 * - Validaciones
 * - Generación de números de orden
 * - Transiciones de estado
 */

import type { Order, OrderState, OrderItem, CheckoutData } from '~/types/checkout'
import type { CartItem } from '~/types/cart'

/**
 * Genera un número de orden único
 * Formato: MASK-YYYYMMDD-XXXXX
 * Ejemplo: MASK-20251231-00042
 */
export function generateOrderNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 99999)).padStart(5, '0')

  return `MASK-${year}${month}${day}-${random}`
}

/**
 * Valida una transición de estado
 *
 * Transiciones permitidas:
 * - pending → processing (cuando se confirma el pago)
 * - pending → failed (cuando falla el pago)
 * - processing → completed (cuando se completa el procesamiento)
 * - processing → failed (si algo falla durante el procesamiento)
 * - completed → refunded (si se reembolsa)
 * - failed → processing (si se reintenta el pago)
 */
const VALID_TRANSITIONS: Record<OrderState, OrderState[]> = {
  pending: ['processing', 'failed'],
  processing: ['completed', 'failed'],
  completed: ['refunded'],
  failed: ['processing'],
  refunded: [],
}

export function isValidTransition(from: OrderState, to: OrderState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) || false
}

/**
 * Crea una orden en Strapi
 *
 * @param paymentIntentId - ID del Payment Intent de Stripe
 * @param formData - Datos del formulario de checkout
 * @param cartItems - Items del carrito
 * @param total - Total de la orden en euros
 * @returns La orden creada
 */
export async function createOrderInStrapi(
  paymentIntentId: string,
  formData: CheckoutData,
  cartItems: CartItem[],
  total: number
): Promise<Order> {
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl
  const apiToken = config.strapiApiToken

  if (!strapiUrl || !apiToken) {
    throw new Error('Configuración de Strapi incompleta')
  }

  const orderNumber = generateOrderNumber()

  // Dividir customerName en firstName y lastName
  const nameParts = formData.customerName.trim().split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || nameParts[0] || ''

  // Preparar los items de la orden
  const orderItemsData = cartItems.map(item => ({
    sessionId: item.sessionId,
    storyId: item.storyId,
    bookTitle: item.bookTitle,
    childName: item.childName,
    productType: 'book',
    unitPrice: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
    coverImageUrl: item.coverImageUrl || null,
    pdfUrl: null, // Se actualizará después cuando se genere el PDF
    pdfFile: null,
    generatedAt: null,
  }))

  // Preparar los datos de la orden
  const orderData = {
    data: {
      orderNumber,
      state: 'pending' as OrderState,
      totalAmount: total, // Strapi usa 'totalAmount'
      currency: 'eur',
      customerEmail: formData.customerEmail,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      stripePaymentIntentId: paymentIntentId,
      billingAddress: {
        firstName,
        lastName,
        street: formData.billingAddress.street,
        city: formData.billingAddress.city,
        state: formData.billingAddress.state,
        postalCode: formData.billingAddress.postalCode,
        country: formData.billingAddress.country,
        phone: formData.customerPhone || '',
      },
      shippingAddress: {
        firstName,
        lastName,
        street: formData.shippingAddress.street,
        city: formData.shippingAddress.city,
        state: formData.shippingAddress.state,
        postalCode: formData.shippingAddress.postalCode,
        country: formData.shippingAddress.country,
        phone: formData.customerPhone || '',
      },
      // Solo asignar usuario si existe
      // En Strapi v5, las relaciones pueden necesitar formato de objeto
      ...(formData.userId && { user: { id: formData.userId } }),
    },
  }

  try {
    // 1. Crear la orden
    const orderResponse = await fetch(`${strapiUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify(orderData),
    })

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.error('[createOrderInStrapi] Error al crear orden:', errorText)
      throw new Error(`Error al crear orden en Strapi: ${orderResponse.statusText}`)
    }

    const orderResult = await orderResponse.json()
    const orderId = orderResult.data.id
    const orderDocumentId = orderResult.data.documentId

    console.log(`[createOrderInStrapi] Orden creada con ID: ${orderId}, documentId: ${orderDocumentId}`)

    // 2. Crear los OrderItems y asociarlos con la orden
    const itemPromises = orderItemsData.map(async (itemData) => {
      const orderItemResponse = await fetch(`${strapiUrl}/api/order-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          data: {
            ...itemData,
            order: orderDocumentId, // Usar documentId para la relación en Strapi v5
          },
        }),
      })

      if (!orderItemResponse.ok) {
        const errorText = await orderItemResponse.text()
        console.error('[createOrderInStrapi] Error al crear item:', errorText)
        throw new Error(`Error al crear item de orden: ${orderItemResponse.statusText}`)
      }

      return orderItemResponse.json()
    })

    const itemResults = await Promise.all(itemPromises)

    console.log(`[createOrderInStrapi] ${itemResults.length} items creados`)

    // 3. Construir el objeto Order para retornar
    const order: Order = {
      id: orderDocumentId, // Usar documentId en lugar de numeric id
      orderNumber,
      state: 'pending',
      total,
      currency: 'eur',
      customerEmail: formData.customerEmail,
      customerName: formData.customerName,
      stripePaymentIntentId: paymentIntentId,
      items: itemResults.map((result, index) => ({
        id: result.data.documentId, // Usar documentId en lugar de numeric id
        sessionId: orderItemsData[index].sessionId,
        bookTitle: orderItemsData[index].bookTitle,
        childName: orderItemsData[index].childName,
        quantity: orderItemsData[index].quantity,
        price: orderItemsData[index].unitPrice,
        pdfUrl: null,
      })),
      billingAddress: formData.billingAddress,
      shippingAddress: formData.shippingAddress,
      createdAt: orderResult.data.attributes?.createdAt || orderResult.data.createdAt || new Date().toISOString(),
      updatedAt: orderResult.data.attributes?.updatedAt || orderResult.data.updatedAt || new Date().toISOString(),
    }

    return order
  } catch (error: any) {
    console.error('[createOrderInStrapi] Error:', error)
    throw error
  }
}

/**
 * Obtiene una orden de Strapi por Payment Intent ID
 */
export async function getOrderByPaymentIntentId(paymentIntentId: string): Promise<Order | null> {
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl
  const apiToken = config.strapiApiToken

  try {
    const response = await fetch(
      `${strapiUrl}/api/orders?filters[stripePaymentIntentId][$eq]=${paymentIntentId}&populate=*`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Error al obtener orden: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.data || result.data.length === 0) {
      return null
    }

    const orderData = result.data[0]

    // En Strapi v5, los atributos pueden estar directamente en data o en data.attributes
    const attrs = orderData.attributes || orderData

    // Transformar la respuesta de Strapi al formato Order
    const order: Order = {
      id: orderData.documentId,
      orderNumber: attrs.orderNumber,
      state: attrs.state,
      total: attrs.totalAmount,
      currency: attrs.currency,
      customerEmail: attrs.customerEmail,
      customerName: attrs.customerName,
      stripePaymentIntentId: attrs.stripePaymentIntentId,
      items: [], // TODO: popular items si es necesario
      billingAddress: attrs.billingAddress,
      shippingAddress: attrs.shippingAddress,
      createdAt: attrs.createdAt || orderData.createdAt || new Date().toISOString(),
      updatedAt: attrs.updatedAt || orderData.updatedAt || new Date().toISOString(),
    }

    return order
  } catch (error) {
    console.error('[getOrderByPaymentIntentId] Error:', error)
    return null
  }
}

/**
 * Actualiza el estado de una orden
 */
export async function updateOrderState(
  orderId: string,
  newState: OrderState,
  currentState?: OrderState
): Promise<boolean> {
  // Validar transición si conocemos el estado actual
  if (currentState && !isValidTransition(currentState, newState)) {
    console.error(
      `[updateOrderState] Transición inválida de ${currentState} a ${newState} para orden ${orderId}`
    )
    return false
  }

  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl
  const apiToken = config.strapiApiToken

  try {
    const response = await fetch(`${strapiUrl}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        data: {
          state: newState,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[updateOrderState] Error al actualizar estado:', errorText)
      return false
    }

    console.log(`[updateOrderState] Orden ${orderId} actualizada a estado: ${newState}`)
    return true
  } catch (error) {
    console.error('[updateOrderState] Error:', error)
    return false
  }
}

/**
 * Actualiza la URL del PDF de un OrderItem
 */
export async function updateOrderItemPdfUrl(
  itemId: string,
  pdfUrl: string
): Promise<boolean> {
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl
  const apiToken = config.strapiApiToken

  try {
    const response = await fetch(`${strapiUrl}/api/order-items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        data: {
          pdfUrl,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[updateOrderItemPdfUrl] Error al actualizar PDF URL:', errorText)
      return false
    }

    console.log(`[updateOrderItemPdfUrl] Item ${itemId} actualizado con PDF: ${pdfUrl}`)
    return true
  } catch (error) {
    console.error('[updateOrderItemPdfUrl] Error:', error)
    return false
  }
}

/**
 * Obtiene una orden por su ID (documentId)
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl
  const apiToken = config.strapiApiToken

  try {
    const response = await fetch(
      `${strapiUrl}/api/orders/${orderId}?populate=*`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Error al obtener orden: ${response.statusText}`)
    }

    const result = await response.json()
    const orderData = result.data

    // En Strapi v5, los atributos pueden estar directamente en data o en data.attributes
    const attrs = orderData.attributes || orderData

    // Transformar items
    const items: OrderItem[] = attrs.items?.data?.map((item: any) => ({
      id: item.documentId,
      sessionId: item.attributes?.sessionId || item.sessionId,
      bookTitle: item.attributes?.bookTitle || item.bookTitle,
      childName: item.attributes?.childName || item.childName,
      quantity: item.attributes?.quantity || item.quantity,
      price: item.attributes?.price || item.price,
      pdfUrl: item.attributes?.pdfUrl || item.pdfUrl,
    })) || []

    const order: Order = {
      id: orderData.documentId,
      orderNumber: attrs.orderNumber,
      state: attrs.state,
      total: attrs.totalAmount,
      currency: attrs.currency,
      customerEmail: attrs.customerEmail,
      customerName: attrs.customerName,
      stripePaymentIntentId: attrs.stripePaymentIntentId,
      items,
      billingAddress: attrs.billingAddress,
      shippingAddress: attrs.shippingAddress,
      createdAt: attrs.createdAt || orderData.createdAt || new Date().toISOString(),
      updatedAt: attrs.updatedAt || orderData.updatedAt || new Date().toISOString(),
    }

    return order
  } catch (error) {
    console.error('[getOrderById] Error:', error)
    return null
  }
}
