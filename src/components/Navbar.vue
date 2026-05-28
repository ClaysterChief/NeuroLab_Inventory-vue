<template>
  <nav class="navbar">
    <!-- Logo + nombre -->
    <router-link class="nav-brand" to="/dashboard">
      <span class="nav-logo">🐀</span>
      <span class="nav-title">NeuroLab Inventory</span>
    </router-link>

    <!-- Links centrales -->
    <div class="nav-links">
      <router-link to="/dashboard">Inicio</router-link>
      <router-link to="/inventario">Inventario</router-link>
      <router-link to="/experimento">Experimentos</router-link>
      <router-link v-if="isAdmin" to="/usuarios">Usuarios</router-link>
    </div>

    <!-- Usuario + logout -->
    <div class="nav-user">
      <span class="nav-username">{{ user?.nombreusuario || user?.username }}</span>
      <span class="nav-role">{{ user?.role_name }}</span>
      <button class="btn-logout" @click="handleLogout" title="Cerrar sesión">
        Salir
      </button>
    </div>
  </nav>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'NavbarComponent',
  computed: {
    ...mapGetters(['currentUser', 'isAdmin']),
    user() { return this.currentUser },
  },
  methods: {
    ...mapActions(['logout']),
    handleLogout() {
      this.logout()
      this.$router.push({ name: 'home' })
    },
  },
}
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1a1a2e;
  color: #fff;
  padding: 0 1.5rem;
  height: 62px;
  position: sticky;
  top: 0;
  z-index: 100;
  gap: 1rem;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #fff;
  flex-shrink: 0;
}

.nav-logo { font-size: 1.4rem; }
.nav-title { font-size: 1rem; font-weight: 600; }

.nav-links {
  display: flex;
  gap: 0.25rem;
  flex: 1;
  justify-content: center;
}

.nav-links a {
  color: rgba(255,255,255,0.75);
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: background 0.15s, color 0.15s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  background: rgba(255,255,255,0.12);
  color: #fff;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.nav-username {
  font-size: 0.88rem;
  font-weight: 500;
}

.nav-role {
  font-size: 0.75rem;
  background: #80201d;
  padding: 2px 8px;
  border-radius: 99px;
}

.btn-logout {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.3);
  color: rgba(255,255,255,0.8);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-logout:hover {
  background: rgba(255,255,255,0.12);
  color: #fff;
}

@media (max-width: 650px) {
  .nav-title, .nav-role { display: none; }
  .nav-links a { padding: 6px 8px; font-size: 0.82rem; }
}
</style>
