<template>
  <nav class="navbar">
    <!-- Logo + rata animada (ahora SVG, no emoji) -->
    <router-link class="nav-brand" to="/dashboard">
      <div class="rat-container" title="NeuroLab">
        <Icon name="rat" :size="26" class="rat-emoji" :class="ratAnim" />
      </div>
      <span class="nav-title">NeuroLab <span class="nav-title-accent">Inventory</span></span>
    </router-link>

    <!-- Links centrales -->
    <div class="nav-links" :class="{ 'nav-open': menuOpen }">
      <router-link v-for="link in visibleLinks" :key="link.to"
                   :to="link.to" @click="menuOpen = false"
                   class="nav-link">
        <Icon :name="link.icon" :size="16" class="nav-link-icon" />
        <span class="nav-link-text">{{ link.label }}</span>
      </router-link>

      <!-- Solo móvil: info usuario + acciones -->
      <div class="nav-mobile-footer">
        <div class="mobile-user-info">
          <span class="mobile-avatar">{{ userInitial }}</span>
          <div>
            <div class="mobile-username">{{ user?.nombreusuario || user?.username }}</div>
            <div class="mobile-role">{{ user?.role_name }}</div>
          </div>
        </div>
        <button class="mobile-menu-item" @click="abrirCambiarPassword">
          <Icon name="key" :size="16" /> Cambiar contraseña
        </button>
        <button class="mobile-menu-item mobile-menu-item--danger" @click="handleLogout">
          <Icon name="log-out" :size="16" /> Cerrar sesión
        </button>
      </div>
    </div>

    <!-- Usuario + menú — escritorio -->
    <div class="nav-user">
      <button type="button" class="user-chip" @click.stop="toggleUserMenu">
        <span class="user-avatar">{{ userInitial }}</span>
        <span class="user-name">{{ user?.nombreusuario || user?.username }}</span>
        <Icon name="chevron-down" :size="14" class="user-caret" :class="{ rotated: userMenuOpen }" />
      </button>

      <transition name="dropdown">
        <div v-if="userMenuOpen" class="user-dropdown" ref="userDropdown" @click.stop>
          <div class="user-dropdown-header">
            <span class="user-dropdown-avatar">{{ userInitial }}</span>
            <div>
              <div class="user-dropdown-name">{{ user?.nombreusuario }}</div>
              <div class="user-dropdown-role">{{ user?.role_name }}</div>
            </div>
          </div>
          <div class="user-dropdown-divider"></div>
          <button class="user-dropdown-item" @click="abrirCambiarPassword">
            <Icon name="key" :size="16" /> Cambiar contraseña
          </button>
          <button class="user-dropdown-item user-dropdown-item--danger" @click="handleLogout">
            <Icon name="log-out" :size="16" /> Cerrar sesión
          </button>
        </div>
      </transition>
    </div>

    <!-- Hamburguesa -->
    <button class="nav-burger" @click="menuOpen = !menuOpen"
            :class="{ open: menuOpen }" aria-label="Menú">
      <span></span><span></span><span></span>
    </button>
  </nav>

  <div v-if="menuOpen || userMenuOpen"
       class="nav-overlay"
       @click="menuOpen = false; userMenuOpen = false"></div>

  <!-- ══ MODAL: Cambiar contraseña (cualquier rol) ══════════════════ -->
  <transition name="modal-fade">
    <div v-if="modalPassword" class="modal-overlay" @click.self="cerrarModalPassword">
      <transition name="modal-pop" appear>
        <div class="modal" v-if="modalPassword">
          <h2><Icon name="key" :size="18" /> Cambiar contraseña</h2>
          <form @submit.prevent="guardarPassword">
            <div class="field">
              <label>Contraseña actual <span class="req">*</span></label>
              <input v-model="passwordForm.password_actual" type="password" required autocomplete="current-password"
                :class="{ 'input-error shake-error': fieldErrors.password_actual }" />
              <span v-if="fieldErrors.password_actual" class="field-error">{{ fieldErrors.password_actual }}</span>
            </div>
            <div class="field mt">
              <label>Nueva contraseña <span class="req">*</span></label>
              <input v-model="passwordForm.password_nueva" type="password" required autocomplete="new-password"
                minlength="6" :class="{ 'input-error shake-error': fieldErrors.password_nueva }" />
              <span v-if="fieldErrors.password_nueva" class="field-error">{{ fieldErrors.password_nueva }}</span>
              <span v-else class="field-hint">Mínimo 6 caracteres.</span>
            </div>
            <div class="field mt">
              <label>Confirmar nueva contraseña <span class="req">*</span></label>
              <input v-model="passwordForm.password_nueva_confirm" type="password" required autocomplete="new-password"
                :class="{ 'input-error shake-error': fieldErrors.password_nueva_confirm }" />
              <span v-if="fieldErrors.password_nueva_confirm" class="field-error">{{ fieldErrors.password_nueva_confirm }}</span>
            </div>
            <p v-if="formError" class="form-error shake-error" :key="formErrorKey">{{ formError }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="cerrarModalPassword">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="savingPassword">
                <span v-if="savingPassword" class="spinner-bounce">⏳</span>
                <span v-else>Actualizar contraseña</span>
              </button>
            </div>
          </form>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Icon from './Icon.vue'
import api from '../api'

export default {
  name: 'NavbarComponent',
  components: { Icon },

  data() {
    return {
      menuOpen: false,
      userMenuOpen: false,
      ratAnim: 'rat-sniff',
      ratTimer: null,

      modalPassword: false,
      savingPassword: false,
      formError: null,
      formErrorKey: 0,
      fieldErrors: {},
      passwordForm: { password_actual: '', password_nueva: '', password_nueva_confirm: '' },
    }
  },

  computed: {
    ...mapGetters(['currentUser', 'isAdmin']),
    user() { return this.currentUser },

    userInitial() {
      const name = this.user?.nombreusuario || this.user?.username || '?'
      return name[0].toUpperCase()
    },

    visibleLinks() {
      const links = [
        { to: '/dashboard',          icon: 'home',      label: 'Inicio'       },
        { to: '/inventario',         icon: 'box',        label: 'Inventario'   },
        { to: '/experimento',        icon: 'clipboard',  label: 'Experimentos' },
        { to: '/catalogos',          icon: 'book',       label: 'Catálogos'    },
        { to: '/inventario-semanal', icon: 'calendar',   label: 'Semanal'      },
      ]
      if (this.isAdmin) links.push({ to: '/usuarios', icon: 'users', label: 'Usuarios' })
      return links
    },
  },

  mounted() {
    this.startRatCycle()
    document.addEventListener('click', this.handleOutsideClick)
  },
  beforeUnmount() {
    clearTimeout(this.ratTimer)
    document.removeEventListener('click', this.handleOutsideClick)
  },
  watch: { $route() { this.menuOpen = false; this.userMenuOpen = false } },

  methods: {
    ...mapActions(['logout']),

    toggleUserMenu() {
      this.userMenuOpen = !this.userMenuOpen
    },

    handleOutsideClick(e) {
      // Cierra el dropdown si el click fue fuera de él y fuera del botón que lo abre.
      if (!this.userMenuOpen) return
      const dropdown = this.$refs.userDropdown
      if (dropdown && !dropdown.contains(e.target)) {
        this.userMenuOpen = false
      }
    },

    handleLogout() {
      this.menuOpen = false; this.userMenuOpen = false
      this.logout()
      this.$router.push({ name: 'home' })
    },

    abrirCambiarPassword() {
      this.userMenuOpen = false
      this.menuOpen = false
      this.formError = null
      this.fieldErrors = {}
      this.passwordForm = { password_actual: '', password_nueva: '', password_nueva_confirm: '' }
      this.modalPassword = true
    },

    cerrarModalPassword() {
      this.modalPassword = false
    },

    async guardarPassword() {
      this.savingPassword = true
      this.formError = null
      this.fieldErrors = {}
      try {
        await api.post('cambiar-password/', this.passwordForm)
        this.modalPassword = false
        this.$toast.success('Tu contraseña fue actualizada correctamente.')
      } catch (err) {
        const data = err.response?.data
        if (data && typeof data === 'object') {
          this.fieldErrors = data
          const first = Object.values(data)[0]
          if (first && !data.password_actual && !data.password_nueva && !data.password_nueva_confirm) {
            this.formError = Array.isArray(first) ? first[0] : first
            this.formErrorKey++
          }
        } else {
          this.formError = 'No se pudo actualizar la contraseña. Inténtalo de nuevo.'
          this.formErrorKey++
        }
      } finally {
        this.savingPassword = false
      }
    },

    // ── Ciclo de animación de la rata ──────────────────────
    startRatCycle() {
      const cycle = [
        { anim: 'rat-sniff', dur: 3200 },
        { anim: 'rat-idle',  dur: 1500 },
        { anim: 'rat-run',   dur: 1800 },
        { anim: 'rat-idle',  dur: 800  },
        { anim: 'rat-sniff', dur: 2500 },
        { anim: 'rat-jump',  dur: 900  },
        { anim: 'rat-idle',  dur: 2000 },
      ]
      let i = 0
      const next = () => {
        const { anim, dur } = cycle[i % cycle.length]
        this.ratAnim = anim
        i++
        this.ratTimer = setTimeout(next, dur)
      }
      next()
    },
  },
}
</script>

<style scoped>
/* ── Base navbar ── */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 0 1.5rem;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 500;
  gap: 1rem;
  box-shadow: 0 2px 16px rgba(0,0,0,.3);
}

