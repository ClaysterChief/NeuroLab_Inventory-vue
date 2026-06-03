<template>
  <div class="page-wrapper">
    <Navbar />
    <main class="content">

      <!-- ── Cabecera ─────────────────────────────────────── -->
      <div class="page-header">
        <h1>Bitácora de Experimentos</h1>
        <button v-if="isEncargado" class="btn-primary" @click="abrirModal()">
          + Nuevo registro
        </button>
      </div>

      <!-- ── Filtros ───────────────────────────────────────── -->
      <div class="filters-bar">
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar por actividad, notas o responsable…"
          class="search-input"
          @input="fetchBitacora"
        />
        <select v-model="filtroAnestesico" class="filter-select" @change="fetchBitacora">
          <option value="">Todos los anestésicos</option>
          <option v-for="a in anestesicos" :key="a.idanestesico" :value="a.idanestesico">
            {{ a.nombreanestesico }}
          </option>
        </select>
        <button class="btn-secondary" @click="limpiarFiltros">Limpiar</button>
      </div>

      <!-- ── Tabla ─────────────────────────────────────────── -->
      <div class="table-card">
        <div v-if="loading" class="state-msg">Cargando bitácora…</div>
        <div v-else-if="error" class="state-msg error">{{ error }}</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Rata</th>
              <th>Fecha</th>
              <th>Anestésico</th>
              <th>Dosis (ml)</th>
              <th>Peso (g)</th>
              <th>Tejido</th>
              <th>Responsable</th>
              <th>Actividad</th>
              <th v-if="isEncargado">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reg in registros" :key="reg.idbitacora">
              <td>{{ reg.idbitacora }}</td>
              <td><span class="badge badge-blue">{{ reg.rata_sexo ? reg.rata_sexo[0] + '-' + reg.idrata : reg.idrata }}</span></td>
              <td>{{ formatDate(reg.fechacirujia) }}</td>
              <td>{{ reg.anestesico_nombre || '—' }}</td>
              <td>{{ reg.dosistotal ?? '—' }}</td>
              <td>{{ reg.pesoexperimento ?? '—' }}</td>
              <td>{{ reg.tejido_nombre || '—' }}</td>
              <td>{{ reg.responsable_nombre || '—' }}</td>
              <td class="td-actividad">{{ reg.actividad || '—' }}</td>
              <td v-if="isEncargado" class="actions">
                <button class="btn-icon" @click="abrirModal(reg)" title="Editar">✏️</button>
                <button v-if="isAdmin" class="btn-icon danger" @click="eliminar(reg)" title="Eliminar">🗑️</button>
              </td>
            </tr>
            <tr v-if="!registros.length">
              <td :colspan="isEncargado ? 10 : 9" class="empty-row">
                No hay registros en la bitácora.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── Modal ─────────────────────────────────────────── -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal modal-wide">
          <h2>{{ editando ? 'Editar registro' : 'Nuevo registro de experimento' }}</h2>
          <form @submit.prevent="guardar">

            <div class="section-label">Datos del sujeto</div>
            <div class="fields-grid">
              <div class="field">
                <label>ID Rata <span class="required">*</span></label>
                <select v-model.number="form.idrata" required>
                  <option value="">Seleccionar…</option>
                  <option v-for="r in ratas" :key="r.id" :value="r.id">
                    {{ r.sexo[0] }}-{{ r.idrata }} — Cola {{ r.numerocola }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label>Fecha de registro <span class="required">*</span></label>
                <input v-model="form.fechacirujia" type="date" required />
              </div>
              <div class="field">
                <label>Peso en experimento (g)</label>
                <input v-model.number="form.pesoexperimento" type="number" step="0.1" placeholder="320" />
              </div>
              <div class="field">
                <label>Tejido recolectado</label>
                <select v-model.number="form.idtejido">
                  <option value="">Ninguno</option>
                  <option v-for="t in tejidos" :key="t.idtejido" :value="t.idtejido">
                    {{ t.nombretejido }}
                  </option>
                </select>
              </div>
            </div>

            <div class="section-label">Anestesia</div>
            <div class="fields-grid">
              <div class="field">
                <label>Anestésico <span class="required">*</span></label>
                <select v-model.number="form.idanestesico" required @change="calcularDosis">
                  <option value="">Seleccionar…</option>
                  <option v-for="a in anestesicos" :key="a.idanestesico" :value="a.idanestesico">
                    {{ a.nombreanestesico }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label>Dosis unitaria (ml/g)</label>
                <input v-model.number="form.dosis" type="number" step="0.001"
                  placeholder="0.003" @input="calcularDosis" />
              </div>
              <div class="field">
                <label>Dosis total calculada (ml)</label>
                <input :value="dosisCalculada" type="number" step="0.01" readonly
                  class="input-readonly" placeholder="Se calcula automáticamente" />
              </div>
              <div class="field">
                <label>Dosis total aplicada (ml)</label>
                <input v-model.number="form.dosistotal" type="number" step="0.01"
                  placeholder="Confirmar dosis real aplicada" />
              </div>
            </div>

            <div class="section-label">Observaciones</div>
            <div class="fields-grid">
              <div class="field field-full">
                <label>Actividad / Procedimiento</label>
                <textarea v-model="form.actividad" rows="3"
                  placeholder="Describir el procedimiento o prueba conductual realizada…" />
              </div>
              <div class="field field-full">
                <label>Notas adicionales</label>
                <textarea v-model="form.notas" rows="2"
                  placeholder="Observaciones del estado del animal, incidencias…" />
              </div>
            </div>

            <p v-if="errorModal" class="form-error">{{ errorModal }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showModal = false">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Guardando…' : 'Guardar registro' }}
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

const FORM_VACIO = () => ({
  idrata: '', fechacirujia: '', pesoexperimento: '',
  idtejido: '', idanestesico: '', dosis: '', dosistotal: '',
  actividad: '', notas: '',
})

export default {
  name: 'ExperimentoView',
  components: { Navbar },

  data() {
    return {
      registros: [],
      loading: true,
      error: null,
      busqueda: '',
      filtroAnestesico: '',
      // Catálogos
      ratas: [],
      anestesicos: [],
      tejidos: [],
      // Modal
      showModal: false,
      editando: false,
      saving: false,
      errorModal: null,
      form: FORM_VACIO(),
    }
  },

  computed: {
    ...mapGetters(['currentUser', 'isEncargado', 'isAdmin']),

    // Calcula la dosis total: peso × dosis unitaria
    dosisCalculada() {
      const peso = this.form.pesoexperimento
      const dosis = this.form.dosis
      if (peso && dosis && peso > 0 && dosis > 0) {
        return parseFloat((peso * dosis).toFixed(3))
      }
      return ''
    },
  },

  async created() {
    await Promise.all([
      this.fetchBitacora(),
      this.fetchCatalogos(),
    ])
  },

  methods: {
    async fetchBitacora() {
      this.loading = true
      this.error = null
      try {
        const params = {}
        if (this.busqueda)        params.search       = this.busqueda
        if (this.filtroAnestesico) params.idanestesico = this.filtroAnestesico
        const res = await api.get('bitacora/', { params })
        this.registros = res.data
      } catch {
        this.error = 'No se pudo cargar la bitácora.'
      } finally {
        this.loading = false
      }
    },

    async fetchCatalogos() {
      try {
        const [ratas, anest, tejidos] = await Promise.all([
          api.get('ratas/'),
          api.get('anestesicos/'),
          api.get('tejidos/'),
        ])
        this.ratas      = ratas.data
        this.anestesicos = anest.data
        this.tejidos    = tejidos.data
      } catch { /* no bloqueante */ }
    },

    limpiarFiltros() {
      this.busqueda = ''
      this.filtroAnestesico = ''
      this.fetchBitacora()
    },

    abrirModal(registro = null) {
      this.errorModal = null
      if (registro) {
        this.editando = true
        this.form = {
          idbitacora:      registro.idbitacora,
          idrata:          registro.idrata,
          fechacirujia:    registro.fechacirujia,
          pesoexperimento: registro.pesoexperimento ?? '',
          idtejido:        registro.idtejido ?? '',
          idanestesico:    registro.idanestesico,
          dosis:           registro.dosis ?? '',
          dosistotal:      registro.dosistotal ?? '',
          actividad:       registro.actividad ?? '',
          notas:           registro.notas ?? '',
        }
      } else {
        this.editando = false
        this.form = FORM_VACIO()
        // Precargar fecha de hoy
        this.form.fechacirujia = new Date().toISOString().split('T')[0]
        // Precargar usuario actual como responsable
        this.form.idusuario = this.currentUser?.id ?? ''
      }
      this.showModal = true
    },

    calcularDosis() {
      // Autocompletar dosistotal con el valor calculado si el usuario no lo ha editado
      if (this.dosisCalculada) {
        this.form.dosistotal = this.dosisCalculada
      }
    },

    async guardar() {
      this.saving = true
      this.errorModal = null
      try {
        // Limpiar campos vacíos opcionales para no enviar strings vacíos
        const payload = { ...this.form }
        if (!payload.idtejido)        delete payload.idtejido
        if (!payload.pesoexperimento) delete payload.pesoexperimento
        if (!payload.dosis)           delete payload.dosis
        if (!payload.dosistotal)      delete payload.dosistotal

        if (this.editando) {
          await api.put(`bitacora/${payload.idbitacora}/`, payload)
        } else {
          await api.post('bitacora/', payload)
        }
        this.showModal = false
        await this.fetchBitacora()
      } catch (err) {
        const data = err.response?.data
        this.errorModal = data
          ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ')
          : 'Error al guardar el registro.'
      } finally {
        this.saving = false
      }
    },

    async eliminar(registro) {
      if (!confirm(`¿Eliminar el registro #${registro.idbitacora}? Esta acción no se puede deshacer.`)) return
      try {
        await api.delete(`bitacora/${registro.idbitacora}/`)
        await this.fetchBitacora()
      } catch {
        alert('No se pudo eliminar el registro.')
      }
    },

    formatDate(d) {
      if (!d) return '—'
      const [y, m, day] = d.split('-')
      return `${day}/${m}/${y}`
    },
  },
}
</script>

<style scoped>
.page-wrapper { min-height: 100vh; background: #f4f4f8; }
.content { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }

.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.page-header h1 { font-size: 1.5rem; font-weight: 600; color: #1a1a2e; margin: 0; }

.filters-bar { display: flex; gap: 10px; margin-bottom: 1.25rem; flex-wrap: wrap; }
.search-input { flex: 1; min-width: 200px; padding: 0.55rem 0.9rem; border: 1.5px solid #ddd; border-radius: 8px; font-size: 0.9rem; outline: none; }
.search-input:focus { border-color: #80201d; }
.filter-select { padding: 0.55rem 0.8rem; border: 1.5px solid #ddd; border-radius: 8px; font-size: 0.9rem; background: #fff; outline: none; }

.table-card { background: #fff; border-radius: 12px; border: 1px solid #e0e0e0; overflow: hidden; overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.87rem; }
.data-table th { background: #f8f8fb; padding: 0.7rem 0.9rem; text-align: left; font-size: 0.77rem; font-weight: 600; color: #666; border-bottom: 1px solid #e0e0e0; white-space: nowrap; }
.data-table td { padding: 0.65rem 0.9rem; border-bottom: 1px solid #f0f0f0; color: #333; }
.data-table tr:last-child td { border-bottom: none; }
.td-actividad { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty-row { text-align: center; color: #aaa; padding: 2rem !important; }
.actions { display: flex; gap: 4px; }

.badge { display: inline-block; font-size: 0.75rem; padding: 2px 8px; border-radius: 99px; font-weight: 500; }
.badge-blue { background: #e3f2fd; color: #1565c0; }

.state-msg { padding: 2rem; text-align: center; color: #888; }
.state-msg.error { color: #c62828; }

.btn-primary  { background: #80201d; color: #fff; border: none; padding: 0.55rem 1.2rem; border-radius: 8px; font-size: 0.9rem; font-weight: 500; cursor: pointer; }
.btn-primary:hover:not(:disabled) { background: #9e2a26; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: transparent; border: 1.5px solid #ccc; color: #555; padding: 0.55rem 1.2rem; border-radius: 8px; font-size: 0.9rem; cursor: pointer; }
.btn-secondary:hover { background: #f5f5f5; }
.btn-icon { background: transparent; border: none; cursor: pointer; font-size: 1rem; padding: 4px 6px; border-radius: 6px; }
.btn-icon:hover { background: #f0f0f0; }
.btn-icon.danger:hover { background: #ffebee; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 1rem; }
.modal { background: #fff; border-radius: 14px; padding: 2rem; width: 100%; max-height: 90vh; overflow-y: auto; }
.modal-wide { max-width: 660px; }
.modal h2 { font-size: 1.15rem; font-weight: 600; margin: 0 0 1.25rem 0; color: #1a1a2e; }

.section-label { font-size: 0.78rem; font-weight: 600; color: #80201d; text-transform: uppercase; letter-spacing: .05em; margin: 1.25rem 0 0.75rem; border-bottom: 1px solid #f0e0e0; padding-bottom: 4px; }
.section-label:first-of-type { margin-top: 0; }

.fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field-full { grid-column: 1 / -1; }
.field label { font-size: 0.82rem; font-weight: 500; color: #555; }
.required { color: #c62828; }
.field input, .field select, .field textarea { padding: 0.55rem 0.8rem; border: 1.5px solid #ddd; border-radius: 8px; font-size: 0.9rem; outline: none; font-family: inherit; resize: vertical; }
.field input:focus, .field select:focus, .field textarea:focus { border-color: #80201d; }
.input-readonly { background: #f8f8f8; color: #555; }

.form-error { color: #c62828; font-size: 0.82rem; background: #ffebee; padding: 0.5rem; border-radius: 6px; margin-top: 0.75rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1.5rem; }

@media (max-width: 600px) {
  .fields-grid { grid-template-columns: 1fr; }
  .field-full { grid-column: 1; }
}
</style>
