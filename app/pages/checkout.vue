<script setup lang="ts">
import CheckoutForm from '~/components/checkout/CheckoutForm.vue'
import OrderSummary from '~/components/checkout/OrderSummary.vue'
import StripePayment from '~/components/checkout/StripePayment.vue'
import { formatPrice } from '~/config/products'

// Meta tags
useHead({
  title: 'Checkout | Mask',
  meta: [
    { name: 'description', content: 'Finaliza tu pedido de libros personalizados' },
  ],
})

// Checkout composable
const {
  formData,
  errors,
  isValidating,
  isAuthenticated,
  cart,
  validateForm,
  validateField,
  clearFieldError,
  getFieldError,
  hasFieldError,
  toggleSameAsBilling,
  prepareCheckoutData,
  checkCartNotEmpty,
} = useCheckout()

const toast = useToast()
const router = useRouter()

// Stripe Payment
const stripePaymentRef = ref<InstanceType<typeof StripePayment> | null>(null)
const clientSecret = ref<string | null>(null)
const paymentIntentId = ref<string | null>(null)

// Processing states
const isCreatingIntent = ref(false)
const isProcessingPayment = ref(false)
const showPaymentForm = ref(false)

const isProcessing = computed(() => isCreatingIntent.value || isProcessingPayment.value)

/**
 * Create Payment Intent
 */
const createPaymentIntent = async () => {
  try {
    isCreatingIntent.value = true

    const data = await $fetch('/api/checkout/create-intent', {
      method: 'POST',
      body: {
        amount: cart.value.total,
        currency: 'eur',
        metadata: {
          customerEmail: formData.customerEmail,
          customerName: formData.customerName,
          items: JSON.stringify(cart.value.items.map(item => ({
            sessionId: item.sessionId,
            bookTitle: item.bookTitle,
            childName: item.childName,
            quantity: item.quantity,
            price: item.price,
          }))),
        },
      },
    })

    if (!data?.clientSecret) {
      throw new Error('No se recibió client secret')
    }

    clientSecret.value = data.clientSecret
    paymentIntentId.value = data.paymentIntentId
    showPaymentForm.value = true

    // Scroll to payment form
    await nextTick()
    const paymentSection = document.getElementById('payment-section')
    paymentSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  } catch (err: any) {
    console.error('[Checkout] Error al crear Payment Intent:', err)
    toast.error('Error', err.message || 'No se pudo iniciar el proceso de pago')
  } finally {
    isCreatingIntent.value = false
  }
}

/**
 * Handle initial form validation and create payment intent
 */
