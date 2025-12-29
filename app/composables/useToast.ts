import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

const toasts = ref<Toast[]>([])
let toastId = 0

export function useToast() {
  const show = (
    type: ToastType,
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    const id = `toast-${++toastId}`
    const toast: Toast = { id, type, title, message, duration }

    toasts.value.push(toast)

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  const remove = (id: string) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (title: string, message?: string, duration?: number) => {
    return show('success', title, message, duration)
  }

  const error = (title: string, message?: string, duration?: number) => {
    return show('error', title, message, duration)
  }

  const warning = (title: string, message?: string, duration?: number) => {
    return show('warning', title, message, duration)
  }

  const info = (title: string, message?: string, duration?: number) => {
    return show('info', title, message, duration)
  }

  const clear = () => {
    toasts.value = []
  }

  return {
    toasts,
    show,
    remove,
    success,
    error,
    warning,
    info,
    clear,
  }
}
