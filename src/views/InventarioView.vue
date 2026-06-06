<template>
  <div class="page-wrapper">
    <Navbar />
    <main class="content">

      <!-- ══ SECCIÓN CAJAS ═══════════════════════════════════ -->
      <div class="page-header">
        <h1>Inventario de Cajas</h1>
        <div style="display:flex;gap:8px">
          <button class="btn-outline" @click="descargarPDF('inventario')" title="Descargar PDF">
            ⬇ PDF Inventario
          </button>
          <button v-if="isEncargado" class="btn-primary" @click="abrirModalCaja()">+ Nueva caja</button>
        </div>
      </div>

      <div class="filters-bar">
        <input v-model="busquedaCaja" type="text" placeholder="Buscar por comentarios…" class="search-input"
          @input="cajasPage = 1; fetchCajas()" />
        <select v-model="filtroSexoCaja" class="filter-select" @change="cajasPage = 1; fetchCajas()">
          <option value="">Todos los sexos</option>
          <option value="Macho">Macho</option>
          <option value="Hembra">Hembra</option>
        </select>
        <button class="btn-secondary" @click="limpiarCajas">Limpiar</button>
      </div>

      <div class="table-card">
        <div v-if="loadingCajas" class="state-msg">Cargando cajas…</div>
        <div v-else-if="errorCajas" class="state-msg error">{{ errorCajas }}</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Caja #</th>
              <th>Ratas totales</th>
              <th>Sexo</th>
              <th>F. Nacimiento</th>
              <th>Talla</th>
              <th>Responsable</th>
              <th>Comentarios</th>
              <th v-if="isEncargado">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in cajas" :key="c.idcaja">
              <td><strong>{{ c.idcaja }}</strong></td>
              <td>{{ c.cantidadratas }}</td>
              <td><span class="badge" :class="c.sexo === 'Macho' ? 'badge-blue' : 'badge-pink'">{{ c.sexo }}</span></td>
              <td>{{ fmt(c.fechanacimiento) }}</td>
              <td>{{ c.talla || '—' }}</td>
              <td>{{ c.responsable_nombre || '—' }}</td>
              <td class="td-clip">{{ c.comentarios || '—' }}</td>
              <td v-if="isEncargado" class="actions">
                <button class="btn-icon" @click="abrirModalCaja(c)" title="Editar">✏️</button>
                <button v-if="isAdmin" class="btn-icon danger" @click="eliminarCaja(c)" title="Eliminar">🗑️</button>
              </td>
            </tr>
            <tr v-if="!cajas.length">
              <td :colspan="isEncargado ? 8 : 7" class="empty-row">No hay cajas registradas.</td>
            </tr>
          </tbody>
        </table>

        <!-- Paginación Cajas — va dentro del div.table-card de cajas -->
        <div v-if="cajasTotalPages > 1" class="pagination-bar">
          <button :disabled="cajasPage === 1" @click="cajasPage--; fetchCajas()">← Anterior</button>
          <span>Página {{ cajasPage }} de {{ cajasTotalPages }} · {{ cajasTotal }} registros</span>
          <button :disabled="cajasPage === cajasTotalPages" @click="cajasPage++; fetchCajas()">Siguiente →</button>
        </div>
      </div>

      <!-- ══ SECCIÓN RATAS ════════════════════════════════════ -->
      <div class="section-divider"></div>

      <div class="page-header">
        <h1>Registro de Ratas</h1>
        <button v-if="isEncargado" class="btn-primary" @click="abrirModalRata()">+ Nueva rata</button>
      </div>

      <div class="filters-bar">
        <input v-model="busquedaRata" type="text" placeholder="Buscar por número de cola…" class="search-input"
          @input="ratasPage = 1; fetchRatas()" />
        <select v-model="filtroSexoRata" class="filter-select" @change="ratasPage = 1; fetchRatas()">
          <option value="">Todos los sexos</option>
          <option value="Macho">Macho</option>
          <option value="Hembra">Hembra</option>
        </select>
        <select v-model="filtroCaja" class="filter-select" @change="ratasPage = 1; fetchRatas()">
          <option value="">Todas las cajas</option>
          <option v-for="c in cajas" :key="c.idcaja" :value="c.idcaja">
            Caja #{{ c.idcaja }} ({{ c.sexo }})
          </option>
        </select>
        <button class="btn-secondary" @click="limpiarRatas">Limpiar</button>
      </div>

      <div class="table-card">
        <div v-if="loadingRatas" class="state-msg">Cargando ratas…</div>
        <div v-else-if="errorRatas" class="state-msg error">{{ errorRatas }}</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sexo</th>
              <th>N° Cola</th>
              <th>Caja</th>
              <th>Condición</th>
              <th>Peso semanal (g)</th>
              <th>F. Cirugía</th>
              <th v-if="isEncargado">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in ratas" :key="`${r.sexo}-${r.idrata}`">
              <td><strong>{{ r.sexo[0] }}-{{ r.idrata }}</strong></td>
              <td><span class="badge" :class="r.sexo === 'Macho' ? 'badge-blue' : 'badge-pink'">{{ r.sexo }}</span></td>
              <td>{{ r.numerocola }}</td>
              <td>{{ r.caja_info ? `Caja #${r.caja_info.idcaja}` : '—' }}</td>
              <td><span v-if="r.condicion_nombre" class="badge badge-purple">{{ r.condicion_nombre }}</span><span
                  v-else>—</span></td>
              <td>{{ r.pesosemanal ?? '—' }}</td>
              <td>{{ fmt(r.fechacirugia) }}</td>
              <td v-if="isEncargado" class="actions">
                <button class="btn-icon" @click="abrirModalRata(r)" title="Editar">✏️</button>
                <button v-if="isAdmin" class="btn-icon danger" @click="eliminarRata(r)" title="Eliminar">🗑️</button>
              </td>
            </tr>
            <tr v-if="!ratas.length">
              <td :colspan="isEncargado ? 8 : 7" class="empty-row">No hay ratas registradas.</td>
            </tr>
          </tbody>
        </table>
        <!-- Paginación Ratas — va dentro del div.table-card de ratas -->
        <div v-if="ratasTotalPages > 1" class="pagination-bar">
          <button :disabled="ratasPage === 1" @click="ratasPage--; fetchRatas()">← Anterior</button>
          <span>Página {{ ratasPage }} de {{ ratasTotalPages }} · {{ ratasTotal }} registros</span>
          <button :disabled="ratasPage === ratasTotalPages" @click="ratasPage++; fetchRatas()">Siguiente →</button>
        </div>
      </div>

      <!-- ══ MODAL CAJA ════════════════════════════════════════ -->
      <div v-if="modalCaja" class="modal-overlay" @click.self="modalCaja = false">
        <div class="modal">
          <h2>{{ editandoCaja ? 'Editar caja' : 'Nueva caja' }}</h2>
          <form @submit.prevent="guardarCaja">
            <div class="fields-grid">
              <div class="field">
                <label>Cantidad de ratas <span class="req">*</span></label>
                <input v-model.number="formCaja.cantidadratas" type="number" min="1" required />
              </div>
              <div class="field">
                <label>Sexo <span class="req">*</span></label>
                <select v-model="formCaja.sexo" required>
                  <option value="">Seleccionar…</option>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
              </div>
              <div class="field">
                <label>Fecha de nacimiento <span class="req">*</span></label>
                <input v-model="formCaja.fechanacimiento" type="date" required />
              </div>
              <div class="field">
                <label>Talla</label>
                <select v-model="formCaja.talla">
                  <option value="">—</option>
                  <option value="Pequeña">Pequeña</option>
                  <option value="Mediana">Mediana</option>
                  <option value="Grande">Grande</option>
                </select>
              </div>
              <div class="field field-full">
                <label>Responsable</label>
                <select v-model="formCaja.idusuario">
                  <option value="">Sin asignar</option>
                  <option v-for="u in usuarios" :key="u.idusuario" :value="u.idusuario">
                    {{ u.nombreusuario }} — {{ u.apellidopaterno }}
                  </option>
                </select>
              </div>
              <div class="field field-full">
                <label>Comentarios</label>
                <textarea v-model="formCaja.comentarios" rows="2" />
              </div>
            </div>
            <p v-if="errorModal" class="form-error">{{ errorModal }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="modalCaja = false">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar'
              }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ══ MODAL RATA ════════════════════════════════════════ -->
      <div v-if="modalRata" class="modal-overlay" @click.self="modalRata = false">
        <div class="modal">
          <h2>{{ editandoRata ? 'Editar rata' : 'Registrar rata' }}</h2>
          <form @submit.prevent="guardarRata">
            <div class="fields-grid">

              <!-- Sexo -->
              <div class="field">
                <label>Sexo <span class="req">*</span></label>
                <select v-model="formRata.sexo" required @change="cargarSiguienteId">
                  <option value="">Seleccionar…</option>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
              </div>

              <!-- ID con opción manual -->
              <div class="field">
                <label>
                  ID de rata
                  <span class="label-hint">
                    {{ formRata.sexo ? `Siguiente disponible: ${siguienteId}` : '' }}
                  </span>
                </label>
                <div class="id-row">
                  <input v-model.number="formRata.idrata" type="number" min="1"
                    :placeholder="formRata.sexo ? `Auto: ${siguienteId}` : 'Selecciona sexo primero'"
                    :disabled="!formRata.sexo || !isEncargado" :class="{ 'input-error': errorIdRata }" />
                  <button v-if="formRata.sexo && isEncargado" type="button" class="btn-auto" @click="usarIdAuto"
                    title="Usar ID automático">Auto</button>
                </div>
                <span v-if="errorIdRata" class="field-error">{{ errorIdRata }}</span>
                <span class="field-hint">Deja vacío para asignar automáticamente.</span>
              </div>

              <!-- Número de cola -->
              <div class="field">
                <label>N° de cola <span class="req">*</span></label>
                <input v-model.number="formRata.numerocola" type="number" min="1" required />
              </div>

              <!-- Caja -->
              <div class="field">
                <label>Caja</label>
                <select v-model.number="formRata.idcaja">
                  <option value="">Sin asignar</option>
                  <option v-for="c in cajasFiltradas" :key="c.idcaja" :value="c.idcaja">
                    Caja #{{ c.idcaja }} — {{ c.sexo }}
                  </option>
                </select>
              </div>

              <!-- Condición -->
              <div class="field">
                <label>Condición</label>
                <select v-model="formRata.idcondicion">
                  <option value="">Sin condición</option>
                  <option v-for="c in condiciones" :key="c.idcondicion" :value="c.idcondicion">
                    {{ c.nombrecondicion }}
                  </option>
                </select>
              </div>

              <!-- Peso semanal -->
              <div class="field">
                <label>Peso semanal (g)</label>
                <input v-model.number="formRata.pesosemanal" type="number" step="0.1" />
              </div>

              <!-- Fecha cirugía -->
              <div class="field field-full">
                <label>Fecha de cirugía / protocolo</label>
                <input v-model="formRata.fechacirugia" type="date" />
              </div>
            </div>

            <p v-if="errorModal" class="form-error">{{ errorModal }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="modalRata = false">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar'
              }}</button>
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

