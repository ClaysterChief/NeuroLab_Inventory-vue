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

      <!-- Stats -->
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

      <!-- Gráfica de cajas por ubicación -->
      <div v-if="pieData.length" class="pie-card">
        <h3 class="pie-title">Distribución de cajas por ubicación</h3>
        <div class="pie-wrap">
          <svg viewBox="0 0 200 200" width="160" height="160">
            <g v-for="(s, i) in pieData" :key="i">
              <path :d="pieSlicePath(s, 100, 100, 80)" :fill="s.color" stroke="#fff" stroke-width="2" />
            </g>
          </svg>
          <div class="pie-legend">
            <div v-for="s in pieData" :key="s.label" class="legend-item">
              <span class="legend-dot" :style="{ background: s.color }"></span>
              <span class="legend-label">{{ s.label }}</span>
              <span class="legend-val">{{ s.total }} ({{ s.pct }}%)</span>
            </div>
            <div class="legend-item legend-item--gray">
              <span class="legend-dot" style="background:#ddd"></span>
              <span class="legend-label">Sin ubicación</span>
              <span class="legend-val">
                {{(stats.cajas || 0) - pieData.reduce((s, d) => s + d.total, 0)}}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="dash-actions">
        <button class="btn-primary" @click="$router.push('/inventario-semanal')">
          📋 Iniciar registro semanal
        </button>
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
    pieData() {
      const data = this.stats.cajas_por_ubicacion || []
      if (!data.length) return []
      const total = data.reduce((s, d) => s + d.total, 0)
      const colors = ['#80201d', '#1a1a2e', '#c5a0a0', '#6a8caf', '#888']
      let startAngle = 0
      return data.map((d, i) => {
        const pct = d.total / total
        const angle = pct * 360
        const start = startAngle
        startAngle += angle
        return {
          label: d.idubicacion__nombreubicacion || 'Sin ubicación',
          total: d.total,
          pct: Math.round(pct * 100),
          color: colors[i % colors.length],
          startAngle: start,
          endAngle: startAngle,
        }
      })
    },
  },
  async created() {
    try {
      const res = await api.get('stats/')
      this.stats = res.data
    } catch { /* no bloqueante */ }
  },

  methods: {
    polarToXY(cx, cy, r, angleDeg) {
      const rad = (angleDeg - 90) * (Math.PI / 180)
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
    },

    pieSlicePath(slice, cx, cy, r) {
      if (slice.pct >= 100) {
        return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
      }
      const start = this.polarToXY(cx, cy, r, slice.startAngle)
      const end = this.polarToXY(cx, cy, r, slice.endAngle)
      const large = (slice.endAngle - slice.startAngle) > 180 ? 1 : 0
      return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`
    },
  }
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

.pie-card {
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 2rem;
}

.pie-title {
  font-size: .9rem;
  font-weight: 600;
  color: #888;
  margin-bottom: 1rem;
  letter-spacing: .02em;
}

.pie-wrap {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: .85rem;
}

.legend-item--gray {
  opacity: .5;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-label {
  color: #444;
  flex: 1;
}

.legend-val {
  color: #888;
  font-size: .8rem;
  white-space: nowrap;
}
</style>