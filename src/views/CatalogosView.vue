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
        <button
          v-for="t in tabs" :key="t.key"
          class="tab" :class="{ active: tabActiva === t.key }"
          @click="tabActiva = t.key"
        >{{ t.label }}</button>
      </div>

      <!-- ══ ANESTÉSICOS ═══════════════════════════════════ -->
      <div v-if="tabActiva === 'anestesicos'">
        <div class="tabla-header">
          <h2>Anestésicos</h2>
          <button v-if="isEncargado" class="btn-primary" @click="abrirModal('anestesicos')">+ Nuevo</button>
        </div>
        <div class="table-card">
          <div v-if="loading.anestesicos" class="state-msg">Cargando…</div>
          <div v-else-if="error.anestesicos" class="state-msg error">{{ error.anestesicos }}</div>
          <table v-else class="data-table">
            <thead><tr><th>#</th><th>Nombre</th><th>Descripción</th><th v-if="isEncargado">Acciones</th></tr></thead>
            <tbody>
              <tr v-for="item in anestesicos" :key="item.idanestesico">
                <td>{{ item.idanestesico }}</td>
                <td>{{ item.nombreanestesico }}</td>
                <td>{{ item.descripcion || '—' }}</td>
                <td v-if="isEncargado" class="actions">
                  <button class="btn-icon" @click="abrirModal('anestesicos', item)">✏️</button>
                  <button v-if="isAdmin" class="btn-icon danger" @click="eliminar('anestesicos', item)">🗑️</button>
                </td>
              </tr>
              <tr v-if="!anestesicos.length"><td colspan="4" class="empty-row">No hay registros.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══ TEJIDOS ════════════════════════════════════════ -->
      <div v-if="tabActiva === 'tejidos'">
        <div class="tabla-header">
          <h2>Tejidos</h2>
          <button v-if="isEncargado" class="btn-primary" @click="abrirModal('tejidos')">+ Nuevo</button>
        </div>
        <div class="table-card">
          <div v-if="loading.tejidos" class="state-msg">Cargando…</div>
          <div v-else-if="error.tejidos" class="state-msg error">{{ error.tejidos }}</div>
          <table v-else class="data-table">
            <thead><tr><th>#</th><th>Nombre</th><th>Descripción</th><th v-if="isEncargado">Acciones</th></tr></thead>
            <tbody>
              <tr v-for="item in tejidos" :key="item.idtejido">
                <td>{{ item.idtejido }}</td>
                <td>{{ item.nombretejido }}</td>
                <td>{{ item.descripcion || '—' }}</td>
                <td v-if="isEncargado" class="actions">
                  <button class="btn-icon" @click="abrirModal('tejidos', item)">✏️</button>
                  <button v-if="isAdmin" class="btn-icon danger" @click="eliminar('tejidos', item)">🗑️</button>
                </td>
              </tr>
              <tr v-if="!tejidos.length"><td colspan="4" class="empty-row">No hay registros.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══ CONDICIONES ════════════════════════════════════ -->
      <div v-if="tabActiva === 'condiciones'">
        <div class="tabla-header">
          <h2>Condiciones</h2>
          <button v-if="isEncargado" class="btn-primary" @click="abrirModal('condiciones')">+ Nuevo</button>
        </div>
        <div class="table-card">
          <div v-if="loading.condiciones" class="state-msg">Cargando…</div>
          <div v-else-if="error.condiciones" class="state-msg error">{{ error.condiciones }}</div>
          <table v-else class="data-table">
            <thead><tr><th>#</th><th>Nombre</th><th>Descripción</th><th v-if="isEncargado">Acciones</th></tr></thead>
            <tbody>
              <tr v-for="item in condiciones" :key="item.idcondicion">
                <td>{{ item.idcondicion }}</td>
                <td>{{ item.nombrecondicion }}</td>
                <td>{{ item.descripcion || '—' }}</td>
                <td v-if="isEncargado" class="actions">
                  <button class="btn-icon" @click="abrirModal('condiciones', item)">✏️</button>
                  <button v-if="isAdmin" class="btn-icon danger" @click="eliminar('condiciones', item)">🗑️</button>
                </td>
              </tr>
              <tr v-if="!condiciones.length"><td colspan="4" class="empty-row">No hay registros.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══ MODAL ══════════════════════════════════════════ -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
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
            <p v-if="errorModal" class="form-error">{{ errorModal }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showModal = false">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>

    </main>
  </div>
</template>

<script>
import Navbar from '../components/Navbar.vue'
import api from '../api'
import { mapGetters } from 'vuex'

const CONFIG = {
  anestesicos: { endpoint: 'anestesicos/', idKey: 'idanestesico', nombreKey: 'nombreanestesico', label: 'anestésico' },
  tejidos:     { endpoint: 'tejidos/',     idKey: 'idtejido',     nombreKey: 'nombretejido',     label: 'tejido' },
  condiciones: { endpoint: 'condiciones/', idKey: 'idcondicion',  nombreKey: 'nombrecondicion',  label: 'condición' },
}

export default {
  name: 'CatalogosView',
  components: { Navbar },
  data() {
    return {
      tabActiva: 'anestesicos',
      tabs: [
        { key: 'anestesicos', label: 'Anestésicos' },
        { key: 'tejidos',     label: 'Tejidos' },
        { key: 'condiciones', label: 'Condiciones' },
      ],
      anestesicos: [], tejidos: [], condiciones: [],
      loading: { anestesicos: true, tejidos: true, condiciones: true },
      error:   { anestesicos: null, tejidos: null, condiciones: null },
      showModal: false,
      editando: false,
      saving: false,
      errorModal: null,
      catalogoActivo: null,
      itemEditando: null,
      form: { nombre: '', descripcion: '' },
    }
  },
  computed: {
    ...mapGetters(['isEncargado', 'isAdmin']),
    tabLabel() { return CONFIG[this.catalogoActivo]?.label ?? '' },
  },
  async created() {
    await Promise.all([
      this.fetchCatalogo('anestesicos'),
      this.fetchCatalogo('tejidos'),
      this.fetchCatalogo('condiciones'),
    ])
  },
  methods: {
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
      this.saving = true
      this.errorModal = null
      const cfg = CONFIG[this.catalogoActivo]
      const payload = {
        [cfg.nombreKey]: this.form.nombre,
        descripcion: this.form.descripcion,
      }
      try {
        if (this.editando) {
          await api.put(`${cfg.endpoint}${this.itemEditando[cfg.idKey]}/`, payload)
        } else {
          await api.post(cfg.endpoint, payload)
        }
        this.showModal = false
        await this.fetchCatalogo(this.catalogoActivo)
      } catch (err) {
        const data = err.response?.data
        this.errorModal = data
          ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ')
          : 'Error al guardar.'
      } finally {
        this.saving = false
      }
    },
    async eliminar(cat, item) {
      const cfg = CONFIG[cat]
      if (!confirm(`¿Eliminar "${item[cfg.nombreKey]}"? No se puede deshacer.`)) return
      try {
        await api.delete(`${cfg.endpoint}${item[cfg.idKey]}/`)
        await this.fetchCatalogo(cat)
      } catch {
        alert('No se pudo eliminar. El registro puede estar en uso.')
      }
    },
  },
}
</script>

