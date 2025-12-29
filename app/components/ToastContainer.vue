<script setup lang="ts">
import type { Toast } from '~/composables/useToast'

const { toasts, remove } = useToast()

const getIcon = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    case 'info':
      return 'ℹ'
    default:
      return 'ℹ'
  }
}

const getColorClasses = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200 text-green-800'
    case 'error':
      return 'bg-red-50 border-red-200 text-red-800'
    case 'warning':
      return 'bg-orange-50 border-orange-200 text-orange-800'
    case 'info':
      return 'bg-blue-50 border-blue-200 text-blue-800'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800'
  }
}

const getIconColorClasses = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return 'bg-green-100 text-green-600'
    case 'error':
      return 'bg-red-100 text-red-600'
    case 'warning':
      return 'bg-orange-100 text-orange-600'
    case 'info':
      return 'bg-blue-100 text-blue-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}
</script>

<template>
  <div class="toast-container">
    <TransitionGroup
      name="toast"
      tag="div"
      class="toast-list"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', getColorClasses(toast.type)]"
      >
        <div class="toast-content">
          <div :class="['toast-icon', getIconColorClasses(toast.type)]">
            {{ getIcon(toast.type) }}
          </div>
          <div class="toast-text">
            <p class="toast-title">{{ toast.title }}</p>
            <p
              v-if="toast.message"
              class="toast-message"
            >
              {{ toast.message }}
            </p>
          </div>
        </div>
        <button
          class="toast-close"
          @click="remove(toast.id)"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  border-width: 1px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  max-width: 24rem;
  width: 100%;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.toast-text {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.25rem;
}

.toast-message {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  margin-bottom: 0;
  line-height: 1.25rem;
  opacity: 0.9;
}

.toast-close {
  flex-shrink: 0;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  opacity: 0.6;
  transition: opacity 0.2s;
  color: currentColor;
}

.toast-close:hover {
  opacity: 1;
}

/* Toast animations */
.toast-enter-active {
  animation: toast-in 0.3s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.2s ease-in;
}

@keyframes toast-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toast-out {
  from {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateX(100%) scale(0.95);
    opacity: 0;
  }
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .toast-container {
    left: 1rem;
    right: 1rem;
  }

  .toast-list {
    align-items: stretch;
  }

  .toast {
    max-width: 100%;
  }
}
</style>
