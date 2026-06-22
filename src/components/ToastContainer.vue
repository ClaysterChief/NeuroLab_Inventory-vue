<template>
    <teleport to="body">
        <!-- Toasts -->
        <div class="toast-wrap">
            <transition-group name="toast">
                <div v-for="item in toastState.items" :key="item.id" class="toast" :class="`toast--${item.type}`"
                    @click="remove(item.id)">
                    <span class="toast-icon" :class="{ 'toast-icon--success': item.type === 'success' }">
                        {{ icons[item.type] }}
                    </span>
                    <span class="toast-msg">{{ item.message }}</span>
                    <span class="toast-progress"></span>
                </div>
            </transition-group>
        </div>

        <!-- Confirm Dialog -->
        <transition name="confirm-fade">
            <div v-if="confirmState.visible" class="confirm-overlay" @click.self="confirmCancel">
                <transition name="confirm-pop" appear>
                    <div class="confirm-box" v-if="confirmState.visible">
                        <span class="confirm-icon">⚠️</span>
                        <h3 class="confirm-title">{{ confirmState.title }}</h3>
                        <p class="confirm-msg">{{ confirmState.message }}</p>
                        <div class="confirm-actions">
                            <button class="btn-secondary" @click="confirmCancel">Cancelar</button>
                            <button class="btn-primary" @click="confirmAccept">Confirmar</button>
                        </div>
                    </div>
                </transition>
            </div>
        </transition>
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
    position: relative;
    overflow: hidden;
    transition: transform .15s, box-shadow .15s;
}

.toast:hover {
    transform: translateX(-3px);
    box-shadow: 0 6px 20px rgba(0,0,0,.2);
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
    animation: toastShake .4s ease;
}

@keyframes toastShake {
    0%, 100% { transform: translateX(0); }
    25%       { transform: translateX(-4px); }
    75%       { transform: translateX(4px); }
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

.toast-icon--success {
    animation: successPop .4s cubic-bezier(.22,.68,0,1.3) both;
}

@keyframes successPop {
    0%   { transform: scale(.3) rotate(-15deg); opacity: 0; }
    60%  { transform: scale(1.2) rotate(8deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.toast-msg {
    line-height: 1.4;
}

/* Barra de progreso indicando autodesaparición */
.toast-progress {
    position: absolute;
    bottom: 0; left: 0;
    height: 2.5px;
    background: currentColor;
    opacity: .35;
    animation: toastProgress 3.5s linear forwards;
}

@keyframes toastProgress {
    from { width: 100%; }
    to   { width: 0%; }
}

/* ── Animación entrada/salida ── */
.toast-enter-active {
    transition: all .3s cubic-bezier(.22,.68,0,1.2);
}

.toast-leave-active {
    transition: all .22s ease;
    position: absolute;
}

.toast-move {
    transition: transform .25s ease;
}

.toast-enter-from {
    opacity: 0;
    transform: translateX(40px) scale(.9);
}

.toast-leave-to {
    opacity: 0;
    transform: translateX(40px) scale(.9);
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

.confirm-fade-enter-active { transition: opacity .2s ease; }
.confirm-fade-leave-active { transition: opacity .15s ease; }
.confirm-fade-enter-from, .confirm-fade-leave-to { opacity: 0; }

.confirm-pop-enter-active {
    transition: transform .28s cubic-bezier(.22,.68,0,1.3), opacity .22s;
}
.confirm-pop-leave-active {
    transition: transform .15s ease, opacity .15s;
}
.confirm-pop-enter-from {
    opacity: 0;
    transform: scale(.85) translateY(14px);
}
.confirm-pop-leave-to {
    opacity: 0;
    transform: scale(.92);
}

.confirm-box {
    background: #fff;
    border-radius: 14px;
    padding: 1.75rem 2rem;
    max-width: 380px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, .15);
    text-align: center;
}

.confirm-icon {
    font-size: 2rem;
    display: block;
    margin-bottom: .6rem;
    animation: confirmIconWiggle .5s ease .1s both;
}

@keyframes confirmIconWiggle {
    0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
    60%  { transform: scale(1.15) rotate(8deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
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
    justify-content: center;
    gap: 10px;
}

/* ── Responsive ── */
@media (max-width: 480px) {
    .toast-wrap {
        bottom: 1rem;
        right: 1rem;
        left: 1rem;
    }
    .toast {
        min-width: 0;
        max-width: 100%;
        width: 100%;
    }
    .confirm-box {
        padding: 1.5rem 1.25rem;
    }
    .confirm-actions {
        flex-direction: column-reverse;
    }
    .confirm-actions button {
        width: 100%;
    }
}
</style>
