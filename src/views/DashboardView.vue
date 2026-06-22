<template>
  <div class="page-wrapper">
    <Navbar />
    <main class="dashboard">

      <!-- ══════════════════════════════════════════════════════
           LAYOUT PC: dos columnas (sidebar izquierda + main derecha)
           LAYOUT móvil: columna única apilada
           ═══════════════════════════════════════════════════ -->
      <div class="dash-layout">

        <!-- ── Columna izquierda: usuario + módulos ─────────── -->
        <aside class="dash-sidebar">

          <!-- Tarjeta de usuario con header gradiente -->
          <div class="user-card">
            <div class="user-card-bg" aria-hidden="true">
              <span v-for="n in 4" :key="n" class="particle" :style="particleStyle(n)"></span>
            </div>
            <div class="user-avatar-big">{{ userInitial }}</div>
            <div class="user-card-name">{{ user?.nombre_completo || user?.username }}</div>
            <span class="user-card-role">{{ user?.role_name }}</span>
            <div class="user-card-time">{{ currentTime }}</div>
          </div>

          <!-- Botón de registro semanal -->
          <button class="btn-semanal" @click="$router.push('/inventario-semanal')">
            <Icon name="clipboard" :size="16" />
            Registro semanal
            <Icon name="arrow-right" :size="14" class="btn-semanal-arrow" />
          </button>

          <!-- Módulos de navegación (vertical en PC, grid en móvil) -->
          <div class="sidebar-nav">
            <router-link class="sidebar-card" v-for="(card, i) in navCards" :key="card.to"
                         :to="card.to"
                         :style="{ animationDelay: (i * 0.07 + 0.1) + 's' }">
              <div class="sidebar-card-icon" :style="{ background: card.bg }">
                <Icon :name="card.iconName" :size="22" />
              </div>
              <div class="sidebar-card-body">
                <span class="sidebar-card-label">{{ card.label }}</span>
                <span class="sidebar-card-desc">{{ card.desc }}</span>
              </div>
              <Icon name="arrow-right" :size="13" class="sidebar-card-arrow" />
            </router-link>
          </div>
        </aside>

        <!-- ── Área principal derecha ────────────────────────── -->
        <div class="dash-main">

          <!-- Stats grid (4 tarjetas) -->
          <div class="stats-grid">
            <div class="stat-card" v-for="(card, i) in statCards" :key="card.key"
                 :style="{ animationDelay: i * 0.08 + 's' }"
                 :class="{ 'stat-card--loaded': statsLoaded }">
              <Icon :name="card.iconName" :size="28" class="stat-icon" :class="'icon-' + card.key" />
              <div class="stat-body">
                <div class="stat-val">
                  <span class="stat-num" :data-target="card.value">{{ card.display }}</span>
                </div>
                <div class="stat-lbl">
                  {{ card.label }}
                  <span v-if="card.sub" class="stat-sub">{{ card.sub }}</span>
                </div>
              </div>
              <div class="stat-glow" :style="{ background: card.glow }"></div>
            </div>
          </div>

          <!-- Gráficas: cajas + ratas por sexo -->
          <div class="charts-grid">

            <!-- Donut cajas por ubicación -->
            <div v-if="pieData.length" class="pie-card">
              <h3 class="pie-title">
                <Icon name="chart-pie" :size="14" class="pie-title-icon" />
                Cajas por ubicación
              </h3>
              <div class="pie-wrap">
                <svg viewBox="0 0 200 200" width="140" height="140" class="pie-svg">
                  <circle cx="100" cy="100" r="80" fill="#f8f8fb" />
                  <g v-for="(s, i) in pieData" :key="i">
                    <path
                      :d="pieSlicePath(s, 100, 100, 80)"
                      :fill="s.color"
                      stroke="#fff"
                      stroke-width="2.5"
                      class="pie-slice"
                      :style="{ animationDelay: i * 0.12 + 's' }"
                      @mouseenter="hoveredSlice = i"
                      @mouseleave="hoveredSlice = null"
                      :class="{ 'pie-slice--hover': hoveredSlice === i }"
                    />
                  </g>
                  <circle cx="100" cy="100" r="40" fill="#fff" />
                  <text x="100" y="96"  text-anchor="middle" class="donut-text-main">{{ stats.cajas ?? 0 }}</text>
                  <text x="100" y="112" text-anchor="middle" class="donut-text-sub">cajas</text>
                </svg>
                <div class="pie-legend">
                  <div v-for="(s, i) in pieData" :key="s.label"
                       class="legend-item"
                       @mouseenter="hoveredSlice = i"
                       @mouseleave="hoveredSlice = null"
                       :class="{ 'legend-item--active': hoveredSlice === i }">
                    <span class="legend-dot" :style="{ background: s.color }"></span>
                    <span class="legend-label">{{ s.label }}</span>
                    <span class="legend-val">{{ s.total }} ({{ s.pct }}%)</span>
                  </div>
                  <div class="legend-item legend-item--gray">
                    <span class="legend-dot" style="background:#ddd"></span>
                    <span class="legend-label">Sin ubicación</span>
                    <span class="legend-val">{{ (stats.cajas || 0) - pieData.reduce((s,d)=>s+d.total,0) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ratio macho/hembra -->
            <div class="pie-card ratio-card">
              <h3 class="pie-title">
                <Icon name="rat" :size="14" class="pie-title-icon" />
                Ratas por sexo
              </h3>
              <div class="ratio-body">
                <div class="ratio-row" v-for="(r, i) in ratioSexo" :key="r.label"
                     :style="{ animationDelay: (i * 0.1 + 0.15) + 's' }">
                  <div class="ratio-row-top">
                    <span class="ratio-label">
                      <span class="ratio-dot" :style="{ background: r.color }"></span>
                      {{ r.label }}
                    </span>
                    <span class="ratio-val">{{ r.count }} <span class="ratio-pct">({{ r.pct }}%)</span></span>
                  </div>
                  <div class="ratio-bar-track">
                    <div class="ratio-bar-fill" :style="{ width: r.pct + '%', background: r.color }"></div>
                  </div>
                </div>
              </div>
              <div class="ratio-total">
                <Icon name="rat" :size="13" />
                Total: <strong>{{ stats.ratas_total ?? 0 }}</strong> ratas
              </div>
            </div>
          </div>

          <!-- ── Tres tarjetas resumen ─────────────────────── -->
          <div class="summary-grid">

            <!-- Última caja registrada -->
            <div class="summary-card">
              <div class="summary-head">
                <div class="summary-icon summary-icon--box"><Icon name="box" :size="18" /></div>
                <span class="summary-title">Última caja</span>
              </div>
              <div v-if="stats.ultima_caja" class="summary-body">
                <div class="summary-main">Caja #{{ stats.ultima_caja.idcaja }}</div>
                <div class="summary-detail">
                  {{ stats.ultima_caja.sexo }} · {{ stats.ultima_caja.cantidad }} ratas
                </div>
                <div class="summary-sub">
                  {{ stats.ultima_caja.ubicacion || 'Sin ubicación' }}
                </div>
              </div>
              <div v-else class="summary-empty">Aún no hay cajas registradas.</div>
            </div>

            <!-- Último experimento -->
            <div class="summary-card">
              <div class="summary-head">
                <div class="summary-icon summary-icon--exp"><Icon name="clipboard" :size="18" /></div>
                <span class="summary-title">Último experimento</span>
              </div>
              <div v-if="stats.ultimo_experimento" class="summary-body">
                <div class="summary-main">
                  {{ stats.ultimo_experimento.proyecto || `Registro #${stats.ultimo_experimento.idbitacora}` }}
                </div>
                <div class="summary-detail">
                  Rata {{ stats.ultimo_experimento.rata || '—' }}
                  <span v-if="stats.ultimo_experimento.anestesico"> · {{ stats.ultimo_experimento.anestesico }}</span>
                </div>
                <div class="summary-sub">{{ fmtFecha(stats.ultimo_experimento.fecha) }}</div>
              </div>
              <div v-else class="summary-empty">Aún no hay experimentos.</div>
            </div>

            <!-- Alerta de peso crítico -->
            <div class="summary-card" :class="{ 'summary-card--alert': stats.alerta_peso }">
              <div class="summary-head">
                <div class="summary-icon" :class="stats.alerta_peso ? 'summary-icon--alert' : 'summary-icon--ok'">
                  <Icon :name="stats.alerta_peso ? 'trending-down' : 'check-circle'" :size="18" />
                </div>
                <span class="summary-title">Alerta de peso</span>
              </div>
              <div v-if="stats.alerta_peso" class="summary-body">
                <div class="summary-main summary-main--alert">
                  Rata {{ stats.alerta_peso.rata }}
                  <span class="summary-pct-drop">{{ stats.alerta_peso.variacion_pct }}%</span>
                </div>
                <div class="summary-detail">
                  {{ stats.alerta_peso.peso_anterior }}g → <strong>{{ stats.alerta_peso.peso_actual }}g</strong>
                </div>
                <div class="summary-sub">{{ fmtFecha(stats.alerta_peso.fecha) }}</div>
              </div>
              <div v-else class="summary-body">
                <div class="summary-main summary-main--ok">Sin alertas</div>
                <div class="summary-sub">Ninguna rata con descenso de peso.</div>
              </div>
            </div>

          </div><!-- /.summary-grid -->

        </div><!-- /.dash-main -->
      </div><!-- /.dash-layout -->

      <!-- Rata decorativa idle -->
      <div class="idle-rat" aria-hidden="true">
        <Icon name="rat" :size="20" class="idle-rat-icon" />
        <span class="idle-rat-trail">· · ·</span>
      </div>

    </main>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Navbar from '../components/Navbar.vue'
import Icon from '../components/Icon.vue'
import api from '../api'

export default {
  name: 'DashboardView',
  components: { Navbar, Icon },
  data() {
    return {
      stats: {},
      statsLoaded: false,
      hoveredSlice: null,
      currentTime: '',
      timeInterval: null,
    }
  },
  computed: {
    ...mapGetters(['currentUser', 'isAdmin']),
    user() { return this.currentUser },

    userInitial() {
      const n = this.user?.nombreusuario || this.user?.username || '?'
      return n[0].toUpperCase()
    },

    statCards() {
      const s = this.stats
      const cards = [
        { key: 'cajas', iconName: 'box',       label: 'Cajas activas',  value: s.cajas,            display: s.cajas            ?? '—', glow: 'rgba(128,32,29,.08)' },
        { key: 'ratas', iconName: 'rat',        label: 'Ratas totales',  value: s.ratas_total,      display: s.ratas_total      ?? '—', sub: s.ratas_macho !== undefined ? `${s.ratas_macho}M · ${s.ratas_hembra}H` : null, glow: 'rgba(26,26,46,.06)' },
        { key: 'exp',   iconName: 'clipboard',  label: 'Experimentos',   value: s.experimentos_total, display: s.experimentos_total ?? '—', sub: s.experimentos_mes !== undefined ? `${s.experimentos_mes} este mes` : null, glow: 'rgba(100,149,237,.07)' },
      ]
      if (this.isAdmin)
        cards.push({ key: 'users', iconName: 'users', label: 'Usuarios', value: s.usuarios, display: s.usuarios ?? '—', glow: 'rgba(76,175,80,.07)' })
      return cards
    },

    navCards() {
      const cards = [
        { to: '/inventario',  iconName: 'rat',       label: 'Animales',      desc: 'Cajas y ratas',             bg: 'rgba(128,32,29,.1)' },
        { to: '/experimento', iconName: 'clipboard', label: 'Experimentos',  desc: 'Bitácora de registros',     bg: 'rgba(26,26,46,.08)' },
        { to: '/catalogos',   iconName: 'book',      label: 'Catálogos',     desc: 'Anestésicos y tejidos',     bg: 'rgba(100,149,237,.1)' },
      ]
      if (this.isAdmin)
        cards.push({ to: '/usuarios', iconName: 'users', label: 'Usuarios', desc: 'Cuentas y roles', bg: 'rgba(76,175,80,.1)' })
      return cards
    },

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
          total: d.total, pct: Math.round(pct * 100), color: colors[i % colors.length],
          startAngle: start, endAngle: startAngle,
        }
      })
    },

    ratioSexo() {
      const macho  = this.stats.ratas_macho  ?? 0
      const hembra = this.stats.ratas_hembra ?? 0
      const total  = macho + hembra
      if (!total) return [
        { label: 'Macho',  count: 0, pct: 0, color: '#6a8caf' },
        { label: 'Hembra', count: 0, pct: 0, color: '#c5708a' },
      ]
      return [
        { label: 'Macho',  count: macho,  pct: Math.round((macho  / total) * 100), color: '#6a8caf' },
        { label: 'Hembra', count: hembra, pct: Math.round((hembra / total) * 100), color: '#c5708a' },
      ]
    },
  },

  async created() {
    this.updateTime()
    this.timeInterval = setInterval(this.updateTime, 1000)
    try {
      const res = await api.get('stats/')
      this.stats = res.data
      this.$nextTick(() => { this.statsLoaded = true; this.animateCounters() })
    } catch { /* no bloqueante */ }
  },

  beforeUnmount() { clearInterval(this.timeInterval) },

  methods: {
    fmtFecha(d) {
      if (!d) return '—'
      const [y, m, day] = d.split('-')
      return `${day}/${m}/${y}`
    },

    updateTime() {
      this.currentTime = new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
    },

    animateCounters() {
      document.querySelectorAll('.stat-num[data-target]').forEach(el => {
        const target = parseInt(el.dataset.target)
        if (isNaN(target)) return
        let start = 0
        const step = ts => {
          if (!start) start = ts
          const prog = Math.min((ts - start) / 900, 1)
          el.textContent = Math.floor((1 - Math.pow(1 - prog, 3)) * target)
          if (prog < 1) requestAnimationFrame(step)
          else el.textContent = target
        }
        requestAnimationFrame(step)
      })
    },

    particleStyle(n) {
      const p = [
        { top: '15%', left: '10%', size: '5px', delay: '0s',   dur: '4s'   },
        { top: '70%', left: '80%', size: '4px', delay: '.6s',  dur: '5.5s' },
        { top: '40%', left: '60%', size: '6px', delay: '1.2s', dur: '3.8s' },
        { top: '80%', left: '20%', size: '4px', delay: '.3s',  dur: '6s'   },
      ][n - 1] || {}
      return { width: p.size, height: p.size, top: p.top, left: p.left, animationDelay: p.delay, animationDuration: p.dur }
    },

    polarToXY(cx, cy, r, angleDeg) {
      const rad = (angleDeg - 90) * (Math.PI / 180)
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
    },

    pieSlicePath(slice, cx, cy, r) {
      if (slice.pct >= 100) return `M ${cx} ${cy-r} A ${r} ${r} 0 1 1 ${cx-.01} ${cy-r} Z`
      const s = this.polarToXY(cx, cy, r, slice.startAngle)
      const e = this.polarToXY(cx, cy, r, slice.endAngle)
      return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${(slice.endAngle-slice.startAngle)>180?1:0} 1 ${e.x} ${e.y} Z`
    },
  },
}
</script>

<style scoped>
/* ════════════════════════════════════════════════════════
   LAYOUT PRINCIPAL — dos columnas en PC, una en móvil
   ════════════════════════════════════════════════════════ */
.dashboard {
  max-width: 1140px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 3rem;
  overflow-x: hidden;
}

.dash-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1.25rem;
  align-items: start;
}

/* ════════════════════════════════════
   SIDEBAR IZQUIERDA
   ════════════════════════════════════ */
.dash-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: sticky;
  top: 80px;
  animation: fadeSlideUp .4s ease both;
}

/* Tarjeta de usuario */
.user-card {
  position: relative;
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 55%, #80201d 100%);
  border-radius: 16px;
  padding: 1.5rem 1.1rem 1.25rem;
  text-align: center;
  overflow: hidden;
  color: #fff;
}

.user-card-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,.18);
  animation: floatParticle var(--dur,4s) ease-in-out var(--delay,0s) infinite alternate;
}

@keyframes floatParticle {
  from { transform: translateY(0); opacity: .4; }
  to   { transform: translateY(-14px); opacity: .85; }
}

.user-avatar-big {
  position: relative;
  z-index: 1;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, rgba(255,255,255,.25), rgba(255,255,255,.1));
  border: 2px solid rgba(255,255,255,.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 auto .75rem;
  animation: avatarPop .5s cubic-bezier(.22,.68,0,1.3) both;
}

@keyframes avatarPop {
  from { transform: scale(0) rotate(-20deg); opacity: 0; }
  to   { transform: scale(1) rotate(0deg); opacity: 1; }
}

.user-card-name {
  position: relative;
  z-index: 1;
  font-size: .88rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: .35rem;
  word-break: break-word;
}

.user-card-role {
  position: relative;
  z-index: 1;
  display: inline-block;
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.25);
  color: rgba(255,255,255,.9);
  font-size: .7rem;
  padding: 2px 10px;
  border-radius: 99px;
  margin-bottom: .65rem;
}

.user-card-time {
  position: relative;
  z-index: 1;
  font-size: .78rem;
  color: rgba(255,255,255,.5);
  font-variant-numeric: tabular-nums;
  letter-spacing: .04em;
  animation: fadeIn .6s ease .3s both;
}

/* Botón de registro semanal */
.btn-semanal {
  display: flex;
  align-items: center;
  gap: .6rem;
  width: 100%;
  background: #80201d;
  color: #fff;
  border: none;
  padding: .72rem 1rem;
  border-radius: 12px;
  font-size: .88rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  position: relative;
  overflow: hidden;
  transition: background .18s, transform .12s, box-shadow .18s;
  box-shadow: 0 3px 10px rgba(128,32,29,.3);
}

/* Shimmer idle — invita al clic */
.btn-semanal::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 55%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent);
  animation: shimmer 3s ease 1s infinite;
}

@keyframes shimmer {
  0%   { left: -100%; }
  100% { left: 200%; }
}

.btn-semanal:hover {
  background: #9e2a26;
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(128,32,29,.4);
}

.btn-semanal:active { transform: scale(.97); }

.btn-semanal-arrow {
  margin-left: auto;
  transition: transform .2s;
}

.btn-semanal:hover .btn-semanal-arrow { transform: translateX(3px); }

/* Módulos en sidebar */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: .6rem;
}

.sidebar-card {
  display: flex;
  align-items: center;
  gap: .75rem;
  background: #fff;
  border: 1.5px solid #e8e8ee;
  border-radius: 12px;
  padding: .72rem .9rem;
  text-decoration: none;
  transition: transform .18s, box-shadow .18s, border-color .18s;
  position: relative;
  overflow: hidden;
  opacity: 0;
  animation: fadeSlideUp .4s ease both;
}

.sidebar-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 14px rgba(0,0,0,.08);
  border-color: #80201d;
}

.sidebar-card::after {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: #80201d;
  border-radius: 3px 0 0 3px;
  transform: scaleY(0);
  transition: transform .2s ease;
}

.sidebar-card:hover::after { transform: scaleY(1); }

.sidebar-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #80201d;
  transition: transform .18s;
}

.sidebar-card:hover .sidebar-card-icon { transform: scale(1.1) rotate(-4deg); }

.sidebar-card-body {
  flex: 1;
  min-width: 0;
}

.sidebar-card-label {
  display: block;
  font-size: .84rem;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-card-desc {
  display: block;
  font-size: .72rem;
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-card-arrow {
  color: #ccc;
  flex-shrink: 0;
  transition: color .18s, transform .18s;
}

.sidebar-card:hover .sidebar-card-arrow { color: #80201d; transform: translateX(2px); }

/* ════════════════════════════════════
   ÁREA PRINCIPAL DERECHA
   ════════════════════════════════════ */
.dash-main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  animation: fadeSlideUp .4s ease .05s both;
}

/* ── Stats grid ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
  gap: .85rem;
}

.stat-card {
  background: #fff;
  border: 1.5px solid #e8e8ee;
  border-radius: 14px;
  padding: 1.1rem 1.2rem;
  display: flex;
  gap: .8rem;
  align-items: center;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(16px);
  transition: transform .2s, box-shadow .2s, border-color .2s;
  cursor: default;
}

.stat-card--loaded {
  opacity: 1;
  transform: translateY(0);
  animation: cardIn .45s cubic-bezier(.22,.68,0,1.15) both;
}

@keyframes cardIn {
  0%   { opacity: 0; transform: translateY(18px) scale(.95); }
  60%  { transform: translateY(-2px) scale(1.01); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.stat-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 22px rgba(0,0,0,.09);
  border-color: #80201d;
}

.stat-glow {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  opacity: 0;
  transition: opacity .3s;
  pointer-events: none;
}

.stat-card:hover .stat-glow { opacity: 1; }

.stat-icon {
  flex-shrink: 0;
  color: #80201d;
  transition: transform .2s;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,.1));
}

.icon-cajas { animation: wobble  3.5s ease-in-out 1s  infinite; color: #80201d; }
.icon-ratas { animation: ratRun  2.2s ease-in-out .3s infinite; color: #1a1a2e; }
.icon-exp   { animation: pulse   2.8s ease-in-out .7s infinite; color: #6495ed; }
.icon-users { animation: wobble  4s   ease-in-out 1.2s infinite; color: #4caf50; }

@keyframes wobble {
  0%,100%  { transform: rotate(0deg); }
  20%      { transform: rotate(-8deg); }
  40%      { transform: rotate(8deg); }
  60%      { transform: rotate(-4deg); }
  80%      { transform: rotate(4deg); }
}
@keyframes ratRun {
  0%,100%  { transform: translateX(0) scaleX(1); }
  25%      { transform: translateX(4px) scaleX(1); }
  50%      { transform: translateX(-3px) scaleX(-1); }
  75%      { transform: translateX(2px) scaleX(-1); }
}
@keyframes pulse {
  0%,100% { transform: scale(1); }
  50%     { transform: scale(1.12); }
}

.stat-card:hover .stat-icon {
  transform: scale(1.2) rotate(-5deg) !important;
  animation-play-state: paused;
}

.stat-val {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-lbl { font-size: .78rem; color: #888; margin-top: 3px; }
.stat-sub { display: block; font-size: .72rem; color: #bbb; margin-top: 2px; }

/* ── Charts ── */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.pie-card {
  background: #fff;
  border: 1.5px solid #e8e8ee;
  border-radius: 14px;
  padding: 1.1rem 1.2rem;
  animation: fadeSlideUp .4s ease .2s both;
  transition: box-shadow .2s;
}

.pie-card:hover { box-shadow: 0 5px 18px rgba(0,0,0,.07); }

.pie-title {
  font-size: .82rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: .45rem;
}

.pie-title-icon { color: #80201d; animation: pulse 3s ease-in-out infinite; }

.pie-wrap {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.pie-svg {
  overflow: visible;
  filter: drop-shadow(0 3px 8px rgba(0,0,0,.1));
  flex-shrink: 0;
}

.pie-slice {
  transition: transform .2s ease, filter .2s;
  transform-origin: 100px 100px;
  animation: sliceReveal .55s ease both;
}

@keyframes sliceReveal {
  from { opacity: 0; transform: scale(.6); }
  to   { opacity: 1; transform: scale(1); }
}

.pie-slice--hover {
  transform: scale(1.06);
  filter: brightness(1.1) drop-shadow(0 2px 6px rgba(0,0,0,.2));
}

.donut-text-main { font-size: 18px; font-weight: 700; fill: #1a1a2e; font-family: inherit; }
.donut-text-sub  { font-size: 8px; fill: #aaa; font-family: inherit; }

.pie-legend { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 100px; }

.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: .76rem;
  cursor: pointer;
  padding: .2rem .3rem;
  border-radius: 5px;
  transition: background .15s, transform .15s;
  animation: fadeSlideUp .3s ease both;
}

.legend-item:hover, .legend-item--active { background: #f5f5f9; transform: translateX(3px); }
.legend-item--gray { opacity: .4; cursor: default; }
.legend-item--gray:hover { background: none; transform: none; }

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
  transition: transform .15s;
}

.legend-item--active .legend-dot { transform: scale(1.3); }
.legend-label { color: #444; flex: 1; }
.legend-val   { color: #999; white-space: nowrap; }

/* Ratio ratas por sexo */
.ratio-card { display: flex; flex-direction: column; justify-content: space-between; }

.ratio-body { display: flex; flex-direction: column; gap: .95rem; flex: 1; justify-content: center; }

.ratio-row { animation: fadeSlideUp .35s ease both; }

.ratio-row-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: .35rem;
  font-size: .82rem;
}

.ratio-label { display: flex; align-items: center; gap: 6px; color: #444; font-weight: 500; }

.ratio-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

.ratio-val { font-weight: 700; color: #1a1a2e; font-variant-numeric: tabular-nums; }
.ratio-pct { font-weight: 400; color: #bbb; font-size: .75rem; }

.ratio-bar-track { height: 9px; background: #f0f0f4; border-radius: 99px; overflow: hidden; }

.ratio-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width .6s cubic-bezier(.22,.68,0,1.1);
  animation: barGrow .7s ease both;
}

@keyframes barGrow { from { width: 0% !important; } }

.ratio-total {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 1rem;
  padding-top: .85rem;
  border-top: 1px solid #f0f0f4;
  font-size: .76rem;
  color: #aaa;
}

.ratio-total strong { color: #1a1a2e; }

/* ════════════════════════════════════
   TARJETAS RESUMEN (3 abajo)
   ════════════════════════════════════ */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.summary-card {
  background: #fff;
  border: 1.5px solid #e8e8ee;
  border-radius: 14px;
  padding: 1.1rem 1.2rem;
  animation: fadeSlideUp .4s ease .25s both;
  transition: box-shadow .2s, transform .2s, border-color .2s;
}

.summary-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0,0,0,.08);
}

.summary-card--alert {
  border-color: #f3c2c2;
  background: linear-gradient(180deg, #fffafa, #fff);
}

.summary-head {
  display: flex;
  align-items: center;
  gap: .6rem;
  margin-bottom: .85rem;
}

.summary-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-icon--box   { background: rgba(128,32,29,.1);  color: #80201d; }
.summary-icon--exp   { background: rgba(26,26,46,.08);  color: #1a1a2e; }
.summary-icon--ok    { background: rgba(76,175,80,.12); color: #2e7d32; }
.summary-icon--alert {
  background: rgba(198,40,40,.12);
  color: #c62828;
  animation: alertPulse 1.8s ease-out infinite;
}

@keyframes alertPulse {
  0%   { box-shadow: 0 0 0 0 rgba(198,40,40,.4); }
  70%  { box-shadow: 0 0 0 7px rgba(198,40,40,0); }
  100% { box-shadow: 0 0 0 0 rgba(198,40,40,0); }
}

.summary-title {
  font-size: .8rem;
  font-weight: 600;
  color: #888;
}

.summary-body { display: flex; flex-direction: column; gap: .25rem; }

.summary-main {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-main--alert { color: #c62828; display: flex; align-items: center; gap: .5rem; }
.summary-main--ok    { color: #2e7d32; }

.summary-pct-drop {
  font-size: .82rem;
  font-weight: 700;
  background: rgba(198,40,40,.12);
  color: #c62828;
  padding: 1px 8px;
  border-radius: 99px;
}

.summary-detail {
  font-size: .82rem;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-sub {
  font-size: .74rem;
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-empty {
  font-size: .82rem;
  color: #bbb;
  padding: .5rem 0;
}

/* ── Rata idle ── */
.idle-rat {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin-top: 2rem;
  opacity: .2;
  width: fit-content;
  animation: ratWalk 7s ease-in-out infinite;
  user-select: none;
  pointer-events: none;
  color: #888;
}

.idle-rat-icon { animation: ratBodyBob .4s ease-in-out infinite alternate; display: inline-block; }
.idle-rat-trail { font-size: .65rem; color: #aaa; letter-spacing: 4px; animation: trailFade 1.2s ease-in-out infinite; }

/* Camina un recorrido corto y acotado (no usa 100vw, que provocaba
   overflow horizontal y barras de scroll creciendo solas). */
@keyframes ratWalk {
  0%   { transform: translateX(0); }
  45%  { transform: translateX(180px); }
  50%  { transform: translateX(180px) scaleX(-1); }
  95%  { transform: translateX(0) scaleX(-1); }
  100% { transform: translateX(0); }
}

@keyframes ratBodyBob {
  from { transform: translateY(0) rotate(-3deg); }
  to   { transform: translateY(-3px) rotate(3deg); }
}

@keyframes trailFade {
  0%,100% { opacity: .3; }
  50%     { opacity: 1; }
}

/* ── Keyframes compartidos ── */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ════════════════════════════════════
   RESPONSIVE
   ════════════════════════════════════ */

/* Tablet: sidebar se hace horizontal arriba */
@media (max-width: 900px) {
  .dash-layout {
    grid-template-columns: 1fr;
  }

  .dash-sidebar {
    position: static;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .85rem;
  }

  .user-card { grid-column: 1 / -1; }

  .btn-semanal { grid-column: 1 / -1; }

  .sidebar-nav {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: .6rem;
  }
}

@media (max-width: 600px) {
  .dashboard { padding: 1rem .85rem 2.5rem; }

  .dash-layout { gap: .85rem; }

  .dash-sidebar { grid-template-columns: 1fr; }

  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: .6rem; }
  .stat-card { padding: .9rem .95rem; gap: .65rem; }
  .stat-val  { font-size: 1.5rem; }

  .charts-grid { grid-template-columns: 1fr; }

  .pie-wrap { flex-direction: column; align-items: flex-start; }
  .pie-svg  { align-self: center; }

  .summary-grid { grid-template-columns: 1fr; }

  .idle-rat { display: none; }
}
</style>
