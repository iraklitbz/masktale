<script setup lang="ts">
const { itemCount } = useCart()
const router = useRouter()

const goToCart = () => {
  router.push('/cart')
}
</script>

<template>
  <button
    class="cart-icon-button"
    @click="goToCart"
    :aria-label="`Carrito de compras con ${itemCount} items`"
  >
    <!-- Cart Icon -->
    <svg
      class="cart-icon"
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

    <!-- Badge with item count -->
    <Transition name="badge">
      <span
        v-if="itemCount > 0"
        class="cart-badge"
      >
        {{ itemCount > 9 ? '9+' : itemCount }}
      </span>
    </Transition>
  </button>
</template>

<style scoped>
.cart-icon-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background-color: transparent;
  color: #4b5563;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cart-icon-button:hover {
  background-color: #f3e8ff;
  color: #9333ea;
  transform: scale(1.05);
}

.cart-icon-button:active {
  transform: scale(0.95);
}

.cart-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.cart-badge {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.25rem;
  background: linear-gradient(135deg, #ec4899, #f97316);
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  border-radius: 9999px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Badge animations */
.badge-enter-active {
  animation: bounceIn 0.5s ease;
}

.badge-leave-active {
  animation: bounceOut 0.3s ease;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounceOut {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