/* ══════════════════════════════════
   RATA ANIMADA (SVG)
   ══════════════════════════════════ */
.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #fff;
  flex-shrink: 0;
}

.rat-container {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rat-emoji {
  display: inline-block;
  transform-origin: bottom center;
  cursor: pointer;
  transition: filter .2s;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,.3));
  color: #c58888;
}

.rat-sniff { animation: ratSniff 0.55s ease-in-out infinite alternate; }
@keyframes ratSniff {
  from { transform: rotate(-4deg) translateY(0); }
  to   { transform: rotate(4deg)  translateY(-3px); }
}

.rat-idle { animation: ratIdle 1.6s ease-in-out infinite; }
@keyframes ratIdle {
  0%, 100% { transform: scaleY(1)   translateY(0); }
  50%      { transform: scaleY(1.06) translateY(-1px); }
}

.rat-run { animation: ratRun 0.22s linear infinite; }
@keyframes ratRun {
  0%   { transform: translateY(0)   rotate(-6deg) scaleX(1); }
  25%  { transform: translateY(-5px) rotate(0deg)  scaleX(1.05); }
  50%  { transform: translateY(0)   rotate(6deg)  scaleX(1); }
  75%  { transform: translateY(-3px) rotate(0deg)  scaleX(.95); }
  100% { transform: translateY(0)   rotate(-6deg) scaleX(1); }
}