const handlePreparePayment = async () => {
  // Validar formulario
  if (!validateForm()) {
    toast.error('Formulario incompleto', 'Por favor, corrige los errores antes de continuar')

    // Scroll to first error
    const firstError = Object.keys(errors.value)[0]
    if (firstError) {
      const element = document.querySelector(`[id*="${firstError}"]`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  // Crear Payment Intent
  await createPaymentIntent()
}

/**
 * Process payment with Stripe
 */
const handleProcessPayment = async () => {
  if (!stripePaymentRef.value) {
    toast.error('Error', 'Formulario de pago no disponible')
    return
  }

  if (!paymentIntentId.value) {
    toast.error('Error', 'No hay un intento de pago activo')
    return
  }

  try {
    isProcessingPayment.value = true

    // Procesar pago
    const result = await stripePaymentRef.value.processPayment()

    if (!result.success) {
      // Redirigir a página de error con detalles
      const errorCode = result.errorCode || 'unknown'
      const errorMessage = result.error || 'No se pudo procesar el pago'

      console.error('[Checkout] Payment failed:', { errorCode, errorMessage })

      await router.push({
        path: `/order/${paymentIntentId.value}/failed`,
        query: {
          error: errorMessage,
          code: errorCode,
        },
      })
      return
    }

    // Pago exitoso! Confirmar orden en Strapi
    toast.success('¡Pago exitoso!', 'Procesando tu pedido...')

    try {
      // Confirmar orden en Strapi
      const confirmResult = await $fetch('/api/checkout/confirm', {
        method: 'POST',
        body: {
          paymentIntentId: result.paymentIntentId,
          formData,
          cartItems: cart.value.items,
          total: cart.value.total,
        },
      })

      if (!confirmResult.success) {
        throw new Error('No se pudo confirmar la orden')
      }

      console.log('[Checkout] Orden confirmada:', confirmResult.order)

      // Navegar a página de éxito con el orderId
      await router.push(`/order/${confirmResult.order.id}/success`)
    } catch (confirmErr: any) {
      console.error('[Checkout] Error al confirmar orden:', confirmErr)
      toast.error('Error', 'El pago fue exitoso pero no se pudo crear la orden. Contacta soporte.')

      // Aún así navegar a success con el paymentIntentId para que el usuario sepa que pagó
      await router.push(`/order/${result.paymentIntentId}/success`)
    }

  } catch (err: any) {
    console.error('[Checkout] Error inesperado al procesar pago:', err)

    // Redirigir a página de error
    await router.push({
      path: `/order/${paymentIntentId.value}/failed`,
      query: {
        error: err.message || 'Error inesperado al procesar el pago',
        code: 'processing_error',
      },
    })
  } finally {
    isProcessingPayment.value = false
  }
}

/**
 * Update form field
 */
const updateFormData = (updates: any) => {
  Object.assign(formData, updates)
}
</script>

<template>
  <div class="checkout-page">
    <!-- Header -->
    <header class="checkout-header">
      <div class="container">
        <NuxtLink
          to="/cart"
          class="back-button"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span class="ml-2">Volver al carrito</span>
        </NuxtLink>

        <h1 class="checkout-title">Finalizar pedido</h1>

        <div class="header-spacer" />
      </div>
    </header>

    <!-- Main content -->
    <main class="checkout-main">
      <div class="container">
        <div class="checkout-grid">
          <!-- Checkout Form -->
          <div class="form-column">
            <CheckoutForm
              :form-data="formData"
              :is-authenticated="isAuthenticated"
              :get-field-error="getFieldError"
              :validate-field="validateField"
              @update:form-data="updateFormData"
              @toggle:same-as-billing="toggleSameAsBilling"
            />

            <!-- Payment Section (shown after form validation) -->
            <Transition name="slide-down">
              <section
                v-if="showPaymentForm && clientSecret"
                id="payment-section"
                class="payment-section"
              >
                <h2 class="section-title">
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Método de pago
                </h2>

                <StripePayment
                  ref="stripePaymentRef"
                  :client-secret="clientSecret"
                  :amount="cart.total"
                />

                <button
                  class="btn-pay"
                  :disabled="isProcessing"
                  @click="handleProcessPayment"
                >
                  <div
                    v-if="isProcessingPayment"
                    class="spinner"
                  />
                  <template v-else>
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span>Pagar {{ formatPrice(cart.total) }}</span>
                  </template>
                </button>
              </section>
            </Transition>
          </div>

          <!-- Order Summary (Sticky on desktop) -->
          <div class="summary-column">
            <OrderSummary
              :cart="cart"
              :is-processing="isProcessing"
              @submit="showPaymentForm ? handleProcessPayment() : handlePreparePayment()"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.checkout-page {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #faf5ff, #fce7f3, #eff6ff);
}

/* Header */
.checkout-header {
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 20;
}

.checkout-header .container {
  max-width: 80rem;
  margin-left: auto;
  margin-right: auto;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.back-button {
  display: flex;
  align-items: center;
  color: #4b5563;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
  padding: 0.5rem;
  margin: -0.5rem;
  border-radius: 0.5rem;
}

.back-button:hover {
  color: #9333ea;
  background-color: #f3e8ff;
  transform: translateX(-4px);
}

.checkout-title {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(to right, #9333ea, #db2777);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  flex: 1;
  text-align: center;
}

@media (min-width: 768px) {
  .checkout-title {
    font-size: 1.5rem;
  }
}

.header-spacer {
  width: 100px;
}

/* Main content */
.checkout-main {
  padding-top: 2rem;
  padding-bottom: 4rem;
}

@media (min-width: 768px) {
  .checkout-main {
    padding-top: 3rem;
  }
}

.container {
  max-width: 80rem;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

.checkout-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .checkout-grid {
    grid-template-columns: 1fr 400px;
  }
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.summary-column {
  height: fit-content;
}

/* Payment Section */
.payment-section {
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 2px solid #9333ea;
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.15);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.btn-pay {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  margin-top: 1.5rem;
  background: linear-gradient(to right, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-pay:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.btn-pay:active:not(:disabled) {
  transform: translateY(0);
}

.btn-pay:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 9999px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.4s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
