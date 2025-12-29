<template>
  <div class="carousel-skeleton">
    <!-- Main skeleton card -->
    <div class="skeleton-card">
      <!-- Image skeleton -->
      <div class="skeleton-image">
        <div class="skeleton-shimmer" />
      </div>

      <!-- Info overlay skeleton -->
      <div class="skeleton-overlay">
        <div class="skeleton-text skeleton-text-sm" />
        <div class="skeleton-text skeleton-text-xs" />
      </div>
    </div>

    <!-- Navigation buttons -->
    <div class="skeleton-nav skeleton-nav-prev">
      <div class="skeleton-button" />
    </div>
    <div class="skeleton-nav skeleton-nav-next">
      <div class="skeleton-button" />
    </div>

    <!-- Dots indicators -->
    <div class="skeleton-dots">
      <div
        v-for="i in 5"
        :key="i"
        class="skeleton-dot"
      />
    </div>

    <!-- Regenerate button skeleton -->
    <div class="skeleton-regenerate-btn">
      <div class="skeleton-button-text" />
    </div>
  </div>
</template>

<style scoped>
.carousel-skeleton {
  position: relative;
  max-width: 56rem;
  margin: 0 auto;
}

.skeleton-card {
  position: relative;
  background-color: white;
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.skeleton-image {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
  background-size: 200% 100%;
  overflow: hidden;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.6) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.skeleton-overlay {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.skeleton-text {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 0.5rem;
  height: 1.5rem;
}

.skeleton-text-sm {
  width: 5rem;
}

.skeleton-text-xs {
  width: 3.5rem;
}

.skeleton-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.skeleton-nav-prev {
  left: 1rem;
}

.skeleton-nav-next {
  right: 1rem;
}

.skeleton-button {
  width: 3rem;
  height: 3rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 9999px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.skeleton-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.skeleton-dot {
  width: 0.625rem;
  height: 0.625rem;
  background-color: #d1d5db;
  border-radius: 9999px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.skeleton-dot:nth-child(3) {
  animation-delay: 0.4s;
}

.skeleton-dot:nth-child(4) {
  animation-delay: 0.6s;
}

.skeleton-dot:nth-child(5) {
  animation-delay: 0.8s;
}

.skeleton-regenerate-btn {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.skeleton-button-text {
  width: 8rem;
  height: 2.5rem;
  background-color: #e5e7eb;
  border-radius: 0.5rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@media (max-width: 768px) {
  .skeleton-nav {
    display: none;
  }

  .skeleton-image {
    aspect-ratio: 1;
  }
}
</style>
