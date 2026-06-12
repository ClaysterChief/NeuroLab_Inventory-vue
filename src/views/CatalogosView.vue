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
          @click="tabActiva = t.key">{{ t.label }}</button>
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
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th v-if="isEncargado">Acciones</th>
              </tr>
            </thead>
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
              <tr v-if="!anestesicos.length">
                <td colspan="4" class="empty-row">No hay registros.</td>
              </tr>
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
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th v-if="isEncargado">Acciones</th>
              </tr>
            </thead>
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
              <tr v-if="!tejidos.length">
                <td colspan="4" class="empty-row">No hay registros.</td>
              </tr>
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
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th v-if="isEncargado">Acciones</th>
              </tr>
            </thead>
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
              <tr v-if="!condiciones.length">
                <td colspan="4" class="empty-row">No hay registros.</td>
              </tr>
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

      <!-- ══ UBICACIONES ══════════════════════════════════════════ -->
      <div v-if="tabActiva === 'ubicaciones'">
        <div class="tabla-header">
          <h2>Ubicaciones</h2>
          <button v-if="isEncargado" class="btn-primary" @click="abrirModal('ubicaciones')">+ Nueva</button>
        </div>
        <div class="table-card">
          <div v-if="loading.ubicaciones" class="state-msg">Cargando…</div>
          <div v-else-if="error.ubicaciones" class="state-msg error">{{ error.ubicaciones }}</div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th v-if="isEncargado">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in ubicaciones" :key="item.idubicacion">
                <td>{{ item.idubicacion }}</td>
                <td>{{ item.nombreubicacion }}</td>
                <td>{{ item.descripcion || '—' }}</td>
                <td v-if="isEncargado" class="actions">
                  <button class="btn-icon" @click="abrirModal('ubicaciones', item)">✏️</button>
                  <button v-if="isAdmin" class="btn-icon danger" @click="eliminar('ubicaciones', item)">🗑️</button>
                </td>
              </tr>
              <tr v-if="!ubicaciones.length">
                <td colspan="4" class="empty-row">No hay ubicaciones registradas.</td>
              </tr>
            </tbody>
          </table>
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
      tabs: [
        { key: 'anestesicos', label: 'Anestésicos' },
        { key: 'tejidos', label: 'Tejidos' },
        { key: 'condiciones', label: 'Condiciones' },
        { key: 'ubicaciones', label: 'Ubicaciones' },
      ],
      anestesicos: [], tejidos: [], condiciones: [], ubicaciones: [],
      loading: { anestesicos: true, tejidos: true, condiciones: true, ubicaciones: true },
      error: { anestesicos: null, tejidos: null, condiciones: null, ubicaciones: null },
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
      this.fetchCatalogo('ubicaciones'),
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
        this.errorModal = data
          ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ')
          : 'Error al guardar.'
      } finally { this.saving = false }
    },

    async eliminar(cat, item) {
      const cfg = CONFIG[cat]
      const ok = await this.$confirm(
        `¿Eliminar "${item[cfg.nombreKey]}"? No se puede deshacer.`,
        'Eliminar registro'
      )
      if (!ok) return
      try {
        await api.delete(`${cfg.endpoint}${item[cfg.idKey]}/`)
        await this.fetchCatalogo(cat)
        this.$toast.success('Registro eliminado.')
      } catch {
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
</style>