<template>
  <div class="page-wrapper">
    <Navbar />
    <main class="dashboard">

      <header class="dash-header">
        <div>
          <h1>Panel principal</h1>
          <p class="dash-welcome">
            Bienvenido, <strong>{{ user?.nombre_completo || user?.username }}</strong>
            <span class="role-badge">{{ user?.role_name }}</span>
          </p>
        </div>
      </header>

      <!-- ── Estadísticas ────────────────────────────────── -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-body">
            <div class="stat-val">{{ stats.cajas ?? '—' }}</div>
            <div class="stat-lbl">Cajas activas</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🐀</div>
          <div class="stat-body">
            <div class="stat-val">{{ stats.ratas_total ?? '—' }}</div>
            <div class="stat-lbl">
              Ratas totales
              <span v-if="stats.ratas_macho !== undefined" class="stat-sub">
                {{ stats.ratas_macho }}M · {{ stats.ratas_hembra }}H
              </span>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-body">
            <div class="stat-val">{{ stats.experimentos_total ?? '—' }}</div>
            <div class="stat-lbl">
              Experimentos
              <span v-if="stats.experimentos_mes !== undefined" class="stat-sub">
                {{ stats.experimentos_mes }} este mes
              </span>
            </div>
          </div>
        </div>
        <div class="stat-card" v-if="isAdmin">
          <div class="stat-icon">👤</div>
          <div class="stat-body">
            <div class="stat-val">{{ stats.usuarios ?? '—' }}</div>
            <div class="stat-lbl">Usuarios</div>
          </div>
        </div>
      </div>

      <!-- ── Navegación ──────────────────────────────────── -->
      <h2 class="section-nav-title">Módulos del sistema</h2>
      <div class="cards-grid">
        <router-link class="dash-card" to="/inventario">
          <div class="card-icon">🐀</div>
          <div class="card-label">Animales</div>
          <div class="card-desc">Inventario de cajas y ratas</div>
        </router-link>
        <router-link class="dash-card" to="/experimento">
          <div class="card-icon">📋</div>
          <div class="card-label">Experimentos</div>
          <div class="card-desc">Bitácora de experimentos</div>
        </router-link>
        <router-link class="dash-card" to="/catalogos">
          <div class="card-icon">📚</div>
          <div class="card-label">Catálogos</div>
          <div class="card-desc">Anestésicos, tejidos y condiciones</div>
        </router-link>
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
import api from '../api'

export default {
  name: 'DashboardView',
  components: { Navbar },
  data() {
    return { stats: {} }
  },
  computed: {
    ...mapGetters(['currentUser', 'isAdmin']),
    user() { return this.currentUser },
  },
  async created() {
    try {
      const res = await api.get('stats/')
      this.stats = res.data
    } catch { /* no bloqueante */ }
  },
}
</script>

<style scoped>
.dashboard {
  max-width: 960px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}

.dash-header {
  margin-bottom: 2rem;
}

.dash-header h1 {
  font-size: 1.6rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 .4rem;
}

.dash-welcome {
  color: #555;
  font-size: .95rem;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}

.role-badge {
  background: #80201d;
  color: #fff;
  font-size: .75rem;
  padding: 2px 10px;
  border-radius: 99px;
  font-weight: 500;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.stat-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.stat-val {
  font-size: 1.9rem;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1;
}

.stat-lbl {
  font-size: .82rem;
  color: #888;
  margin-top: 4px;
}

.stat-sub {
  display: block;
  font-size: .78rem;
  color: #aaa;
  margin-top: 2px;
}

/* Nav cards */
.section-nav-title {
  font-size: 1rem;
  font-weight: 600;
  color: #888;
  margin-bottom: 1rem;
  letter-spacing: .02em;
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
  padding: 1.75rem 1.5rem;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .6rem;
  text-align: center;
  transition: transform .15s, box-shadow .15s, border-color .15s;
  cursor: pointer;
}

.dash-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .09);
  border-color: #80201d;
}

.card-icon {
  font-size: 2.2rem;
}

.card-label {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
}

.card-desc {
  font-size: .8rem;
  color: #888;
}
</style>