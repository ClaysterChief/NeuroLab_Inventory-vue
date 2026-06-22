<template>
  <div class="page-wrapper">
    <Navbar />
    <main class="content">

      <!-- ── Cabecera ─────────────────────────────────────── -->
      <div class="page-header">
        <h1>Bitácora de Experimentos</h1>
        <div style="display:flex;gap:8px">
          <button class="btn-outline" @click="descargarReporte('pdf')">⬇ PDF</button>
          <button class="btn-outline" @click="descargarReporte('excel')">⬇ Excel</button>
          <button v-if="isEncargado" class="btn-primary btn-breathe" @click="abrirModal()">+ Nuevo registro</button>
        </div>
      </div>

      <!-- ── Filtros ───────────────────────────────────────── -->
      <div class="filters-bar">
        <input v-model="busqueda" type="text" placeholder="Buscar por actividad, proyecto, notas o responsable…"
          class="search-input" @input="bitacoraPage = 1; this.fetchBitacoraDebounced()" />
        <select v-model="filtroAnestesico" class="filter-select" @change="bitacoraPage = 1; fetchBitacora()">
          <option value="">Todos los anestésicos</option>
          <option v-for="a in anestesicos" :key="a.idanestesico" :value="a.idanestesico">
            {{ a.nombreanestesico }}
          </option>
        </select>
        <select v-model="filtroProyecto" class="filter-select" @change="bitacoraPage = 1; fetchBitacora()">
          <option value="">Todos los proyectos</option>
          <option v-for="p in proyectos" :key="p" :value="p">{{ p }}</option>
        </select>
        <select v-model="filtroResponsable" class="filter-select" @change="bitacoraPage = 1; fetchBitacora()">
          <option value="">Todos los responsables</option>
          <option v-for="u in usuarios" :key="u.idusuario" :value="u.idusuario">
            {{ u.nombreusuario }}
          </option>
        </select>
        <select v-model="ordenFecha" class="filter-select" @change="bitacoraPage = 1; fetchBitacora()">
          <option value="-fechacirujia">Fecha: más reciente primero</option>
          <option value="fechacirujia">Fecha: más antigua primero</option>
        </select>
        <button class="btn-secondary" @click="limpiarFiltros">Limpiar</button>
      </div>

      <!-- ── Tabla ─────────────────────────────────────────── -->
      <div class="table-card">
        <div v-if="loading" class="skeleton-table">
          <div class="skeleton-row" v-for="n in 6" :key="n">
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton skeleton-cell skeleton-cell--lg"></div>
          </div>
        </div>
        <div v-else-if="error" class="state-msg error shake-error">{{ error }}</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Rata</th>
              <th>Proyecto</th>
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
          <transition-group name="list" tag="tbody">
            <tr v-for="reg in registros" :key="reg.idbitacora"
                :class="{ 'row-removing': removingId === reg.idbitacora }">
              <td>{{ reg.idbitacora }}</td>
              <td><span class="badge badge-blue">{{ reg.rata_sexo ? reg.rata_sexo[0] + '-' + reg.rata_idlab :
                reg.rata_idlab }}</span></td>
              <td>
                <span v-if="reg.nombreproyecto" class="badge badge-purple" :title="reg.nombreproyecto">
                  {{ reg.nombreproyecto }}
                </span>
                <span v-else>—</span>
              </td>
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
          </transition-group>
        </table>
        <div v-if="!loading && !error && !registros.length" class="empty-state">
          <span class="empty-state-icon">📋</span>
          No hay registros en la bitácora.
        </div>
        <div v-if="bitacoraTotalPages > 1" class="pagination-bar">
          <button :disabled="bitacoraPage === 1" @click="bitacoraPage--; fetchBitacora()">← Anterior</button>
          <span>Página {{ bitacoraPage }} de {{ bitacoraTotalPages }} · {{ bitacoraTotal }} registros</span>
          <button :disabled="bitacoraPage === bitacoraTotalPages" @click="bitacoraPage++; fetchBitacora()">Siguiente
            →</button>
        </div>
      </div>

      <!-- ── Modal ─────────────────────────────────────────── -->
      <transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <transition name="modal-pop" appear>
            <div class="modal modal-wide" v-if="showModal">
              <h2>{{ editando ? 'Editar registro' : 'Nuevo registro de experimento' }}</h2>
              <form @submit.prevent="guardar">

                <div class="section-label">Datos del sujeto</div>
                <div class="fields-grid">
                  <div class="field field-full">
                    <label>Nombre del proyecto</label>
                    <input v-model="form.nombreproyecto" type="text"
                      placeholder="Ej. Evaluación de memoria espacial en modelo de estrés crónico" />
                  </div>
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
                    <input v-model.number="form.dosis" type="number" step="0.001" placeholder="0.003"
                      @input="calcularDosis" />
                  </div>
                  <div class="field">
                    <label>Dosis total calculada (ml)</label>
                    <input :value="dosisCalculada" type="number" step="0.01" readonly class="input-readonly"
                      placeholder="Se calcula automáticamente"
                      :class="{ 'dosis-flash': dosisFlash }" />
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

                <p v-if="errorModal" class="form-error shake-error" :key="errorModalKey">{{ errorModal }}</p>
                <div class="modal-actions">
                  <button type="button" class="btn-secondary" @click="showModal = false">Cancelar</button>
                  <button type="submit" class="btn-primary" :disabled="saving">
                    <span v-if="saving" class="spinner-bounce">⏳</span>
                    <span v-else>Guardar registro</span>
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
import { debounce } from '../utils/debounce'