<style scoped>
.page-wrapper { min-height: 100vh; background: #f4f4f8; }
.content { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }
.page-title { margin-bottom: 1.5rem; }
.page-title h1 { font-size: 1.5rem; font-weight: 600; color: #1a1a2e; margin: 0 0 4px 0; }
.page-sub { color: #888; font-size: .9rem; margin: 0; }

.tabs { display: flex; gap: 0; margin-bottom: 1.75rem; border-bottom: 2px solid #e0e0e0; }
.tab { padding: .55rem 1.4rem; border: none; background: transparent; font-size: .9rem;
  color: #888; cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -2px;
  transition: color .15s, border-color .15s; font-family: inherit; }
.tab:hover { color: #1a1a2e; }
.tab.active { color: #80201d; border-bottom-color: #80201d; font-weight: 600; }

.tabla-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.tabla-header h2 { font-size: 1.1rem; font-weight: 600; color: #1a1a2e; margin: 0; }

.table-card { background: #fff; border-radius: 12px; border: 1px solid #e0e0e0; overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
.data-table th { background: #f8f8fb; padding: .7rem 1rem; text-align: left;
  font-size: .78rem; font-weight: 600; color: #666; border-bottom: 1px solid #e0e0e0; }
.data-table td { padding: .65rem 1rem; border-bottom: 1px solid #f0f0f0; color: #333; }
.data-table tr:last-child td { border-bottom: none; }
.empty-row { text-align: center; color: #aaa; padding: 2rem !important; }
.actions { display: flex; gap: 6px; }
.state-msg { padding: 2rem; text-align: center; color: #888; }
.state-msg.error { color: #c62828; }

.btn-primary { background: #80201d; color: #fff; border: none; padding: .55rem 1.2rem;
  border-radius: 8px; font-size: .9rem; font-weight: 500; cursor: pointer; }
.btn-primary:hover:not(:disabled) { background: #9e2a26; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-secondary { background: transparent; border: 1.5px solid #ccc; color: #555;
  padding: .55rem 1.2rem; border-radius: 8px; font-size: .9rem; cursor: pointer; }
.btn-icon { background: transparent; border: none; cursor: pointer; font-size: 1rem;
  padding: 4px 6px; border-radius: 6px; }
.btn-icon:hover { background: #f0f0f0; }
.btn-icon.danger:hover { background: #ffebee; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: #fff; border-radius: 14px; padding: 2rem; width: 100%; max-width: 420px; }
.modal h2 { font-size: 1.1rem; font-weight: 600; margin: 0 0 1.5rem 0;
  color: #1a1a2e; text-transform: capitalize; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field.mt { margin-top: 1rem; }
.field label { font-size: .82rem; font-weight: 500; color: #555; }
.field input, .field textarea { padding: .55rem .8rem; border: 1.5px solid #ddd;
  border-radius: 8px; font-size: .9rem; outline: none; font-family: inherit; resize: vertical; }
.field input:focus, .field textarea:focus { border-color: #80201d; }
.req { color: #c62828; }
.form-error { color: #c62828; font-size: .82rem; background: #ffebee;
  padding: .5rem; border-radius: 6px; margin-top: .75rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1.5rem; }
</style>
