<script setup lang="ts">
const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="empty-cart">
    <div class="empty-content">
      <!-- Cart Icon -->
      <div class="empty-icon">
        <svg
          class="w-24 h-24 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>

      <!-- Message -->
      <h2 class="empty-title">Tu carrito está vacío</h2>
      <p class="empty-description">
        Aún no has añadido ningún libro personalizado a tu carrito.
        ¡Empieza a crear historias mágicas para tus pequeños!
      </p>

      <!-- CTA Button -->
      <button
        class="btn-create"
        @click="goHome"
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
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span>Crear mi primer libro</span>
      </button>

      <!-- Features -->
      <div class="features">
        <div class="feature">
          <svg
            class="feature-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          <div>
            <h3 class="feature-title">Personalización única</h3>
            <p class="feature-text">Cada libro es generado con IA para tu hijo/a</p>
          </div>
        </div>

        <div class="feature">
          <svg
            class="feature-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 class="feature-title">Listo en minutos</h3>
            <p class="feature-text">Genera y descarga tu libro en pocos pasos</p>
          </div>
        </div>

        <div class="feature">
          <svg
            class="feature-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <div>
            <h3 class="feature-title">Hecho con amor</h3>
            <p class="feature-text">Historias que crearán recuerdos inolvidables</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.empty-cart {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem 1rem;
}

.empty-content {
  max-width: 32rem;
  text-align: center;
}

.empty-icon {
  margin-bottom: 1.5rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.75rem;
}

.empty-description {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.625;
  margin-bottom: 2rem;
}

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
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

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(147, 51, 234, 0.4);
}

.btn-create:active {
  transform: translateY(0);
}

.features {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 3rem;
  text-align: left;
}

.feature {
  display: flex;
  align-items: start;
  gap: 1rem;
  padding: 1rem;
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.feature:hover {
  box-shadow: 0 4px 12px 0 rgba(147, 51, 234, 0.15);
  transform: translateY(-2px);
}

.feature-icon {
  width: 2rem;
  height: 2rem;
  color: #9333ea;
  flex-shrink: 0;
}

.feature-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.feature-text {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}
</style>