const FORM_VACIO = () => ({
  idrata: '', fechacirujia: '', pesoexperimento: '',
  idtejido: '', idanestesico: '', dosis: '', dosistotal: '',
  actividad: '', notas: '', nombreproyecto: '',
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
      filtroProyecto: '',
      filtroResponsable: '',
      ordenFecha: '-fechacirujia',
      proyectos: [],
      usuarios: [],
      ratas: [],
      anestesicos: [],
      tejidos: [],
      showModal: false,
      editando: false,
      saving: false,
      errorModal: null,
      errorModalKey: 0,
      form: FORM_VACIO(),
      bitacoraPage: 1,
      bitacoraTotalPages: 1,
      bitacoraTotal: 0,
      removingId: null,
      dosisFlash: false,
    }
  },

  computed: {
    ...mapGetters(['currentUser', 'isEncargado', 'isAdmin']),

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
    this.fetchBitacoraDebounced = debounce(this.fetchBitacora, 300)
    await Promise.all([this.fetchBitacora(), this.fetchCatalogos()])
  },

  methods: {
    _showError(msg) {
      this.errorModal = msg
      this.errorModalKey++
    },

    async fetchBitacora() {
      this.loading = true
      this.error = null
      try {
        const params = { page: this.bitacoraPage, ordering: this.ordenFecha }
        if (this.busqueda) params.search = this.busqueda
        if (this.filtroAnestesico) params.idanestesico = this.filtroAnestesico
        if (this.filtroProyecto) params.nombreproyecto = this.filtroProyecto
        if (this.filtroResponsable) params.idusuario = this.filtroResponsable
        const res = await api.get('bitacora/', { params })
        this.registros = res.data.results ?? res.data
        this.bitacoraTotalPages = res.data.total_pages ?? 1
        this.bitacoraTotal = res.data.count ?? this.registros.length
      } catch {
        this.error = 'No se pudo cargar la bitácora.'
      } finally {
        this.loading = false
      }
    },

    async fetchCatalogos() {
      try {
        const [ratas, anest, tejidos, usuarios, proyectos] = await Promise.all([
          api.get('ratas/', { params: { page_size: 200 } }),
          api.get('anestesicos/'),
          api.get('tejidos/'),
          api.get('usuarios/', { params: { page_size: 200 } }),
          api.get('bitacora/proyectos/'),
        ])
        this.ratas = ratas.data.results ?? ratas.data
        this.anestesicos = anest.data
        this.tejidos = tejidos.data
        this.usuarios = usuarios.data.results ?? usuarios.data
        this.proyectos = proyectos.data
      } catch { /* no bloqueante */ }
    },

    limpiarFiltros() {
      this.busqueda = ''; this.filtroAnestesico = ''
      this.filtroProyecto = ''; this.filtroResponsable = ''
      this.ordenFecha = '-fechacirujia'
      this.bitacoraPage = 1
      this.fetchBitacora()
    },

    abrirModal(registro = null) {
      this.errorModal = null
      if (registro) {
        this.editando = true
        this.form = {
          idbitacora: registro.idbitacora,
          idrata: registro.idrata,
          fechacirujia: registro.fechacirujia,
          pesoexperimento: registro.pesoexperimento ?? '',
          idtejido: registro.idtejido ?? '',
          idanestesico: registro.idanestesico,
          dosis: registro.dosis ?? '',
          dosistotal: registro.dosistotal ?? '',
          actividad: registro.actividad ?? '',
          notas: registro.notas ?? '',
          nombreproyecto: registro.nombreproyecto ?? '',
        }
      } else {
        this.editando = false
        this.form = FORM_VACIO()
        this.form.fechacirujia = new Date().toISOString().split('T')[0]
        this.form.idusuario = this.currentUser?.id ?? ''
      }
      this.showModal = true
    },

    calcularDosis() {
      if (this.dosisCalculada) {
        this.form.dosistotal = this.dosisCalculada
        this.dosisFlash = true
        setTimeout(() => { this.dosisFlash = false }, 350)
      }
    },

    async guardar() {
      this.saving = true; this.errorModal = null
      try {
        const payload = { ...this.form }
        if (!payload.idtejido) delete payload.idtejido
        if (!payload.pesoexperimento) delete payload.pesoexperimento
        if (!payload.dosis) delete payload.dosis
        if (!payload.dosistotal) delete payload.dosistotal
        if (this.editando) await api.put(`bitacora/${payload.idbitacora}/`, payload)
        else await api.post('bitacora/', payload)
        this.showModal = false
        await this.fetchBitacora()
        if (payload.nombreproyecto && !this.proyectos.includes(payload.nombreproyecto)) {
          api.get('bitacora/proyectos/').then(r => { this.proyectos = r.data }).catch(() => {})
        }
        this.$toast.success(this.editando ? 'Registro actualizado.' : 'Experimento registrado.')
      } catch (err) {
        const data = err.response?.data
        this._showError(data
          ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ')
          : 'Error al guardar el registro.')
      } finally { this.saving = false }
    },

    async eliminar(registro) {
      const ok = await this.$confirm(
        `¿Eliminar el registro #${registro.idbitacora}? Esta acción no se puede deshacer.`,
        'Eliminar registro'
      )
      if (!ok) return
      this.removingId = registro.idbitacora
      try {
        await api.delete(`bitacora/${registro.idbitacora}/`)
        setTimeout(async () => {
          await this.fetchBitacora()
          this.removingId = null
          this.$toast.success('Registro eliminado.')
        }, 320)
      } catch {
        this.removingId = null
        this.$toast.error('No se pudo eliminar el registro.')
      }
    },

    formatDate(d) {
      if (!d) return '—'
      const [y, m, day] = d.split('-')
      return `${day}/${m}/${y}`
    },

    async descargarReporte(formato) {
      const mimes = {
        pdf: 'application/pdf',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
      const exts = { pdf: 'pdf', excel: 'xlsx' }
      try {
        const url = formato === 'excel' ? 'reportes/bitacora/excel/' : 'reportes/bitacora/'
        const res = await api.get(url, { responseType: 'blob' })
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(new Blob([res.data], { type: mimes[formato] }))
        link.setAttribute('download', `bitacora_neurolab.${exts[formato]}`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(link.href)
        this.$toast.success(`Reporte ${formato.toUpperCase()} descargado.`)
      } catch {
        this.$toast.error('No se pudo generar el reporte.')
      }
    },
  },
}
</script>

<style scoped>
.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.td-actividad {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skeleton-table { padding: .5rem 0; }
.skeleton-table .skeleton-row { border-bottom: 1px solid #f3f3f6; }

/* Flash sutil cuando se autocalcula la dosis */
.dosis-flash {
  animation: dosisFlashAnim .35s ease;
}
@keyframes dosisFlashAnim {
  0%   { background: #fff7e6; box-shadow: 0 0 0 3px rgba(255,193,7,.3); }
  100% { background: #f8f8f8; box-shadow: none; }
}

@media (max-width: 640px) {
  .content { padding: 1rem .85rem; }
  .skeleton-cell--lg { display: none; }
}
</style>
