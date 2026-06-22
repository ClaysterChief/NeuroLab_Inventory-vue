<template>
  <div class="login-page">
    <!-- Panel izquierdo: logo + nombre -->
    <div class="login-brand">
      <div class="brand-particles" aria-hidden="true">
        <span v-for="n in 5" :key="n" class="brand-particle" :style="particleStyle(n)"></span>
      </div>

      <div class="brand-logo">
        <img src="@/assets/logo.png" alt="NeuroLab" class="logo-img" @error="logoError = true" v-if="!logoError" />
        <div class="logo-fallback" v-else>
          <span class="logo-rat">🐀</span>
        </div>
      </div>
      <h1 class="brand-name">NeuroLab Inventory</h1>
      <p class="brand-sub">Sistema de gestión de inventario<br>para animales de laboratorio</p>
    </div>

    <!-- Panel derecho: formulario -->
    <div class="login-form-panel">
      <div class="login-card">
        <h2 class="login-title">Iniciar sesión</h2>

        <form @submit.prevent="handleLogin" novalidate>
          <div class="field" :style="{ animationDelay: '.05s' }">
            <label for="username">Usuario</label>
            <input
              id="username"
              v-model.trim="form.username"
              type="text"
              placeholder="Nombre de usuario"
              autocomplete="username"
              :disabled="loading"
              required
            />
          </div>

          <div class="field" :style="{ animationDelay: '.12s' }">
            <label for="password">Contraseña</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="Contraseña"
              autocomplete="current-password"
              :disabled="loading"
              required
            />
          </div>

          <transition name="error-pop">
            <p v-if="errorMsg" class="login-error shake-error" :key="errorKey" role="alert">
              ⚠️ {{ errorMsg }}
            </p>
          </transition>

          <button type="submit" class="btn-login" :disabled="loading" :class="{ 'btn-login--success': loginSuccess }">
            <span v-if="loading" class="spinner"></span>
            <span v-else-if="loginSuccess" class="success-check success-pop">✓</span>
            <span v-else>Iniciar sesión</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'HomeView',
  data() {
    return {
      form: { username: '', password: '' },
      errorMsg: null,
      errorKey: 0,
      loading: false,
      loginSuccess: false,
      logoError: false,
    }
  },
  methods: {
    ...mapActions(['login']),

    particleStyle(n) {
      const positions = [
        { top: '15%', left: '10%', size: '5px', delay: '0s',   dur: '4.5s' },
        { top: '70%', left: '15%', size: '7px', delay: '.6s',  dur: '5s'   },
        { top: '30%', left: '80%', size: '4px', delay: '1.2s', dur: '3.8s' },
        { top: '80%', left: '75%', size: '6px', delay: '.3s',  dur: '5.5s' },
        { top: '50%', left: '45%', size: '5px', delay: '1.8s', dur: '4s'   },
      ]
      const p = positions[n - 1] || positions[0]
      return {
        width: p.size, height: p.size,
        top: p.top, left: p.left,
        animationDelay: p.delay,
        animationDuration: p.dur,
      }
    },

    async handleLogin() {
      this.errorMsg = null

      if (!this.form.username || !this.form.password) {
        this.errorMsg = 'Por favor completa todos los campos.'
        this.errorKey++
        return
      }

      this.loading = true
      try {
        await this.login({ username: this.form.username, password: this.form.password })
        this.loading = false
        this.loginSuccess = true
        // Pequeña pausa para mostrar el check antes de redirigir
        setTimeout(() => {
          this.$router.push({ name: 'dashboard' })
        }, 450)
      } catch (err) {
        this.loading = false
        if (err.response?.status === 401) {
          this.errorMsg = 'Usuario o contraseña incorrectos.'
        } else if (err.code === 'ECONNABORTED' || !err.response) {
          this.errorMsg = 'No se pudo conectar con el servidor. Verifica que Django esté activo.'
        } else {
          this.errorMsg = 'Ocurrió un error inesperado. Inténtalo de nuevo.'
        }
        this.errorKey++
      }
    },
  },
}
</script>

<style scoped>
/* ── Layout de dos paneles ─────────────────────────────────────────────── */
.login-page {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(160deg, #ffffff 45%, #c5cae9 100%);
}

/* ── Panel izquierdo ────────────────────────────────────────────────────── */
.login-brand {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  gap: 1.25rem;
  position: relative;
  overflow: hidden;
  animation: brandFadeIn .5s ease both;
}

@keyframes brandFadeIn {
  from { opacity: 0; transform: translateX(-16px); }
  to   { opacity: 1; transform: translateX(0); }
}

.brand-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.brand-particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(128,32,29,.12);
  animation: brandFloat var(--dur,4s) ease-in-out infinite alternate;
}