export default {
  name: 'InventarioView',
  components: { Navbar },
  data() {
    return {
      // Cajas
      cajas: [], loadingCajas: true, errorCajas: null,
      busquedaCaja: '', filtroSexoCaja: '',
      modalCaja: false, editandoCaja: false,
      formCaja: { cantidadratas: 1, sexo: '', fechanacimiento: '', talla: '', comentarios: '', idusuario: '' },
      // Ratas
      ratas: [], loadingRatas: true, errorRatas: null,
      busquedaRata: '', filtroSexoRata: '', filtroCaja: '',
      condiciones: [],
      modalRata: false, editandoRata: false,
      siguienteId: '—', errorIdRata: null,
      formRata: { id: null, idrata: '', sexo: '', numerocola: '', idcaja: '', idcondicion: '', pesosemanal: '', fechacirugia: '' },
      // Compartido
      saving: false, errorModal: null,
      // Catálogos de apoyo
      usuarios: [],
      // Paginación cajas
      cajasPage: 1, cajasTotalPages: 1, cajasTotal: 0,
      // Paginación ratas
      ratasPage: 1, ratasTotalPages: 1, ratasTotal: 0,
      // Dropdown de cajas para el modal de ratas (sin paginar)
      cajasDropdown: [],
    }
  },
  computed: {
    ...mapGetters(['isEncargado', 'isAdmin']),
    // Filtrar cajas por el sexo seleccionado en el modal de rata
    cajasFiltradas() {
      const source = this.cajasDropdown.length ? this.cajasDropdown : this.cajas
      if (!this.formRata.sexo) return source
      return source.filter(c => c.sexo === this.formRata.sexo)
    },
  },
  async created() {
    await Promise.all([this.fetchCajas(), this.fetchRatas(), this.fetchCondiciones(), this.fetchUsuarios(), this.fetchCajasDropdown()])
  },
  methods: {
    // ── Cajas ─────────────────────────────────────────────────
    async fetchCajas() {
      this.loadingCajas = true
      this.errorCajas = null
      try {
        const params = { page: this.cajasPage }
        if (this.busquedaCaja) params.search = this.busquedaCaja
        if (this.filtroSexoCaja) params.sexo = this.filtroSexoCaja
        const res = await api.get('cajas/', { params })
        this.cajas = res.data.results ?? res.data
        this.cajasTotalPages = res.data.total_pages ?? 1
        this.cajasTotal = res.data.count ?? this.cajas.length
      } catch { this.errorCajas = 'No se pudo cargar el inventario de cajas.' }
      finally { this.loadingCajas = false }
    },
    async fetchCajasDropdown() {
      try {
        const res = await api.get('cajas/', { params: { page_size: 200 } })
        this.cajasDropdown = res.data.results ?? res.data
      } catch { /* no bloqueante */ }
    },
    limpiarCajas() { this.busquedaCaja = ''; this.filtroSexoCaja = ''; this.cajasPage = 1; this.fetchCajas() },
    abrirModalCaja(c = null) {
      this.errorModal = null
      this.editandoCaja = !!c
      this.formCaja = c
        ? {
          idcaja: c.idcaja, cantidadratas: c.cantidadratas, sexo: c.sexo,
          fechanacimiento: c.fechanacimiento, talla: c.talla || '',
          comentarios: c.comentarios || '', idusuario: c.idusuario || ''
        }
        : { cantidadratas: 1, sexo: '', fechanacimiento: '', talla: '', comentarios: '', idusuario: '' }
      this.modalCaja = true
    },
    async guardarCaja() {
      this.saving = true; this.errorModal = null
      try {
        if (this.editandoCaja) await api.put(`cajas/${this.formCaja.idcaja}/`, this.formCaja)
        else await api.post('cajas/', this.formCaja)
        this.modalCaja = false
        await this.fetchCajas()
      } catch (err) {
        this.errorModal = this._parseError(err, 'Error al guardar la caja.')
      } finally { this.saving = false }
    },
    async eliminarCaja(c) {
      if (!confirm(`¿Eliminar la caja #${c.idcaja}?`)) return
      try { await api.delete(`cajas/${c.idcaja}/`); await this.fetchCajas() }
      catch { alert('No se pudo eliminar la caja.') }
    },

    // ── Ratas ──────────────────────────────────────────────────
    async fetchRatas() {
      this.loadingRatas = true
      this.errorRatas = null
      try {
        const params = { page: this.ratasPage }
        if (this.busquedaRata) params.search = this.busquedaRata
        if (this.filtroSexoRata) params.sexo = this.filtroSexoRata
        if (this.filtroCaja) params.idcaja = this.filtroCaja
        const res = await api.get('ratas/', { params })
        this.ratas = res.data.results ?? res.data
        this.ratasTotalPages = res.data.total_pages ?? 1
        this.ratasTotal = res.data.count ?? this.ratas.length
      } catch { this.errorRatas = 'No se pudo cargar el registro de ratas.' }
      finally { this.loadingRatas = false }
    },
    limpiarRatas() { this.busquedaRata = ''; this.filtroSexoRata = ''; this.filtroCaja = ''; this.ratasPage = 1; this.fetchRatas() },

    async fetchCondiciones() {
      try { const r = await api.get('condiciones/'); this.condiciones = r.data }
      catch { /* no bloqueante */ }
    },

    async fetchUsuarios() {
      try { const r = await api.get('usuarios/'); this.usuarios = r.data }
      catch { /* no bloqueante */ }
    },

    abrirModalRata(r = null) {
      this.errorModal = null; this.errorIdRata = null; this.siguienteId = '—'
      this.editandoRata = !!r
      if (r) {
        this.formRata = {
          // id es la PK interna usada para PUT/DELETE
          id: r.id,
          idrata: r.idrata, sexo: r.sexo, numerocola: r.numerocola,
          idcaja: Number(r.caja_info?.idcaja) || null,
          idcondicion: r.idcondicion ? Number(r.idcondicion) : null,
          pesosemanal: r.pesosemanal ?? '',
          fechacirugia: r.fechacirugia ?? '',
        }
        this.cargarSiguienteId()
      } else {
        this.formRata = {
          id: null, idrata: '', sexo: '', numerocola: '',
          idcaja: null, idcondicion: null, pesosemanal: '', fechacirugia: '',
        }
      }
      this.modalRata = true
    },

    async cargarSiguienteId() {
      if (!this.formRata.sexo) return
      try {
        const r = await api.get('ratas/siguiente_id/', { params: { sexo: this.formRata.sexo } })
        this.siguienteId = r.data.siguiente_id
        // Si es nuevo registro y no tiene ID manual, preasignar el automático
        if (!this.editandoRata) {
          this.formRata.idrata = this.siguienteId
        }
      } catch { this.siguienteId = '—' }
    },

    usarIdAuto() {
      this.formRata.idrata = this.siguienteId
      this.errorIdRata = null
    },

    async guardarRata() {
      this.saving = true; this.errorModal = null; this.errorIdRata = null
      try {
        const payload = {
          sexo: this.formRata.sexo,
          numerocola: this.formRata.numerocola,
        }
        // idrata: enviar solo si se especificó manualmente
        if (this.formRata.idrata) payload.idrata = this.formRata.idrata
        // Opcionales: solo incluir si tienen valor
        if (this.formRata.idcaja) payload.idcaja = this.formRata.idcaja
        if (this.formRata.idcondicion) payload.idcondicion = this.formRata.idcondicion
        if (this.formRata.pesosemanal) payload.pesosemanal = this.formRata.pesosemanal
        if (this.formRata.fechacirugia) payload.fechacirugia = this.formRata.fechacirugia

        if (this.editandoRata) {
          // Usar id (PK interna) para la URL, no idrata
          await api.put(`ratas/${this.formRata.id}/`, payload)
        } else {
          await api.post('ratas/', payload)
        }
        this.modalRata = false
        await this.fetchRatas()
      } catch (err) {
        const data = err.response?.data
        if (data?.idrata) {
          this.errorIdRata = Array.isArray(data.idrata) ? data.idrata[0] : data.idrata
        } else if (data?.fechacirugia) {
          this.errorModal = Array.isArray(data.fechacirugia) ? data.fechacirugia[0] : data.fechacirugia
        } else {
          this.errorModal = this._parseError(err, 'Error al guardar la rata.')
        }
      } finally { this.saving = false }
    },

    async eliminarRata(r) {
      if (!confirm(`¿Eliminar la rata ${r.sexo[0]}-${r.idrata}?`)) return
      try {
        // Usar id (PK interna) para la URL
        await api.delete(`ratas/${r.id}/`)
        await this.fetchRatas()
      } catch { alert('No se pudo eliminar la rata.') }
    },

    // ── Helpers ────────────────────────────────────────────────
    fmt(d) {
      if (!d) return '—'
      const [y, m, day] = d.split('-')
      return `${day}/${m}/${y}`
    },
    _parseError(err, fallback) {
      const data = err.response?.data
      const status = err.response?.status

      if (!data) {
        if (status === 500) return 'Error del servidor (500). Verifica que todos los campos obligatorios están completos.'
        if (status === 400) return 'Solicitud inválida (400). Verifica los datos.'
        if (status === 409) return 'Conflicto de datos (409).'
        return fallback
      }

      // Si la respuesta es HTML (error no controlado de Django)
      if (typeof data === 'string' && data.includes('<')) {
        console.error('Server HTML response:', data)
        if (status === 500) return 'Error interno del servidor. Por favor, intenta nuevamente.'
        if (status === 400) return 'Datos inválidos. Verifica los campos del formulario.'
        return fallback
      }

      // Si es string de error directo
      if (typeof data === 'string') return data

      // Si es objeto con errores de validación
      if (typeof data === 'object') {
        // Buscar campo 'detail' (errores de permisos/autenticación)
        if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : data.detail

        // Buscar campo 'error' o 'message'
        if (data.error) return data.error
        if (data.message) return data.message

        // Si hay errores de validación por campo, mostrar el primero
        const firstError = Object.entries(data)[0]
        if (firstError) {
          const [key, value] = firstError
          if (Array.isArray(value)) return `${key}: ${value[0]}`
          if (typeof value === 'string') return `${key}: ${value}`
        }
      }

      return fallback
    },
    async descargarPDF(tipo) {
      try {
        const res = await api.get(`reportes/${tipo}/`, { responseType: 'blob' })
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${tipo}_neurolab.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } catch {
        alert('No se pudo generar el reporte PDF.')
      }
    },
  },
}
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: #f4f4f8;
}

