<script setup lang="ts">
import CartItem from '~/components/cart/CartItem.vue'
import CartSummary from '~/components/cart/CartSummary.vue'
import EmptyCart from '~/components/cart/EmptyCart.vue'

// Meta tags
useHead({
  title: 'Carrito de Compras | Mask',
  meta: [
    { name: 'description', content: 'Tu carrito de compras de libros personalizados' },
  ],
})

// Cart composable
const {
  cart,
  cartItems,
  isEmpty,
  removeItem,
  incrementQuantity,
  decrementQuantity,
  clearCart,
} = useCart()

// Confirm dialog state
const showClearDialog = ref(false)

const handleClearCart = () => {
  showClearDialog.value = true
}

const confirmClearCart = () => {
  clearCart()
  showClearDialog.value = false
}
</script>

<template>
  <div class="cart-page">
    <!-- Header -->
    <header class="cart-header">
      <div class="container">
        <NuxtLink
          to="/"
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
          <span class="ml-2">Seguir comprando</span>
        </NuxtLink>

        <h1 class="cart-title">
          <svg
            class="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>Carrito de compras</span>
        </h1>

        <button
          v-if="!isEmpty"
          class="clear-button"
          @click="handleClearCart"
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
          <span class="hidden md:inline ml-2">Vaciar carrito</span>
        </button>
      </div>
    </header>

    <!-- Main content -->
    <main class="cart-main">
      <div class="container">
        <!-- Empty State -->
        <EmptyCart v-if="isEmpty" />

        <!-- Cart with items -->
        <div
          v-else
          class="cart-grid"
        >
          <!-- Cart Items -->
          <div class="cart-items">
            <div class="items-header">
              <h2 class="items-title">
                {{ cart.totalItems }} {{ cart.totalItems === 1 ? 'artículo' : 'artículos' }}
              </h2>
            </div>

            <TransitionGroup
              name="list"
              tag="div"
              class="items-list"
            >
              <CartItem
                v-for="item in cartItems"
                :key="item.id"
                :item="item"
                @remove="removeItem"
                @increment-quantity="incrementQuantity"
                @decrement-quantity="decrementQuantity"
              />
            </TransitionGroup>
          </div>

          <!-- Cart Summary (Sticky on desktop) -->
          <div class="cart-summary-container">
            <CartSummary :cart="cart" />
          </div>
        </div>
      </div>
    </main>

    <!-- Confirm Clear Dialog -->
    <ConfirmDialog
      v-model="showClearDialog"
      title="¿Vaciar carrito?"
      message="¿Estás seguro de que deseas eliminar todos los artículos del carrito? Esta acción no se puede deshacer."
      confirm-text="Vaciar"
      cancel-text="Cancelar"
      type="danger"
      @confirm="confirmClearCart"
    />
  </div>
</template>

<style scoped>
.cart-page {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #faf5ff, #fce7f3, #eff6ff);
}

/* Header */
.cart-header {
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 20;
}

.cart-header .container {
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

.cart-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(to right, #9333ea, #db2777);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  flex: 1;
}

@media (min-width: 768px) {
  .cart-title {
    font-size: 1.5rem;
  }
}

.clear-button {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: transparent;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-button:hover {
  background-color: #fee2e2;
  border-color: #dc2626;
}

/* Main content */
.cart-main {
  padding-top: 2rem;
  padding-bottom: 4rem;
}

@media (min-width: 768px) {
  .cart-main {
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

.cart-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .cart-grid {
    grid-template-columns: 1fr 400px;
  }
}

/* Cart Items */
.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.items-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.items-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Cart Summary Container */
.cart-summary-container {
  height: fit-content;
}

/* List Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
