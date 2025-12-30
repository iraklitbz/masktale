/**
 * Dirección de facturación o envío
 */
export interface Address {
  firstName: string
  lastName: string
  street: string
  streetLine2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  phone?: string
}

/**
 * Datos completos del formulario de checkout
 */
export interface CheckoutData {
  customerEmail: string
  customerName: string
  billingAddress: Address
  shippingAddress: Address
  sameAsBilling: boolean
  acceptTerms: boolean
  userId?: string // Si está logeado
}

/**
 * Orden completa
 */
export interface Order {
  id: string
  orderNumber: string
  state: OrderState
  totalAmount: number
  currency: string
  customerEmail: string
  customerName: string
  billingAddress: Address
  shippingAddress: Address
  items: OrderItem[]
  stripePaymentIntentId: string
  paidAt?: string
  createdAt: string
  updatedAt?: string
}

/**
 * Estados posibles de una orden
 * NOTA: Usamos "state" en vez de "status" por conflicto interno de Strapi
 */
export type OrderState =
  | 'pending'       // Creada pero no pagada
  | 'processing'    // Pago en proceso
  | 'completed'     // Pagada y completada
  | 'failed'        // Pago fallido
  | 'refunded'      // Reembolsada

/**
 * Item individual de una orden
 */
export interface OrderItem {
  id: string
  productType: string
  bookTitle: string
  childName: string
  storyId: string
  unitPrice: number
  quantity: number
  subtotal: number
  pdfUrl?: string
  coverImageUrl?: string
  sessionId?: string
}

/**
 * Datos para crear una orden en Strapi
 */
export interface CreateOrderData {
  orderNumber: string
  state: OrderState
  totalAmount: number
  currency: string
  customerEmail: string
  customerName: string
  billingAddress: Address
  shippingAddress: Address
  sameAsBilling: boolean
  stripePaymentIntentId: string
  stripePaymentStatus: string
  paymentMethod: string
  userId?: number // ID del usuario en Strapi si está logeado
  items: CreateOrderItemData[]
}

/**
 * Datos para crear un OrderItem en Strapi
 */
export interface CreateOrderItemData {
  productType: string
  bookTitle: string
  childName: string
  storyId: string
  unitPrice: number
  quantity: number
  subtotal: number
  sessionId: string
  coverImageUrl?: string
}

/**
 * Response de la API de Strapi para Order
 */
export interface StrapiOrderResponse {
  data: {
    id: number
    attributes: {
      orderNumber: string
      state: OrderState
      totalAmount: number
      currency: string
      customerEmail: string
      customerName: string
      billingAddress: Address
      shippingAddress: Address
      sameAsBilling: boolean
      stripePaymentIntentId: string
      stripePaymentStatus: string
      paymentMethod: string
      paidAt: string | null
      createdAt: string
      updatedAt: string
      items?: {
        data: Array<{
          id: number
          attributes: {
            productType: string
            bookTitle: string
            childName: string
            storyId: string
            unitPrice: number
            quantity: number
            subtotal: number
            pdfUrl: string | null
            coverImageUrl: string | null
            sessionId: string
            createdAt: string
          }
        }>
      }
    }
  }
}
