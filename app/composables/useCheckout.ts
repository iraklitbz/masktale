import type { CheckoutData, Address } from '~/types/checkout'
import { checkoutSchema, type CheckoutFormData } from '~/utils/validation'

/**
 * Composable para gestionar el proceso de checkout
 */
export function useCheckout() {
  const { user, isAuthenticated } = useAuth()
  const { cart, isEmpty } = useCart()
  const router = useRouter()

  // Estado del formulario
  const formData = reactive<CheckoutFormData>({
    customerEmail: '',
    customerName: '',
    billingAddress: {
      firstName: '',
      lastName: '',
      street: '',
      streetLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'ES',
      phone: '',
    },
    shippingAddress: {
      firstName: '',
      lastName: '',
      street: '',
      streetLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'ES',
      phone: '',
    },
    sameAsBilling: true,
    acceptTerms: false,
  })

  // Estado de validación
  const errors = ref<Record<string, string>>({})
  const isValidating = ref(false)

  /**
   * Auto-rellenar datos del usuario logeado
   */
  function prefillUserData() {
    if (isAuthenticated.value && user.value) {
      formData.customerEmail = user.value.email || ''
      formData.customerName = user.value.username || ''
      formData.userId = user.value.id
    }
  }

  /**
   * Validar el formulario completo
   */
  function validateForm(): boolean {
    isValidating.value = true
    errors.value = {}

    try {
      // Si sameAsBilling es true, copiar dirección de facturación a envío
      if (formData.sameAsBilling) {
        formData.shippingAddress = { ...formData.billingAddress }
      }

      // Validar con Zod
      checkoutSchema.parse(formData)
      return true
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.')
          errors.value[path] = err.message
        })
      }
      return false
    } finally {
      isValidating.value = false
    }
  }

  /**
   * Validar un campo específico
   */
  function validateField(field: string): boolean {
    try {
      const fieldPath = field.split('.')
      let value: any = formData

      // Navegar por el path para obtener el valor
      for (const key of fieldPath) {
        value = value[key]
      }

      // Obtener el esquema del campo
      const fieldSchema = fieldPath.reduce((schema: any, key) => {
        return schema.shape?.[key] || schema
      }, checkoutSchema)

      // Validar
      fieldSchema.parse(value)
      delete errors.value[field]
      return true
    } catch (error: any) {
      if (error.errors && error.errors[0]) {
        errors.value[field] = error.errors[0].message
      }
      return false
    }
  }

  /**
   * Limpiar errores
   */
  function clearErrors() {
    errors.value = {}
  }

  /**
   * Limpiar error de un campo específico
   */
  function clearFieldError(field: string) {
    delete errors.value[field]
  }

  /**
   * Obtener error de un campo
   */
  function getFieldError(field: string): string | undefined {
    return errors.value[field]
  }

  /**
   * Verificar si un campo tiene error
   */
  function hasFieldError(field: string): boolean {
    return !!errors.value[field]
  }

  /**
   * Toggle sameAsBilling
   */
  function toggleSameAsBilling() {
    formData.sameAsBilling = !formData.sameAsBilling
    if (formData.sameAsBilling) {
      // Copiar dirección de facturación a envío
      formData.shippingAddress = { ...formData.billingAddress }
    }
  }

  /**
   * Preparar datos para enviar
   */
  function prepareCheckoutData(): CheckoutData {
    // Si sameAsBilling, usar la misma dirección
    const shippingAddress = formData.sameAsBilling
      ? formData.billingAddress
      : formData.shippingAddress

    return {
      customerEmail: formData.customerEmail,
      customerName: formData.customerName,
      billingAddress: formData.billingAddress as Address,
      shippingAddress: shippingAddress as Address,
      sameAsBilling: formData.sameAsBilling,
      acceptTerms: formData.acceptTerms,
      userId: formData.userId,
    }
  }

  /**
   * Verificar si el carrito está vacío y redirigir
   */
  function checkCartNotEmpty() {
    if (isEmpty.value) {
      router.push('/cart')
      return false
    }
    return true
  }

  // Auto-rellenar al montar
  onMounted(() => {
    prefillUserData()
    checkCartNotEmpty()
  })

  return {
    // Estado
    formData,
    errors,
    isValidating,

    // Computed
    isAuthenticated,
    cart,

    // Métodos de validación
    validateForm,
    validateField,
    clearErrors,
    clearFieldError,
    getFieldError,
    hasFieldError,

    // Métodos de formulario
    toggleSameAsBilling,
    prepareCheckoutData,
    prefillUserData,
    checkCartNotEmpty,
  }
}
