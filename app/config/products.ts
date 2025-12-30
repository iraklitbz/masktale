/**
 * Configuración de precios de productos
 */

export const PRODUCT_PRICES = {
  /** Precio de un libro personalizado (EUR) */
  personalized_book: 24.99,

  /** Gastos de envío (EUR) - fijo para 1-5 libros */
  shipping: 3.99,

  /** Tasa de IVA (21% en España) */
  tax_rate: 0.21,
} as const

/**
 * Calcula el subtotal de items
 */
export function calculateSubtotal(items: Array<{ price: number; quantity: number }>): number {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}

/**
 * Calcula el IVA
 */
export function calculateTax(subtotal: number): number {
  return subtotal * PRODUCT_PRICES.tax_rate
}

/**
 * Calcula el coste de envío (fijo independiente de cantidad)
 */
export function calculateShipping(itemCount: number): number {
  return itemCount > 0 ? PRODUCT_PRICES.shipping : 0
}

/**
 * Calcula el total de una compra
 */
export function calculateTotal(subtotal: number, tax: number, shipping: number): number {
  return subtotal + tax + shipping
}

/**
 * Formatea un precio a EUR
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

/**
 * Convierte EUR a centavos para Stripe
 * @param euros - Cantidad en euros (ej: 29.99)
 * @returns Cantidad en centavos (ej: 2999)
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100)
}

/**
 * Convierte centavos a EUR desde Stripe
 * @param cents - Cantidad en centavos (ej: 2999)
 * @returns Cantidad en euros (ej: 29.99)
 */
export function centsToEuros(cents: number): number {
  return cents / 100
}