.rat-jump { animation: ratJump 0.5s cubic-bezier(.22,.68,0,1.35) both; }
@keyframes ratJump {
  0%   { transform: translateY(0) rotate(0deg) scale(1); }
  35%  { transform: translateY(-14px) rotate(-15deg) scale(1.1); }
  65%  { transform: translateY(-10px) rotate(10deg) scale(.95); }
  100% { transform: translateY(0) rotate(0deg) scale(1); }
}

.rat-container:hover .rat-emoji {
  animation: ratHover 0.3s ease forwards !important;
  filter: drop-shadow(0 0 8px rgba(255,200,100,.5));
  color: #e0a0a0;
}
@keyframes ratHover {
  0%   { transform: scale(1) rotate(0deg); }
  50%  { transform: scale(1.25) rotate(-10deg); }
  100% { transform: scale(1.15) rotate(5deg); }
}

.nav-title {
  font-size: .98rem;
  font-weight: 600;
  letter-spacing: .01em;
}

.nav-title-accent { color: #c58888; }

/* ══════════════════════════════════
   LINKS
   ══════════════════════════════════ */
.nav-links {
  display: flex;
  gap: .2rem;
  flex: 1;
  justify-content: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,.7);
  text-decoration: none;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: .85rem;
  transition: background .15s, color .15s, transform .12s;
  white-space: nowrap;
  position: relative;
}

.nav-link:hover {
  background: rgba(255,255,255,.1);
  color: #fff;
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  background: rgba(128,32,29,.5);
  color: #fff;
  font-weight: 500;
}

.nav-link.router-link-active::after {
  content: '';
  display: block;
  position: absolute;
  bottom: -2px;
  left: 12px; right: 12px;
  height: 2px;
  background: #c58888;
  border-radius: 2px;
  animation: underlineIn .25s ease both;
}

@keyframes underlineIn {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

/* ══════════════════════════════════
   USER CHIP + DROPDOWN
   ══════════════════════════════════ */
.nav-user {
  position: relative;
  flex-shrink: 0;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 99px;
  padding: 4px 12px 4px 4px;
  cursor: pointer;
  transition: background .15s, transform .1s;
  user-select: none;
  font-family: inherit;
  color: #fff;
}

.user-chip:hover {
  background: rgba(255,255,255,.14);
  transform: translateY(-1px);
}

.user-avatar {
  width: 28px; height: 28px;
  background: linear-gradient(135deg, #80201d, #c05050);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .82rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  animation: avatarPop .4s cubic-bezier(.22,.68,0,1.3) .1s both;
}

@keyframes avatarPop {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}

.user-name {
  font-size: .82rem;
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-caret {
  opacity: .6;
  transition: transform .2s;
}
.user-caret.rotated { transform: rotate(180deg); }

.user-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0,0,0,.18);
  min-width: 220px;
  overflow: hidden;
  z-index: 600;
}

.dropdown-enter-active { transition: opacity .18s ease, transform .18s ease; }
.dropdown-leave-active { transition: opacity .14s ease, transform .14s ease; }
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(.96);
}

