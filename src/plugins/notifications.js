import { reactive } from 'vue'

// ── Estado compartido a nivel de módulo ───────────────────────────────────
export const toastState = reactive({ items: [] })
export const confirmState = reactive({
  visible: false, title: '', message: '', resolver: null,
})

// ── Toast ─────────────────────────────────────────────────────────────────
const _add = (message, type, duration = 3500) => {
  const id = Date.now() + Math.random()
  toastState.items.push({ id, message, type })
  setTimeout(() => {
    const idx = toastState.items.findIndex(i => i.id === id)
    if (idx !== -1) toastState.items.splice(idx, 1)
  }, duration)
}

export const toast = {
  success: (msg) => _add(msg, 'success'),
  error:   (msg) => _add(msg, 'error'),
  info:    (msg) => _add(msg, 'info'),
  warning: (msg) => _add(msg, 'warning'),
}

// ── Confirm (Promise-based) ────────────────────────────────────────────────
export const confirm = (message, title = 'Confirmar acción') =>
  new Promise(resolve => {
    confirmState.message  = message
    confirmState.title    = title
    confirmState.visible  = true
    confirmState.resolver = resolve
  })

export const confirmAccept = () => {
  confirmState.visible = false
  confirmState.resolver?.(true)
  confirmState.resolver = null
}

export const confirmCancel = () => {
  confirmState.visible = false
  confirmState.resolver?.(false)
  confirmState.resolver = null
}

// ── Plugin Vue ────────────────────────────────────────────────────────────
export const NotificationsPlugin = {
  install(app) {
    app.config.globalProperties.$toast   = toast
    app.config.globalProperties.$confirm = confirm
  },
}