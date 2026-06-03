<template>
  <div class="page-wrapper">
    <Navbar />
    <main class="dashboard">
      <header class="dash-header">
        <h1>Panel principal</h1>
        <p class="dash-welcome">
          Bienvenido, <strong>{{ user?.nombre_completo || user?.username }}</strong>
          <span class="role-badge">{{ user?.role_name }}</span>
        </p>
      </header>

      <div class="cards-grid">
        <!-- Animales: todos los roles -->
        <router-link class="dash-card" to="/inventario">
          <div class="card-icon">🐀</div>
          <div class="card-label">Animales</div>
          <div class="card-desc">Inventario de cajas y ratas</div>
        </router-link>

        <!-- Experimentos: todos los roles -->
        <router-link class="dash-card" to="/experimento">
          <div class="card-icon">📋</div>
          <div class="card-label">Experimentos</div>
          <div class="card-desc">Bitácora de experimentos</div>
        </router-link>

        <!-- Catálogos: todos los roles (Practicante solo lectura) -->
        <router-link class="dash-card" to="/catalogos">
          <div class="card-icon">📚</div>
          <div class="card-label">Catálogos</div>
          <div class="card-desc">Anestésicos, tejidos y condiciones</div>
        </router-link>

        <!-- Usuarios: solo Administrador -->
        <router-link v-if="isAdmin" class="dash-card" to="/usuarios">
          <div class="card-icon">👤</div>
          <div class="card-label">Usuarios</div>
          <div class="card-desc">Gestión de cuentas y roles</div>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Navbar from '../components/Navbar.vue'

export default {
  name: 'DashboardView',
  components: { Navbar },
  computed: {
    ...mapGetters(['currentUser', 'isAdmin', 'isEncargado']),
    user() { return this.currentUser },
  },
}
</script>

<style scoped>
.page-wrapper { min-height: 100vh; background: #f4f4f8; }

.dashboard {
  max-width: 900px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}

.dash-header { margin-bottom: 2rem; }
.dash-header h1 { font-size: 1.6rem; font-weight: 600; color: #1a1a2e; margin: 0 0 0.4rem 0; }
.dash-welcome { color: #555; font-size: 0.95rem; display: flex; align-items: center; gap: 10px; margin: 0; }

.role-badge {
  background: #80201d;
  color: #fff;
  font-size: 0.75rem;
  padding: 2px 10px;
  border-radius: 99px;
  font-weight: 500;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
}

.dash-card {
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 14px;
  padding: 2rem 1.5rem;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  text-align: center;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  cursor: pointer;
}

.dash-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.09);
  border-color: #80201d;
}

.card-icon { font-size: 2.5rem; }
.card-label { font-size: 1.05rem; font-weight: 600; color: #1a1a2e; }
.card-desc  { font-size: 0.82rem; color: #888; }
</style>