@keyframes brandFloat {
  from { transform: translateY(0); opacity: .4; }
  to   { transform: translateY(-22px); opacity: .9; }
}

.brand-logo {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 8px solid #80201d;
  background: #f7f7f7;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  z-index: 1;
  animation: logoPop .55s cubic-bezier(.22,.68,0,1.3) .1s both,
             logoFloat 3.5s ease-in-out 1s infinite;
}

@keyframes logoPop {
  from { opacity: 0; transform: scale(.5) rotate(-20deg); }
  to   { opacity: 1; transform: scale(1) rotate(0deg); }
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-rat {
  font-size: 80px;
  line-height: 1;
  display: inline-block;
  animation: logoRatSniff 2.4s ease-in-out infinite;
}

@keyframes logoRatSniff {
  0%, 100% { transform: rotate(-3deg); }
  50%      { transform: rotate(3deg); }
}

.brand-name {
  font-size: 2rem;
  font-weight: 600;
  color: #1a1a2e;
  text-align: center;
  margin: 0;
  position: relative;
  z-index: 1;
  animation: fadeSlideUp .5s ease .25s both;
}

.brand-sub {
  color: #555;
  text-align: center;
  line-height: 1.6;
  font-size: 0.95rem;
  margin: 0;
  position: relative;
  z-index: 1;
  animation: fadeSlideUp .5s ease .35s both;
}

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Panel derecho ──────────────────────────────────────────────────────── */
.login-form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 2.5rem 2rem;
  animation: cardPop .5s cubic-bezier(.22,.68,0,1.2) .15s both;
}

@keyframes cardPop {
  from { opacity: 0; transform: scale(.92) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.login-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 1.75rem 0;
  text-align: center;
}

/* ── Campos ─────────────────────────────────────────────────────────────── */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 1.1rem;
  animation: fadeSlideUp .4s ease both;
}

.field label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #444;
}

.field input {
  padding: 0.65rem 0.9rem;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow .2s;
  outline: none;
  color: #1a1a2e;
}

.field input:focus {
  border-color: #80201d;
  box-shadow: 0 0 0 3px rgba(128,32,29,.1);
}

.field input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

/* ── Error ─────────────────────────────────────────────────────────────── */
.login-error {
  color: #c62828;
  font-size: 0.85rem;
  background: #ffebee;
  border: 1px solid #ef9a9a;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin-bottom: 1rem;
}

.error-pop-enter-active { transition: opacity .2s ease, transform .2s ease; }
.error-pop-leave-active { transition: opacity .15s ease; }
.error-pop-enter-from { opacity: 0; transform: translateY(-6px); }
.error-pop-leave-to   { opacity: 0; }

/* ── Botón ──────────────────────────────────────────────────────────────── */
.btn-login {
  width: 100%;
  padding: 0.75rem;
  background: #80201d;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s, transform .12s, box-shadow .2s;
  margin-top: 0.5rem;
  position: relative;
  overflow: hidden;
}

/* Shimmer idle invitando al clic */
.btn-login:not(:disabled)::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent);
  animation: btnShimmer 3.2s ease 1.5s infinite;
}

@keyframes btnShimmer {
  0%   { left: -100%; }
  100% { left: 200%; }
}

.btn-login:hover:not(:disabled) {
  background: #9e2a26;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(128,32,29,.3);
}

.btn-login:active:not(:disabled) {
  transform: scale(.98);
}

.btn-login:disabled {
  background: #c89090;
  cursor: not-allowed;
}

.btn-login--success {
  background: #2e7d32 !important;
}

.success-check {
  font-size: 1.2rem;
  font-weight: 700;
}

/* ── Spinner ─────────────────────────────────────────────────────────────── */
.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Responsivo ─────────────────────────────────────────────────────────── */
@media (max-width: 700px) {
  .login-page {
    flex-direction: column;
  }
  .login-brand {
    padding: 2.5rem 1rem 1rem;
  }
  .brand-logo {
    width: 120px;
    height: 120px;
  }
  .logo-rat { font-size: 54px; }
  .brand-name {
    font-size: 1.5rem;
  }
}
</style>
