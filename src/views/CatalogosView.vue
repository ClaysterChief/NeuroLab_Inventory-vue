<template>
  <div class="page-wrapper">
    <Navbar />
    <main class="content">
      <div class="page-title">
        <h1>Catálogos</h1>
        <p class="page-sub">Administra los datos de referencia del sistema.</p>
      </div>

      <!-- ── Tabs ──────────────────────────────────────────── -->
      <div class="tabs">
        <button v-for="t in tabs" :key="t.key" class="tab" :class="{ active: tabActiva === t.key }"
          @click="cambiarTab(t.key)">
          <span class="tab-icon">{{ t.icon }}</span>
          {{ t.label }}
          <span v-if="counts[t.key] !== undefined" class="tab-count">{{ counts[t.key] }}</span>
        </button>
        <span class="tab-indicator" :style="indicatorStyle"></span>
      </div>

      <transition :name="tabDirection" mode="out-in">
        <div :key="tabActiva">

          <!-- ══ ANESTÉSICOS ═══════════════════════════════════ -->
          <div v-if="tabActiva === 'anestesicos'">
            <div class="tabla-header">
              <h2>Anestésicos</h2>
              <button v-if="isEncargado" class="btn-primary btn-breathe" @click="abrirModal('anestesicos')">+ Nuevo</button>
            </div>
            <div class="table-card">
              <div v-if="loading.anestesicos" class="skeleton-table">
                <div class="skeleton-row" v-for="n in 4" :key="n">
                  <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
                  <div class="skeleton skeleton-cell skeleton-cell--md"></div>
                  <div class="skeleton skeleton-cell skeleton-cell--lg"></div>
                </div>
              </div>
              <div v-else-if="error.anestesicos" class="state-msg error shake-error">{{ error.anestesicos }}</div>
              <table v-else class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th v-if="isEncargado">Acciones</th>
                  </tr>
                </thead>
                <transition-group name="list" tag="tbody">
                  <tr v-for="item in anestesicos" :key="item.idanestesico"
                      :class="{ 'row-removing': removing.anestesicos === item.idanestesico }">
                    <td>{{ item.idanestesico }}</td>
                    <td>{{ item.nombreanestesico }}</td>
                    <td>{{ item.descripcion || '—' }}</td>
                    <td v-if="isEncargado" class="actions">
                      <button class="btn-icon" @click="abrirModal('anestesicos', item)">✏️</button>
                      <button v-if="isAdmin" class="btn-icon danger" @click="eliminar('anestesicos', item)">🗑️</button>
                    </td>
                  </tr>
                </transition-group>
              </table>
              <div v-if="!loading.anestesicos && !error.anestesicos && !anestesicos.length" class="empty-state">
                <span class="empty-state-icon">💉</span>
                No hay registros.
              </div>
            </div>
          </div>

          <!-- ══ TEJIDOS ════════════════════════════════════════ -->
          <div v-if="tabActiva === 'tejidos'">
            <div class="tabla-header">
              <h2>Tejidos</h2>
              <button v-if="isEncargado" class="btn-primary btn-breathe" @click="abrirModal('tejidos')">+ Nuevo</button>
            </div>
            <div class="table-card">
              <div v-if="loading.tejidos" class="skeleton-table">
                <div class="skeleton-row" v-for="n in 4" :key="n">
                  <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
                  <div class="skeleton skeleton-cell skeleton-cell--md"></div>
                  <div class="skeleton skeleton-cell skeleton-cell--lg"></div>
                </div>
              </div>
              <div v-else-if="error.tejidos" class="state-msg error shake-error">{{ error.tejidos }}</div>
              <table v-else class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th v-if="isEncargado">Acciones</th>
                  </tr>
                </thead>
                <transition-group name="list" tag="tbody">
                  <tr v-for="item in tejidos" :key="item.idtejido"
                      :class="{ 'row-removing': removing.tejidos === item.idtejido }">
                    <td>{{ item.idtejido }}</td>
                    <td>{{ item.nombretejido }}</td>
                    <td>{{ item.descripcion || '—' }}</td>
                    <td v-if="isEncargado" class="actions">
                      <button class="btn-icon" @click="abrirModal('tejidos', item)">✏️</button>
                      <button v-if="isAdmin" class="btn-icon danger" @click="eliminar('tejidos', item)">🗑️</button>
                    </td>
                  </tr>
                </transition-group>
              </table>
              <div v-if="!loading.tejidos && !error.tejidos && !tejidos.length" class="empty-state">
                <span class="empty-state-icon">🧬</span>
                No hay registros.
              </div>
            </div>
          </div>

          <!-- ══ CONDICIONES ════════════════════════════════════ -->
          <div v-if="tabActiva === 'condiciones'">
            <div class="tabla-header">
              <h2>Condiciones</h2>
              <button v-if="isEncargado" class="btn-primary btn-breathe" @click="abrirModal('condiciones')">+ Nuevo</button>
            </div>
            <div class="table-card">
              <div v-if="loading.condiciones" class="skeleton-table">
                <div class="skeleton-row" v-for="n in 4" :key="n">
                  <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
                  <div class="skeleton skeleton-cell skeleton-cell--md"></div>
                  <div class="skeleton skeleton-cell skeleton-cell--lg"></div>
                </div>
              </div>
              <div v-else-if="error.condiciones" class="state-msg error shake-error">{{ error.condiciones }}</div>
              <table v-else class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th v-if="isEncargado">Acciones</th>
                  </tr>
                </thead>
                <transition-group name="list" tag="tbody">
                  <tr v-for="item in condiciones" :key="item.idcondicion"
                      :class="{ 'row-removing': removing.condiciones === item.idcondicion }">
                    <td>{{ item.idcondicion }}</td>
                    <td>{{ item.nombrecondicion }}</td>
                    <td>{{ item.descripcion || '—' }}</td>
                    <td v-if="isEncargado" class="actions">
                      <button class="btn-icon" @click="abrirModal('condiciones', item)">✏️</button>
                      <button v-if="isAdmin" class="btn-icon danger" @click="eliminar('condiciones', item)">🗑️</button>
                    </td>
                  </tr>
                </transition-group>
              </table>
              <div v-if="!loading.condiciones && !error.condiciones && !condiciones.length" class="empty-state">
                <span class="empty-state-icon">🩺</span>
                No hay registros.
              </div>
            </div>
          </div>

          <!-- ══ UBICACIONES ══════════════════════════════════════════ -->
          <div v-if="tabActiva === 'ubicaciones'">
            <div class="tabla-header">
              <h2>Ubicaciones</h2>
              <button v-if="isEncargado" class="btn-primary btn-breathe" @click="abrirModal('ubicaciones')">+ Nueva</button>
            </div>
            <div class="table-card">
              <div v-if="loading.ubicaciones" class="skeleton-table">
                <div class="skeleton-row" v-for="n in 4" :key="n">
                  <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
                  <div class="skeleton skeleton-cell skeleton-cell--md"></div>
                  <div class="skeleton skeleton-cell skeleton-cell--lg"></div>
                </div>
              </div>
              <div v-else-if="error.ubicaciones" class="state-msg error shake-error">{{ error.ubicaciones }}</div>
              <table v-else class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th v-if="isEncargado">Acciones</th>
                  </tr>
                </thead>
                <transition-group name="list" tag="tbody">
                  <tr v-for="item in ubicaciones" :key="item.idubicacion"
                      :class="{ 'row-removing': removing.ubicaciones === item.idubicacion }">
                    <td>{{ item.idubicacion }}</td>
                    <td>{{ item.nombreubicacion }}</td>
                    <td>{{ item.descripcion || '—' }}</td>
                    <td v-if="isEncargado" class="actions">
                      <button class="btn-icon" @click="abrirModal('ubicaciones', item)">✏️</button>
                      <button v-if="isAdmin" class="btn-icon danger" @click="eliminar('ubicaciones', item)">🗑️</button>
                    </td>
                  </tr>
                </transition-group>
              </table>
              <div v-if="!loading.ubicaciones && !error.ubicaciones && !ubicaciones.length" class="empty-state">
                <span class="empty-state-icon">📍</span>
                No hay ubicaciones registradas.
              </div>
            </div>
          </div>

        </div>
      </transition>

      <!-- ══ MODAL ══════════════════════════════════════════ -->
      <transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <transition name="modal-pop" appear>
            <div class="modal" v-if="showModal">
              <h2>{{ editando ? `Editar ${tabLabel}` : `Nuevo ${tabLabel}` }}</h2>
              <form @submit.prevent="guardar">
                <div class="field">
                  <label>Nombre <span class="req">*</span></label>
                  <input v-model="form.nombre" required autofocus />
                </div>
                <div class="field mt">
                  <label>Descripción</label>
                  <textarea v-model="form.descripcion" rows="3" />
                </div>
                <p v-if="errorModal" class="form-error shake-error" :key="errorModalKey">{{ errorModal }}</p>
                <div class="modal-actions">
                  <button type="button" class="btn-secondary" @click="showModal = false">Cancelar</button>
                  <button type="submit" class="btn-primary" :disabled="saving">
                    <span v-if="saving" class="spinner-bounce">⏳</span>
                    <span v-else>Guardar</span>
                  </button>
                </div>
              </form>
            </div>
          </transition>
        </div>
      </transition>

    </main>
  </div>
