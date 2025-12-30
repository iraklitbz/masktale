<script setup lang="ts">
import type { Cart } from '~/types/cart'
import { formatPrice } from '~/config/products'

const props = defineProps<{
  cart: Cart
  isProcessing?: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <div class="order-summary">
    <h2 class="summary-title">Resumen del pedido</h2>

    <!-- Items List -->
    <div class="items-section">
      <div
        v-for="item in cart.items"
        :key="item.id"
        class="item-row"
      >
        <div class="item-info">
          <p class="item-title">{{ item.bookTitle }}</p>
          <p class="item-details">{{ item.childName }} × {{ item.quantity }}</p>
        </div>
        <p class="item-price">{{ formatPrice(item.price * item.quantity) }}</p>
      </div>
    </div>

    <div class="summary-divider" />

    <!-- Price Breakdown -->
    <div class="summary-content">
      <!-- Subtotal -->
      <div class="summary-row">
        <span class="row-label">Subtotal</span>
        <span class="row-value">{{ formatPrice(cart.subtotal) }}</span>
      </div>

      <!-- Shipping -->
      <div class="summary-row">
        <span class="row-label">Gastos de envío</span>
        <span class="row-value">{{ formatPrice(cart.shipping) }}</span>
      </div>

      <!-- Tax -->
      <div class="summary-row">
        <span class="row-label">IVA (21%)</span>
        <span class="row-value">{{ formatPrice(cart.tax) }}</span>
      </div>

      <!-- Divider -->
      <div class="summary-divider-small" />

      <!-- Total -->
      <div class="summary-row summary-total">
        <span class="row-label-total">Total</span>
        <span class="row-value-total">{{ formatPrice(cart.total) }}</span>
      </div>
    </div>

    <!-- Payment Button -->
    <button
      class="btn-payment"
      :disabled="isProcessing"
      @click="emit('submit')"
    >
      <div
        v-if="isProcessing"
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
        <span>{{ isProcessing ? 'Procesando...' : 'Completar pedido' }}</span>
      </template>
    </button>

    <!-- Security Note -->
    <div class="security-note">
      <svg
        class="w-4 h-4 text-green-500 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
      <p class="security-text">
        Pago seguro. Tus datos están protegidos con encriptación SSL.
      </p>
    </div>

    <!-- Payment Methods -->
    <div class="payment-methods">
      <p class="methods-title">Aceptamos:</p>
      <div class="methods-icons">
        <div class="method-icon">💳 Visa</div>
        <div class="method-icon">💳 Mastercard</div>
        <div class="method-icon">💳 Amex</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-summary {
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 6rem;
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
}

.summary-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
}

/* Items Section */
.items-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
}

.item-info {
  flex: 1;
}

.item-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.25;
}

.item-details {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.item-price {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
}

/* Summary Content */
.summary-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.row-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.row-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.summary-divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 1rem 0;
}

.summary-divider-small {
  height: 1px;
  background-color: #e5e7eb;
  margin: 0.5rem 0;
}

.summary-total {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 2px solid #e5e7eb;
}

.row-label-total {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
}

.row-value-total {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #9333ea, #ec4899);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

/* Payment Button */
.btn-payment {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  margin-top: 1.5rem;
  background: linear-gradient(to right, #9333ea, #7e22ce);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
}

.btn-payment:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(147, 51, 234, 0.4);
}

.btn-payment:active:not(:disabled) {
  transform: translateY(0);
}

.btn-payment:disabled {
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

/* Security Note */
.security-note {
  display: flex;
  align-items: start;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #f0fdf4;
  border-radius: 0.5rem;
  border: 1px solid #bbf7d0;
}

.security-text {
  font-size: 0.75rem;
  color: #166534;
  line-height: 1.5;
}

/* Payment Methods */
.payment-methods {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.methods-title {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.methods-icons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.method-icon {
  font-size: 0.625rem;
  padding: 0.25rem 0.5rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  color: #4b5563;
}
</style>
