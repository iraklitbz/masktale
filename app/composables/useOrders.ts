import type { Order } from '~/types/checkout'

/**
 * Composable para gestionar órdenes de compra
 */
export const useOrders = () => {
  const toast = useToast()
  const { user, isAuthenticated } = useAuth()

  // State
  const orders = useState<Order[]>('user-orders', () => [])
  const isLoadingOrders = useState<boolean>('is-loading-orders', () => false)
  const ordersError = useState<string | null>('orders-error', () => null)

  /**
   * Obtener todas las órdenes del usuario autenticado
   */
  const getUserOrders = async () => {
    if (!isAuthenticated.value) {
      console.warn('[useOrders] Usuario no autenticado')
      return
    }

    try {
      isLoadingOrders.value = true
      ordersError.value = null

      const result = await $fetch('/api/orders', {
        method: 'GET',
      })

      if (result.success && result.orders) {
        orders.value = result.orders
        console.log('[useOrders] Órdenes cargadas:', orders.value.length)
      } else {
        throw new Error('No se pudieron obtener las órdenes')
      }
    } catch (error: any) {
      console.error('[useOrders] Error al obtener órdenes:', error)
      ordersError.value = error.message || 'Error al cargar las órdenes'
      toast.error('Error', 'No se pudieron cargar tus pedidos')
    } finally {
      isLoadingOrders.value = false
    }
  }

  /**
   * Obtener una orden específica por ID
   */
  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      const result = await $fetch(`/api/orders/${orderId}`)

      if (result.success && result.order) {
        return result.order
      }

      return null
    } catch (error: any) {
      console.error('[useOrders] Error al obtener orden:', error)
      toast.error('Error', 'No se pudo cargar la orden')
      return null
    }
  }

  /**
   * Buscar orden como invitado (sin autenticación)
   * Requiere número de orden y email
   */
  const getGuestOrder = async (orderNumber: string, email: string): Promise<Order | null> => {
    try {
      const result = await $fetch('/api/orders/guest', {
        method: 'POST',
        body: {
          orderNumber,
          email,
        },
      })

      if (result.success && result.order) {
        return result.order
      }

      return null
    } catch (error: any) {
      console.error('[useOrders] Error al buscar orden de invitado:', error)
      toast.error('Error', 'No se pudo encontrar la orden')
      return null
    }
  }

  /**
   * Descargar PDF de un item de orden
   */
  const downloadPDF = (sessionId: string, childName: string, bookTitle: string) => {
    try {
      // Generate PDF URL
      const pdfUrl = `/api/session/${sessionId}/download-pdf`

      // Create temporary link and trigger download
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `${childName}_${bookTitle}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Descargando PDF', `Descargando ${bookTitle}`)
    } catch (error: any) {
      console.error('[useOrders] Error al descargar PDF:', error)
      toast.error('Error', 'No se pudo descargar el PDF')
    }
  }

  /**
   * Filtrar órdenes por estado
   */
  const filterOrdersByState = (state?: string) => {
    if (!state || state === 'all') {
      return orders.value
    }

    return orders.value.filter(order => order.state === state)
  }

  /**
   * Buscar órdenes por número de orden o nombre de libro
   */
  const searchOrders = (query: string) => {
    if (!query.trim()) {
      return orders.value
    }

    const searchTerm = query.toLowerCase()

    return orders.value.filter(order =>
      order.orderNumber.toLowerCase().includes(searchTerm) ||
      order.items.some(item =>
        item.bookTitle.toLowerCase().includes(searchTerm) ||
        item.childName.toLowerCase().includes(searchTerm)
      )
    )
  }

  /**
   * Obtener estadísticas de órdenes
   */
  const getOrderStats = () => {
    const total = orders.value.length
    const completed = orders.value.filter(o => o.state === 'completed').length
    const processing = orders.value.filter(o => o.state === 'processing').length
    const pending = orders.value.filter(o => o.state === 'pending').length
    const failed = orders.value.filter(o => o.state === 'failed').length

    const totalSpent = orders.value
      .filter(o => o.state === 'completed')
      .reduce((sum, order) => sum + order.totalAmount, 0)

    return {
      total,
      completed,
      processing,
      pending,
      failed,
      totalSpent,
    }
  }

  return {
    // State
    orders,
    isLoadingOrders,
    ordersError,

    // Methods
    getUserOrders,
    getOrderById,
    getGuestOrder,
    downloadPDF,
    filterOrdersByState,
    searchOrders,
    getOrderStats,
  }
}
