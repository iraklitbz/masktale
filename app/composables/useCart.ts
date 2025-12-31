import type { CartItem, Cart, AddToCartData } from '~/types/cart'
import {
  PRODUCT_PRICES,
  calculateSubtotal,
  calculateTax,
  calculateShipping,
  calculateTotal,
} from '~/config/products'

const CART_STORAGE_KEY = 'mask_cart'

/**
 * Composable para gestionar el carrito de compras
 */
export function useCart() {
  // Estado del carrito (persistente en localStorage)
  const cartItems = useState<CartItem[]>('cart-items', () => [])

  // Cargar items desde localStorage al inicializar
  if (import.meta.client) {
    onMounted(() => {
      loadCartFromStorage()
    })
  }

  /**
   * Carrito completo con cálculos
   */
  const cart = computed<Cart>(() => {
    const items = cartItems.value
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = calculateSubtotal(items)
    const tax = calculateTax(subtotal)
    const shipping = calculateShipping(totalItems)
    const total = calculateTotal(subtotal, tax, shipping)

    return {
      items,
      totalItems,
      subtotal,
      tax,
      shipping,
      total,
    }
  })

  /**
   * Número de items en el carrito
   */
  const itemCount = computed(() => cart.value.totalItems)

  /**
   * Verifica si el carrito está vacío
   */
  const isEmpty = computed(() => cartItems.value.length === 0)

  /**
   * Añade un item al carrito
   */
  function addItem(data: AddToCartData): void {
    const existingItem = cartItems.value.find(item => item.sessionId === data.sessionId)

    if (existingItem) {
      // Si ya existe, incrementar cantidad
      existingItem.quantity += data.quantity || 1
    } else {
      // Si no existe, crear nuevo item
      const newItem: CartItem = {
        id: data.sessionId,
        storyId: data.storyId,
        sessionId: data.sessionId,
        bookTitle: data.bookTitle,
        childName: data.childName,
        coverImageUrl: data.coverImageUrl,
        price: data.price || PRODUCT_PRICES.personalized_book,
        quantity: data.quantity || 1,
        addedAt: new Date().toISOString(),
      }
      cartItems.value.push(newItem)
    }

    saveCartToStorage()

    // Mostrar notificación
    const toast = useToast()
    toast.success(`"${data.bookTitle}" añadido al carrito`)
  }

  /**
   * Elimina un item del carrito
   */
  function removeItem(sessionId: string): void {
    const itemIndex = cartItems.value.findIndex(item => item.sessionId === sessionId)

    if (itemIndex !== -1) {
      const item = cartItems.value[itemIndex]
      cartItems.value.splice(itemIndex, 1)
      saveCartToStorage()

      const toast = useToast()
      toast.info(`"${item.bookTitle}" eliminado del carrito`)
    }
  }

  /**
   * Actualiza la cantidad de un item
   */
  function updateQuantity(sessionId: string, quantity: number): void {
    const item = cartItems.value.find(item => item.sessionId === sessionId)

    if (item) {
      if (quantity <= 0) {
        removeItem(sessionId)
      } else {
        item.quantity = quantity
        saveCartToStorage()
      }
    }
  }

  /**
   * Incrementa la cantidad de un item
   */
  function incrementQuantity(sessionId: string): void {
    const item = cartItems.value.find(item => item.sessionId === sessionId)
    if (item) {
      item.quantity++
      saveCartToStorage()
    }
  }

  /**
   * Decrementa la cantidad de un item
   */
  function decrementQuantity(sessionId: string): void {
    const item = cartItems.value.find(item => item.sessionId === sessionId)
    if (item) {
      if (item.quantity <= 1) {
        removeItem(sessionId)
      } else {
        item.quantity--
        saveCartToStorage()
      }
    }
  }

  /**
   * Limpia todo el carrito
   */
  function clearCart(): void {
    cartItems.value = []
    saveCartToStorage()

    const toast = useToast()
    toast.info('Carrito vaciado')
  }

  /**
   * Obtiene un item por sessionId
   */
  function getItem(sessionId: string): CartItem | undefined {
    return cartItems.value.find(item => item.sessionId === sessionId)
  }

  /**
   * Verifica si un item está en el carrito
   */
  function hasItem(sessionId: string): boolean {
    return cartItems.value.some(item => item.sessionId === sessionId)
  }

  /**
   * Guarda el carrito en localStorage
   */
  function saveCartToStorage(): void {
    if (import.meta.client) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems.value))
      } catch (error) {
        console.error('Error guardando carrito en localStorage:', error)
      }
    }
  }

  /**
   * Carga el carrito desde localStorage
   */
  function loadCartFromStorage(): void {
    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        if (stored) {
          cartItems.value = JSON.parse(stored)
        }
      } catch (error) {
        console.error('Error cargando carrito desde localStorage:', error)
        cartItems.value = []
      }
    }
  }

  return {
    // Estado
    cart,
    cartItems,
    itemCount,
    isEmpty,

    // Métodos
    addItem,
    removeItem,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    getItem,
    hasItem,
  }
}
