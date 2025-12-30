/**
 * Item individual del carrito de compras
 */
export interface CartItem {
  /** Unique ID (usa sessionId) */
  id: string
  /** ID del cuento seleccionado */
  storyId: string
  /** ID de sesión de generación */
  sessionId: string
  /** Título del libro */
  bookTitle: string
  /** Nombre del niño personalizado */
  childName: string
  /** URL de preview de portada (opcional) */
  coverImageUrl?: string
  /** Precio en EUR */
  price: number
  /** Cantidad (por defecto 1) */
  quantity: number
  /** Fecha de agregado al carrito (ISO string) */
  addedAt: string
}

/**
 * Carrito de compras completo con cálculos
 */
export interface Cart {
  /** Items en el carrito */
  items: CartItem[]
  /** Número total de items (suma de quantities) */
  totalItems: number
  /** Subtotal sin impuestos ni envío */
  subtotal: number
  /** IVA (21% en España) */
  tax: number
  /** Coste de envío */
  shipping: number
  /** Total a pagar (subtotal + tax + shipping) */
  total: number
}

/**
 * Datos para añadir un item al carrito
 */
export interface AddToCartData {
  storyId: string
  sessionId: string
  bookTitle: string
  childName: string
  coverImageUrl?: string
  price?: number // Si no se proporciona, usa precio por defecto
  quantity?: number // Default: 1
}