.user-dropdown-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: .9rem 1rem;
  background: #f8f8fb;
}

.user-dropdown-avatar {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, #80201d, #c05050);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .9rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.user-dropdown-name {
  font-size: .87rem;
  font-weight: 600;
  color: #1a1a2e;
}

.user-dropdown-role {
  font-size: .73rem;
  color: #80201d;
  font-weight: 500;
}

.user-dropdown-divider {
  height: 1px;
  background: #eee;
}

.user-dropdown-item {
  width: 100%;
  background: none;
  border: none;
  padding: .75rem 1rem;
  text-align: left;
  font-size: .87rem;
  color: #444;
  cursor: pointer;
  font-family: inherit;
  transition: background .13s, color .13s;
  display: flex;
  align-items: center;
  gap: .6rem;
}

.user-dropdown-item:hover {
  background: #f5f5f9;
}

.user-dropdown-item--danger:hover {
  background: #fff0f0;
  color: #c62828;
}

/* ══════════════════════════════════
   HAMBURGUESA
   ══════════════════════════════════ */
.nav-burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 38px; height: 38px;
  padding: 6px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background .15s;
}
.nav-burger:hover { background: rgba(255,255,255,.15); }

.nav-burger span {
  display: block;
  height: 2px;
  background: #fff;
  border-radius: 2px;
  transition: transform .25s ease, opacity .2s ease;
}

.nav-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.nav-burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.nav-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

.nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  z-index: 499;
  animation: fadeIn .2s ease both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.nav-mobile-footer { display: none; }

/* ══════════════════════════════════
   RESPONSIVE
   ══════════════════════════════════ */
@media (max-width: 860px) {
  .nav-link-text { display: none; }
  .nav-link      { padding: 7px 9px; }
  .user-name     { display: none; }
}

@media (max-width: 640px) {
  .navbar { padding: 0 1rem; height: 58px; }
  .nav-title { display: none; }

  .nav-links {
    display: none;
    position: fixed;
    top: 58px; left: 0; right: 0;
    background: linear-gradient(180deg, #1a1a2e, #16213e);
    flex-direction: column;
    padding: .75rem .9rem 1.25rem;
    gap: .2rem;
    z-index: 500;
    box-shadow: 0 8px 24px rgba(0,0,0,.35);
    animation: slideDown .22s ease both;
    max-height: calc(100vh - 58px);
    overflow-y: auto;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .nav-links.nav-open { display: flex; }

  .nav-link {
    font-size: .9rem;
    padding: .6rem .85rem;
    border-radius: 8px;
  }

  .nav-link-text { display: inline; }

  .nav-user { display: none; }

  .nav-mobile-footer {
    display: flex;
    flex-direction: column;
    gap: .35rem;
    margin-top: .85rem;
    padding-top: .85rem;
    border-top: 1px solid rgba(255,255,255,.1);
  }

  .mobile-user-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: .5rem .85rem;
    margin-bottom: .25rem;
  }

  .mobile-avatar {
    width: 34px; height: 34px;
    background: linear-gradient(135deg, #80201d, #c05050);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #fff;
    font-size: .85rem;
    flex-shrink: 0;
  }

  .mobile-username {
    font-size: .88rem;
    font-weight: 600;
    color: #fff;
  }

  .mobile-role {
    font-size: .72rem;
    color: #c58888;
  }

  .mobile-menu-item {
    width: calc(100% - 1.7rem);
    margin: 0 .85rem;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.15);
    color: rgba(255,255,255,.9);
    padding: .6rem .75rem;
    border-radius: 8px;
    font-size: .85rem;
    cursor: pointer;
    font-family: inherit;
    transition: background .15s;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mobile-menu-item:hover { background: rgba(255,255,255,.12); }

  .mobile-menu-item--danger {
    background: rgba(128,32,29,.3);
    border-color: rgba(128,32,29,.5);
  }
  .mobile-menu-item--danger:hover { background: rgba(128,32,29,.5); }

  .nav-burger { display: flex; }
}
</style>