</template>

<script>
import Navbar from '../components/Navbar.vue'
import api from '../api'
import { mapGetters } from 'vuex'

const CONFIG = {
  anestesicos: { endpoint: 'anestesicos/', idKey: 'idanestesico', nombreKey: 'nombreanestesico', label: 'anestésico' },
  tejidos: { endpoint: 'tejidos/', idKey: 'idtejido', nombreKey: 'nombretejido', label: 'tejido' },
  condiciones: { endpoint: 'condiciones/', idKey: 'idcondicion', nombreKey: 'nombrecondicion', label: 'condición' },
  ubicaciones: { endpoint: 'ubicaciones/', idKey: 'idubicacion', nombreKey: 'nombreubicacion', label: 'ubicación' },
}

export default {
  name: 'CatalogosView',
  components: { Navbar },
  data() {
    return {
      tabActiva: 'anestesicos',
      tabDirection: 'tab-fade',
      tabs: [
        { key: 'anestesicos', label: 'Anestésicos', icon: '💉' },
        { key: 'tejidos', label: 'Tejidos', icon: '🧬' },
        { key: 'condiciones', label: 'Condiciones', icon: '🩺' },
        { key: 'ubicaciones', label: 'Ubicaciones', icon: '📍' },
      ],
      anestesicos: [], tejidos: [], condiciones: [], ubicaciones: [],
      loading: { anestesicos: true, tejidos: true, condiciones: true, ubicaciones: true },
      error: { anestesicos: null, tejidos: null, condiciones: null, ubicaciones: null },
      removing: { anestesicos: null, tejidos: null, condiciones: null, ubicaciones: null },
      showModal: false,
      editando: false,
      saving: false,
      errorModal: null,
      errorModalKey: 0,
      catalogoActivo: null,
      itemEditando: null,
      form: { nombre: '', descripcion: '' },
    }
  },
  computed: {
    ...mapGetters(['isEncargado', 'isAdmin']),
    tabLabel() { return CONFIG[this.catalogoActivo]?.label ?? '' },
    counts() {
      return {
        anestesicos: this.anestesicos.length,
        tejidos: this.tejidos.length,
        condiciones: this.condiciones.length,
        ubicaciones: this.ubicaciones.length,
      }
    },
    indicatorStyle() {
      const idx = this.tabs.findIndex(t => t.key === this.tabActiva)
      return {
        transform: `translateX(${idx * 100}%)`,
        width: `${100 / this.tabs.length}%`,
      }
    },
  },
  async created() {
    await Promise.all([
      this.fetchCatalogo('anestesicos'),
      this.fetchCatalogo('tejidos'),
      this.fetchCatalogo('condiciones'),
      this.fetchCatalogo('ubicaciones'),
    ])
  },
  methods: {
    cambiarTab(key) {
      const oldIdx = this.tabs.findIndex(t => t.key === this.tabActiva)
      const newIdx = this.tabs.findIndex(t => t.key === key)
      this.tabDirection = newIdx > oldIdx ? 'tab-fade' : 'tab-fade-rev'
      this.tabActiva = key
    },

    _showError(msg) {
      this.errorModal = msg
      this.errorModalKey++
    },

    async fetchCatalogo(cat) {
      this.loading[cat] = true
      this.error[cat] = null
      try {
        const res = await api.get(CONFIG[cat].endpoint)
        this[cat] = res.data
      } catch {
        this.error[cat] = `No se pudo cargar ${cat}.`
      } finally {
        this.loading[cat] = false
      }
    },
    abrirModal(cat, item = null) {
      this.catalogoActivo = cat
      this.editando = !!item
      this.itemEditando = item
      this.errorModal = null
      const cfg = CONFIG[cat]
      this.form = item
        ? { nombre: item[cfg.nombreKey], descripcion: item.descripcion ?? '' }
        : { nombre: '', descripcion: '' }
      this.showModal = true
    },
    async guardar() {
      this.saving = true; this.errorModal = null
      const cfg = CONFIG[this.catalogoActivo]
      const payload = {
        [cfg.nombreKey]: this.form.nombre,
        descripcion: this.form.descripcion,
      }
      try {
        if (this.editando) await api.put(`${cfg.endpoint}${this.itemEditando[cfg.idKey]}/`, payload)
        else await api.post(cfg.endpoint, payload)
        this.showModal = false
        await this.fetchCatalogo(this.catalogoActivo)
        this.$toast.success(this.editando ? 'Registro actualizado.' : 'Registro creado.')
      } catch (err) {
        const data = err.response?.data
        this._showError(data
          ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ')
          : 'Error al guardar.')
      } finally { this.saving = false }
    },

    async eliminar(cat, item) {
      const cfg = CONFIG[cat]
      const ok = await this.$confirm(
        `¿Eliminar "${item[cfg.nombreKey]}"? No se puede deshacer.`,
        'Eliminar registro'
      )
      if (!ok) return
      this.removing[cat] = item[cfg.idKey]
      try {
        await api.delete(`${cfg.endpoint}${item[cfg.idKey]}/`)
        setTimeout(async () => {
          await this.fetchCatalogo(cat)
          this.removing[cat] = null
          this.$toast.success('Registro eliminado.')
        }, 320)
      } catch {
        this.removing[cat] = null
        this.$toast.error('No se pudo eliminar. El registro puede estar en uso.')
      }
    },
  },
}
</script>

<style scoped>
.content {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* ── Tabs mejoradas con indicador deslizante ── */
.tabs {
  position: relative;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tab-icon {
  font-size: .95rem;
}

.tab-count {
  background: rgba(128,32,29,.12);
  color: #80201d;
  font-size: .68rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 99px;
  transition: transform .15s;
}

.tab.active .tab-count {
  background: #80201d;
  color: #fff;
}

.tab-indicator {
  display: none; /* el subrayado de .tab.active ya cumple esta función visualmente */
}

/* ── Transición de tabs (dirección) ── */
.tab-fade-enter-active, .tab-fade-leave-active,
.tab-fade-rev-enter-active, .tab-fade-rev-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}
.tab-fade-enter-from     { opacity: 0; transform: translateX(16px); }
.tab-fade-leave-to       { opacity: 0; transform: translateX(-16px); }
.tab-fade-rev-enter-from { opacity: 0; transform: translateX(-16px); }
.tab-fade-rev-leave-to   { opacity: 0; transform: translateX(16px); }

.skeleton-table { padding: .5rem 0; }
.skeleton-table .skeleton-row { border-bottom: 1px solid #f3f3f6; }

@media (max-width: 640px) {
  .content { padding: 1rem .85rem; }
}
</style>