.content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.section-divider {
  height: 2px;
  background: #e8e8ee;
  margin: 2.5rem 0;
  border-radius: 2px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.1rem;
}

.page-header h1 {
  font-size: 1.4rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.filters-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 1.1rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 160px;
  padding: .55rem .9rem;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  font-size: .9rem;
  outline: none;
}

.search-input:focus {
  border-color: #80201d;
}

.filter-select {
  padding: .55rem .8rem;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  font-size: .9rem;
  background: #fff;
  outline: none;
}

.table-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  margin-bottom: 1rem;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .87rem;
}

.data-table th {
  background: #f8f8fb;
  padding: .65rem 1rem;
  text-align: left;
  font-size: .77rem;
  font-weight: 600;
  color: #666;
  border-bottom: 1px solid #e0e0e0;
  white-space: nowrap;
}

.data-table td {
  padding: .6rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.td-clip {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-row {
  text-align: center;
  color: #aaa;
  padding: 2rem !important;
}

.actions {
  display: flex;
  gap: 4px;
}

.badge {
  display: inline-block;
  font-size: .75rem;
  padding: 2px 10px;
  border-radius: 99px;
  font-weight: 500;
}

.badge-blue {
  background: #e3f2fd;
  color: #1565c0;
}

.badge-pink {
  background: #fce4ec;
  color: #c62828;
}

.badge-purple {
  background: #f3e5f5;
  color: #6a0dad;
}

.state-msg {
  padding: 2rem;
  text-align: center;
  color: #888;
}

.state-msg.error {
  color: #c62828;
}

.btn-primary {
  background: #80201d;
  color: #fff;
  border: none;
  padding: .55rem 1.2rem;
  border-radius: 8px;
  font-size: .9rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  background: #9e2a26;
}

.btn-primary:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  border: 1.5px solid #ccc;
  color: #555;
  padding: .55rem 1.2rem;
  border-radius: 8px;
  font-size: .9rem;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px 6px;
  border-radius: 6px;
}

.btn-icon:hover {
  background: #f0f0f0;
}

.btn-icon.danger:hover {
  background: #ffebee;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal {
  background: #fff;
  border-radius: 14px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: #1a1a2e;
}

.fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-full {
  grid-column: 1 / -1;
}

.field label {
  font-size: .82rem;
  font-weight: 500;
  color: #555;
}

.field input,
.field select,
.field textarea {
  padding: .55rem .8rem;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  font-size: .9rem;
  outline: none;
  font-family: inherit;
  resize: vertical;
}

.field input:focus,
.field select:focus {
  border-color: #80201d;
}

.input-error {
  border-color: #c62828 !important;
  background: #fff8f8;
}

.field-error {
  color: #c62828;
  font-size: .78rem;
}

.field-hint {
  color: #aaa;
  font-size: .76rem;
}

.label-hint {
  font-size: .75rem;
  color: #80201d;
  font-weight: 400;
  margin-left: 6px;
}

.req {
  color: #c62828;
}

.id-row {
  display: flex;
  gap: 6px;
}

.id-row input {
  flex: 1;
}

.btn-auto {
  padding: .4rem .8rem;
  background: #f0e8e8;
  color: #80201d;
  border: 1.5px solid #d4a0a0;
  border-radius: 7px;
  font-size: .8rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.btn-auto:hover {
  background: #e8d0d0;
}

.form-error {
  color: #c62828;
  font-size: .82rem;
  background: #ffebee;
  padding: .5rem;
  border-radius: 6px;
  margin-top: .75rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 1.5rem;
}

.btn-outline {
  background: transparent;
  border: 1.5px solid #80201d;
  color: #80201d;
  padding: .55rem 1.2rem;
  border-radius: 8px;
  font-size: .9rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-outline:hover {
  background: #fff0f0;
}

.pagination-bar {
  display: flex; align-items: center; justify-content: center;
  gap: 14px; padding: .7rem 1rem; font-size: .83rem;
  color: #888; border-top: .5px solid #f0f0f0;
}
.pagination-bar button {
  background: transparent; border: 1.5px solid #ddd;
  border-radius: 6px; padding: 3px 12px; font-size: .82rem; cursor: pointer;
}
.pagination-bar button:disabled { opacity: .35; cursor: not-allowed; }
.pagination-bar button:hover:not(:disabled) { border-color: #80201d; color: #80201d; }
</style>