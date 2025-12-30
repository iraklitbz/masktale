<script setup lang="ts">
import type { Cart } from '~/types/cart'
import { formatPrice } from '~/config/products'

const props = defineProps<{
  cart: Cart
}>()

const router = useRouter()

const goToCheckout = () => {
  router.push('/checkout')
}
</script>

<template>
  <div class="cart-summary">
    <h2 class="summary-title">Resumen del pedido</h2>

    <div class="summary-content">
      <!-- Subtotal -->
      <div class="summary-row">
        <span class="row-label">Subtotal ({{ cart.totalItems }} {{ cart.totalItems === 1 ? 'libro' : 'libros' }})</span>
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
      <div class="summary-divider" />

      <!-- Total -->
      <div class="summary-row summary-total">
        <span class="row-label-total">Total</span>
        <span class="row-value-total">{{ formatPrice(cart.total) }}</span>
      </div>
    </div>

    <!-- Checkout Button -->
    <button
      class="btn-checkout"
      @click="goToCheckout"
    >
      <span>Proceder al pago</span>
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
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>

    <!-- Info -->
    <div class="summary-info">
      <svg
        class="w-5 h-5 text-green-500 flex-shrink-0"
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
      <p class="info-text">
        Pago seguro con Stripe. Tus datos están protegidos.
      </p>
    </div>
  </div>
</template>

<style scoped>
.cart-summary {
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 6rem;
}

.summary-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  margin: 0.5rem 0;
}

.summary-total {
  margin-top: 0.5rem;
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

.btn-checkout {
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

.btn-checkout:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(147, 51, 234, 0.4);
}

.btn-checkout:active {
  transform: translateY(0);
}

.summary-info {
  display: flex;
  align-items: start;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f0fdf4;
  border-radius: 0.5rem;
  border: 1px solid #bbf7d0;
}

.info-text {
  font-size: 0.75rem;
  color: #166534;
  line-height: 1.5;
}
</style>
