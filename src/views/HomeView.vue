<template>
  <div class="login-page">
    <!-- Panel izquierdo: logo + nombre -->
    <div class="login-brand">
      <div class="brand-logo">
        <img src="@/assets/logo.png" alt="NeuroLab" class="logo-img" @error="logoError = true" v-if="!logoError" />
        <div class="logo-fallback" v-else>🐀</div>
      </div>
      <h1 class="brand-name">NeuroLab Inventory</h1>
      <p class="brand-sub">Sistema de gestión de inventario<br>para animales de laboratorio</p>
    </div>

    <!-- Panel derecho: formulario -->
    <div class="login-form-panel">
      <div class="login-card">
        <h2 class="login-title">Iniciar sesión</h2>

        <form @submit.prevent="handleLogin" novalidate>
          <div class="field">
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

          <div class="field">
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

          <p v-if="errorMsg" class="login-error" role="alert">
            {{ errorMsg }}
          </p>

          <button type="submit" class="btn-login" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
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
      loading: false,
      logoError: false,
    }
  },
  methods: {
    ...mapActions(['login']),

    async handleLogin() {
      this.errorMsg = null

      if (!this.form.username || !this.form.password) {
        this.errorMsg = 'Por favor completa todos los campos.'
        return
      }

      this.loading = true
      try {
        await this.login({ username: this.form.username, password: this.form.password })
        this.$router.push({ name: 'dashboard' })
      } catch (err) {
        if (err.response?.status === 401) {
          this.errorMsg = 'Usuario o contraseña incorrectos.'
        } else if (err.code === 'ECONNABORTED' || !err.response) {
          this.errorMsg = 'No se pudo conectar con el servidor. Verifica que Django esté activo.'
        } else {
          this.errorMsg = 'Ocurrió un error inesperado. Inténtalo de nuevo.'
        }
      } finally {
        this.loading = false
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
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-fallback {
  font-size: 80px;
  line-height: 1;
}

.brand-name {
  font-size: 2rem;
  font-weight: 600;
  color: #1a1a2e;
  text-align: center;
  margin: 0;
}

.brand-sub {
  color: #555;
  text-align: center;
  line-height: 1.6;
  font-size: 0.95rem;
  margin: 0;
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
  transition: border-color 0.2s;
  outline: none;
  color: #1a1a2e;
}

.field input:focus {
  border-color: #80201d;
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
  transition: background 0.2s;
  margin-top: 0.5rem;
}

.btn-login:hover:not(:disabled) {
  background: #9e2a26;
}

.btn-login:disabled {
  background: #c89090;
  cursor: not-allowed;
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
  .brand-name {
    font-size: 1.5rem;
  }
}
</style>
