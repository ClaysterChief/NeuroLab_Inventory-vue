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
          <button v-if="isEncargado" class="btn-primary" @click="abrirModal()">+ Nuevo registro</button>
        </div>
      </div>

      <!-- ── Filtros ───────────────────────────────────────── -->
      <div class="filters-bar">
        <input v-model="busqueda" type="text" placeholder="Buscar por actividad, notas o responsable…"
          class="search-input" @input="bitacoraPage = 1; this.fetchBitacoraDebounced()" />
        <select v-model="filtroAnestesico" class="filter-select" @change="bitacoraPage = 1; fetchBitacora()">
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
              <td><span class="badge badge-blue">{{ reg.rata_sexo ? reg.rata_sexo[0] + '-' + reg.rata_idlab :
                reg.rata_idlab }}</span></td>
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
        <div v-if="bitacoraTotalPages > 1" class="pagination-bar">
          <button :disabled="bitacoraPage === 1" @click="bitacoraPage--; fetchBitacora()">← Anterior</button>
          <span>Página {{ bitacoraPage }} de {{ bitacoraTotalPages }} · {{ bitacoraTotal }} registros</span>
          <button :disabled="bitacoraPage === bitacoraTotalPages" @click="bitacoraPage++; fetchBitacora()">Siguiente
            →</button>
        </div>
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
                <input v-model.number="form.dosis" type="number" step="0.001" placeholder="0.003"
                  @input="calcularDosis" />
              </div>
              <div class="field">
                <label>Dosis total calculada (ml)</label>
                <input :value="dosisCalculada" type="number" step="0.01" readonly class="input-readonly"
                  placeholder="Se calcula automáticamente" />
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
import { debounce } from '../utils/debounce'

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
      bitacoraPage: 1,
      bitacoraTotalPages: 1,
      bitacoraTotal: 0,
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
    this.fetchBitacoraDebounced = debounce(this.fetchBitacora, 300)
    await Promise.all([this.fetchBitacora(), this.fetchCatalogos()])
  },

  methods: {
    async fetchBitacora() {
      this.loading = true
      this.error = null
      try {
        const params = { page: this.bitacoraPage }
        if (this.busqueda) params.search = this.busqueda
        if (this.filtroAnestesico) params.idanestesico = this.filtroAnestesico
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
        const [ratas, anest, tejidos] = await Promise.all([
          api.get('ratas/', { params: { page_size: 200 } }),
          api.get('anestesicos/'),
          api.get('tejidos/'),
        ])
        this.ratas = ratas.data.results ?? ratas.data
        this.anestesicos = anest.data
        this.tejidos = tejidos.data
      } catch { /* no bloqueante */ }
    },

    limpiarFiltros() {
      this.busqueda = ''; this.filtroAnestesico = ''
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
        this.$toast.success(this.editando ? 'Registro actualizado.' : 'Experimento registrado.')
      } catch (err) {
        const data = err.response?.data
        this.errorModal = data
          ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ')
          : 'Error al guardar el registro.'
      } finally { this.saving = false }
    },

    async eliminar(registro) {
      const ok = await this.$confirm(
        `¿Eliminar el registro #${registro.idbitacora}? Esta acción no se puede deshacer.`,
        'Eliminar registro'
      )
      if (!ok) return
      try {
        await api.delete(`bitacora/${registro.idbitacora}/`)
        await this.fetchBitacora()
        this.$toast.success('Registro eliminado.')
      } catch {
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
</style>