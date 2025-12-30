<script setup lang="ts">
import type { CartItem } from '~/types/cart'
import { formatPrice } from '~/config/products'

const props = defineProps<{
  item: CartItem
}>()

const emit = defineEmits<{
  remove: [sessionId: string]
  incrementQuantity: [sessionId: string]
  decrementQuantity: [sessionId: string]
}>()

const subtotal = computed(() => props.item.price * props.item.quantity)
</script>

<template>
  <div class="cart-item">
    <!-- Cover Image (placeholder for now) -->
    <div class="item-image">
      <div class="image-placeholder">
        <svg
          class="w-12 h-12 text-purple-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
    </div>

    <!-- Item Info -->
    <div class="item-info">
      <h3 class="item-title">{{ item.bookTitle }}</h3>
      <p class="item-child">Personalizado para: <strong>{{ item.childName }}</strong></p>
      <p class="item-price-mobile">{{ formatPrice(item.price) }}</p>
    </div>

    <!-- Quantity Controls -->
    <div class="item-quantity">
      <button
        class="quantity-btn"
        @click="emit('decrementQuantity', item.sessionId)"
        aria-label="Decrementar cantidad"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 12H4"
          />
        </svg>
      </button>

      <span class="quantity-value">{{ item.quantity }}</span>

      <button
        class="quantity-btn"
        @click="emit('incrementQuantity', item.sessionId)"
        aria-label="Incrementar cantidad"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>

    <!-- Price -->
    <div class="item-price">
      <p class="price-label">Precio unitario</p>
      <p class="price-value">{{ formatPrice(item.price) }}</p>
    </div>

    <!-- Subtotal -->
    <div class="item-subtotal">
      <p class="subtotal-label">Subtotal</p>
      <p class="subtotal-value">{{ formatPrice(subtotal) }}</p>
    </div>

    <!-- Remove Button -->
    <button
      class="item-remove"
      @click="emit('remove', item.sessionId)"
      aria-label="Eliminar del carrito"
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
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.cart-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas:
    "image info remove"
    "image quantity remove"
    "image subtotal remove";
  gap: 1rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.cart-item:hover {
  box-shadow: 0 4px 12px 0 rgba(147, 51, 234, 0.15);
}

@media (min-width: 768px) {
  .cart-item {
    grid-template-columns: auto 1fr auto auto auto auto;
    grid-template-areas: "image info quantity price subtotal remove";
    align-items: center;
  }
}

.item-image {
  grid-area: image;
}

.image-placeholder {
  width: 4rem;
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  border-radius: 0.5rem;
  overflow: hidden;
}

.item-info {
  grid-area: info;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.item-child {
  font-size: 0.875rem;
  color: #6b7280;
}

.item-price-mobile {
  font-size: 0.875rem;
  font-weight: 600;
  color: #9333ea;
  margin-top: 0.25rem;
}

@media (min-width: 768px) {
  .item-price-mobile {
    display: none;
  }
}

.item-quantity {
  grid-area: quantity;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 0.25rem;
  width: fit-content;
}

.quantity-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quantity-btn:hover {
  background-color: #9333ea;
  color: white;
  border-color: #9333ea;
}

.quantity-value {
  min-width: 2rem;
  text-align: center;
  font-weight: 600;
  color: #111827;
}

.item-price {
  grid-area: price;
  text-align: right;
  display: none;
}

@media (min-width: 768px) {
  .item-price {
    display: block;
  }
}

.price-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.price-value {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.item-subtotal {
  grid-area: subtotal;
  text-align: right;
}

.subtotal-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

@media (min-width: 768px) {
  .subtotal-label {
    display: none;
  }
}

.subtotal-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #9333ea;
}

.item-remove {
  grid-area: remove;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: transparent;
  border: none;
  border-radius: 0.5rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: start;
}

.item-remove:hover {
  background-color: #fee2e2;
  color: #dc2626;
}
</style>
