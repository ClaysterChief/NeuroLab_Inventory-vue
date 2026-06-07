<template>
    <teleport to="body">
        <!-- Toasts -->
        <div class="toast-wrap">
            <transition-group name="toast">
                <div v-for="item in toastState.items" :key="item.id" class="toast" :class="`toast--${item.type}`"
                    @click="remove(item.id)">
                    <span class="toast-icon">{{ icons[item.type] }}</span>
                    <span class="toast-msg">{{ item.message }}</span>
                </div>
            </transition-group>
        </div>

        <!-- Confirm Dialog -->
        <div v-if="confirmState.visible" class="confirm-overlay" @click.self="confirmCancel">
            <div class="confirm-box">
                <h3 class="confirm-title">{{ confirmState.title }}</h3>
                <p class="confirm-msg">{{ confirmState.message }}</p>
                <div class="confirm-actions">
                    <button class="btn-secondary" @click="confirmCancel">Cancelar</button>
                    <button class="btn-primary" @click="confirmAccept">Confirmar</button>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script>
import { toastState, confirmState, confirmAccept, confirmCancel } from '../plugins/notifications'

export default {
    name: 'ToastContainer',
    setup() {
        return { toastState, confirmState, confirmAccept, confirmCancel }
    },
    data() {
        return {
            icons: { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' },
        }
    },
    methods: {
        remove(id) {
            const idx = toastState.items.findIndex(i => i.id === id)
            if (idx !== -1) toastState.items.splice(idx, 1)
        },
    },
}
</script>

<style scoped>
/* ── Toasts ── */
.toast-wrap {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
}

.toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: .7rem 1.1rem;
    border-radius: 10px;
    font-size: .88rem;
    font-weight: 500;
    box-shadow: 0 4px 16px rgba(0, 0, 0, .15);
    pointer-events: all;
    cursor: pointer;
    min-width: 240px;
    max-width: 360px;
}

.toast--success {
    background: #e8f5e9;
    color: #2e7d32;
    border-left: 4px solid #43a047;
}

.toast--error {
    background: #ffebee;
    color: #c62828;
    border-left: 4px solid #e53935;
}

.toast--info {
    background: #e3f2fd;
    color: #1565c0;
    border-left: 4px solid #1e88e5;
}

.toast--warning {
    background: #fff8e1;
    color: #f57f17;
    border-left: 4px solid #ffb300;
}

.toast-icon {
    font-size: 1rem;
    flex-shrink: 0;
}

.toast-msg {
    line-height: 1.4;
}

/* ── Animación ── */
.toast-enter-active {
    transition: all .28s ease;
}

.toast-leave-active {
    transition: all .22s ease;
}

.toast-enter-from {
    opacity: 0;
    transform: translateX(30px);
}

.toast-leave-to {
    opacity: 0;
    transform: translateX(30px);
}

/* ── Confirm ── */
.confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
}

.confirm-box {
    background: #fff;
    border-radius: 14px;
    padding: 1.75rem 2rem;
    max-width: 380px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, .15);
}

.confirm-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: .6rem;
}

.confirm-msg {
    font-size: .9rem;
    color: #555;
    line-height: 1.5;
    margin-bottom: 1.5rem;
}

.confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>