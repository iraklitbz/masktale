<script setup lang="ts">
import type { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js'

const props = defineProps<{
  clientSecret: string
  amount: number
}>()

const emit = defineEmits<{
  success: [paymentIntentId: string]
  error: [error: string]
}>()

const { $stripe } = useNuxtApp()
const stripe = $stripe as Stripe | null

// Refs
const cardElement = ref<StripeCardElement | null>(null)
const elements = ref<StripeElements | null>(null)
const isProcessing = ref(false)
const error = ref<string | null>(null)
const isReady = ref(false)

/**
 * Inicializar Stripe Elements
 */
onMounted(async () => {
  if (!stripe) {
    error.value = 'Stripe no está disponible'
    return
  }

  if (!props.clientSecret) {
    error.value = 'Client secret no disponible'
    return
  }

  try {
    // Crear Elements instance
    elements.value = stripe.elements({
      clientSecret: props.clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#9333ea',
          colorBackground: '#ffffff',
          colorText: '#111827',
          colorDanger: '#dc2626',
          fontFamily: 'system-ui, sans-serif',
          borderRadius: '8px',
        },
      },
    })

    // Crear Payment Element (soporta múltiples métodos de pago)
    const paymentElement = elements.value.create('payment')
    paymentElement.mount('#payment-element')

    paymentElement.on('ready', () => {
      isReady.value = true
    })

    paymentElement.on('change', (event) => {
      if (event.error) {
        error.value = event.error.message
      } else {
        error.value = null
      }
    })
  } catch (err: any) {
    console.error('[StripePayment] Error al inicializar:', err)
    error.value = 'Error al cargar el formulario de pago'
  }
})

/**
 * Procesar el pago
 */
const processPayment = async (): Promise<{
  success: boolean
  paymentIntentId?: string
  error?: string
  errorCode?: string
}> => {
  if (!stripe || !elements.value) {
    const errorMsg = 'Stripe no está inicializado'
    error.value = errorMsg
    return { success: false, error: errorMsg, errorCode: 'stripe_not_initialized' }
  }

  try {
    isProcessing.value = true
    error.value = null

    // Confirmar el pago
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements: elements.value,
      redirect: 'if_required', // No redirigir automáticamente
      confirmParams: {
        return_url: `${window.location.origin}/order/success`,
      },
    })

    if (submitError) {
      error.value = submitError.message || 'Error al procesar el pago'
      const errorCode = submitError.code || submitError.decline_code || 'unknown'
      emit('error', error.value)
      return { success: false, error: error.value, errorCode }
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      emit('success', paymentIntent.id)
      return { success: true, paymentIntentId: paymentIntent.id }
    }

    // Si requiere acción adicional (3D Secure)
    if (paymentIntent && paymentIntent.status === 'requires_action') {
      error.value = 'Se requiere verificación adicional'
      return { success: false, error: error.value, errorCode: 'requires_action' }
    }

    const errorMsg = 'El pago no se pudo completar'
    error.value = errorMsg
    return { success: false, error: errorMsg, errorCode: 'payment_incomplete' }
  } catch (err: any) {
    console.error('[StripePayment] Error al procesar:', err)
    const errorMsg = err.message || 'Error inesperado al procesar el pago'
    error.value = errorMsg
    emit('error', errorMsg)
    return { success: false, error: errorMsg, errorCode: 'processing_error' }
  } finally {
    isProcessing.value = false
  }
}

// Exponer método para uso del padre
defineExpose({
  processPayment,
})
</script>

<template>
  <div class="stripe-payment">
    <!-- Payment Element Container -->
    <div
      id="payment-element"
      class="payment-element-container"
    />

    <!-- Loading State -->
    <div
      v-if="!isReady && !error"
      class="loading-state"
    >
      <div class="spinner" />
      <p>Cargando formulario de pago...</p>
    </div>

    <!-- Error Message -->
    <Transition name="fade">
      <div
        v-if="error"
        class="error-container"
      >
        <svg
          class="w-5 h-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="error-text">{{ error }}</p>
      </div>
    </Transition>

    <!-- Processing State -->
    <Transition name="fade">
      <div
        v-if="isProcessing"
        class="processing-overlay"
      >
        <div class="processing-content">
          <div class="spinner-large" />
          <p class="processing-text">Procesando pago...</p>
          <p class="processing-subtext">Por favor, no cierres esta ventana</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.stripe-payment {
  position: relative;
}

.payment-element-container {
  min-height: 200px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e9d5ff;
  border-top-color: #9333ea;
  border-radius: 9999px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error Container */
.error-container {
  display: flex;
  align-items: start;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
}

.error-text {
  flex: 1;
  font-size: 0.875rem;
  color: #dc2626;
  line-height: 1.5;
}

/* Processing Overlay */
.processing-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.processing-content {
  background-color: white;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 20rem;
}

.spinner-large {
  width: 3rem;
  height: 3rem;
  border: 4px solid #e9d5ff;
  border-top-color: #9333ea;
  border-radius: 9999px;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

.processing-text {
  margin-top: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.processing-subtext {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
