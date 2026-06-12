<template>
  <div class="page-wrapper">
    <Navbar />
    <main class="content">

      <!-- ══ SECCIÓN CAJAS ═══════════════════════════════════ -->
      <div class="page-header">
        <h1>Inventario de Cajas</h1>
        <div style="display:flex;gap:8px">
          <button class="btn-outline" @click="descargarReporte('inventario', 'pdf')">⬇ PDF</button>
          <button class="btn-outline" @click="descargarReporte('inventario', 'excel')">⬇ Excel</button>
          <button v-if="isEncargado" class="btn-primary" @click="abrirModalCaja()">+ Nueva caja</button>
        </div>
      </div>

      <div class="filters-bar">
        <!-- Cajas -->
        <input v-model="busquedaCaja" type="text" placeholder="Buscar por comentarios…" class="search-input"
          @input="cajasPage = 1; fetchCajasDebounced()" />
        <select v-model="filtroSexoCaja" class="filter-select" @change="cajasPage = 1; fetchCajas()">
          <option value="">Todos los sexos</option>
          <option value="Macho">Macho</option>
          <option value="Hembra">Hembra</option>
        </select>
        <select v-model="filtroUbicacion" class="filter-select" @change="cajasPage = 1; fetchCajas()">
          <option value="">Todas las ubicaciones</option>
          <option v-for="u in ubicaciones" :key="u.idubicacion" :value="u.idubicacion">
            {{ u.nombreubicacion }}
          </option>
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
              <th>Ratas registradas</th>
              <th>Sexo</th>
              <th>F. Nacimiento</th>
              <th>Talla</th>
              <th>Ubicación</th>
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
              <td>{{ c.ubicacion_nombre || '—' }}</td>
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
        <<!-- Ratas -->
          <input v-model="busquedaRata" type="text" placeholder="Buscar por número de cola…" class="search-input"
            @input="ratasPage = 1; fetchRatasDebounced()" />
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
              <th>Último peso (g)</th>
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
              <td>
                <span v-if="r.ultimo_peso">
                  {{ r.ultimo_peso }}
                  <span class="peso-fecha">{{ fmtShort(r.ultima_fecha_peso) }}</span>
                </span>
                <span v-else>—</span>
              </td>
              <td>{{ fmt(r.fechacirugia) }}</td>
              <td v-if="isEncargado" class="actions">
                <button class="btn-icon" @click="abrirPesos(r)" title="Historial de pesos">⚖️</button>
                <button class="btn-icon" @click="abrirModalRata(r)" title="Editar">✏️</button>
                <button v-if="isAdmin" class="btn-icon danger" @click="eliminarRata(r)" title="Eliminar">🗑️</button>
              </td>
            </tr>
            <tr v-if="!ratas.length">
              <td :colspan="isEncargado ? 8 : 7" class="empty-row">No hay ratas registradas.</td>
            </tr>
          </tbody>
        </table>
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
              <div class="field">
                <label>Ubicación</label>
                <select v-model.number="formCaja.idubicacion">
                  <option value="">Sin asignar</option>
                  <option v-for="u in ubicaciones" :key="u.idubicacion" :value="u.idubicacion">
                    {{ u.nombreubicacion }}
                  </option>
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
      <!-- ══ MODAL HISTORIAL DE PESOS ══════════════════════════════ -->
      <div v-if="modalPesos" class="modal-overlay" @click.self="modalPesos = false">
        <div class="modal modal--wide">
          <h2>
            ⚖️ Historial de pesos —
            <span v-if="rataSeleccionada">
              {{ rataSeleccionada.sexo[0] }}-{{ rataSeleccionada.idrata }}
              (Cola {{ rataSeleccionada.numerocola }})
            </span>
          </h2>

          <!-- Formulario de nuevo peso -->
          <div class="peso-form">
            <div class="fields-grid">
              <div class="field">
                <label>Fecha <span class="req">*</span></label>
                <input v-model="formPeso.fecha" type="date" />
              </div>
              <div class="field">
                <label>Peso (g) <span class="req">*</span></label>
                <input v-model.number="formPeso.peso" type="number" step="0.1" placeholder="320" />
              </div>
              <div class="field field-full">
                <label>Notas</label>
                <input v-model="formPeso.notas" type="text" placeholder="Observaciones opcionales…" />
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:.75rem">
              <button class="btn-primary" @click="registrarPeso">+ Registrar peso</button>
            </div>
          </div>

          <!-- Historial -->
          <div class="peso-historial">
            <div v-if="loadingPesos" class="state-msg">Cargando historial…</div>
            <table v-else-if="historialPesos.length" class="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Peso (g)</th>
                  <th>Tendencia</th>
                  <th>Notas</th>
                  <th v-if="isAdmin">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, i) in historialPesos" :key="p.id">
                  <td>{{ fmt(p.fecha) }}</td>
                  <td><strong>{{ p.peso }}</strong></td>
                  <td>
                    <span :class="['tend', pesoTendencia(i) === '↑' ? 'tend-up'
                      : pesoTendencia(i) === '↓' ? 'tend-down' : 'tend-eq']">
                      {{ pesoTendencia(i) || '—' }}
                    </span>
                  </td>
                  <td>{{ p.notas || '—' }}</td>
                  <td v-if="isAdmin">
                    <button class="btn-icon danger" @click="eliminarPeso(p)">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="state-msg">Sin registros de peso todavía.</div>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" @click="modalPesos = false">Cerrar</button>
          </div>
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
      formRata: { id: null, idrata: '', sexo: '', numerocola: '', idcaja: '', idcondicion: '', fechacirugia: '' },
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
      // Pesos semanales
      modalPesos: false,
      rataSeleccionada: null,
      historialPesos: [],
      loadingPesos: false,
      formPeso: { fecha: '', peso: '', notas: '' },
      ubicaciones: [],
      filtroUbicacion: '',
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
    this.fetchCajasDebounced = debounce(this.fetchCajas, 300)
    this.fetchRatasDebounced = debounce(this.fetchRatas, 300)
    await Promise.all([
      this.fetchCajas(), this.fetchRatas(),
      this.fetchCondiciones(), this.fetchUsuarios(),
      this.fetchCajasDropdown(),
      this.fetchUbicaciones(),
    ])
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
        if (this.filtroUbicacion) params.idubicacion = this.filtroUbicacion
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
    limpiarCajas() {
      this.busquedaCaja = ''; this.filtroSexoCaja = ''; this.filtroUbicacion = ''
      this.cajasPage = 1
      this.fetchCajas()
    },
    abrirModalCaja(c = null) {
      this.errorModal = null
      this.editandoCaja = !!c
      this.formCaja = c
        ? {
          idcaja: c.idcaja, cantidadratas: c.cantidadratas,
          sexo: c.sexo, fechanacimiento: c.fechanacimiento,
          talla: c.talla || '', comentarios: c.comentarios || '',
          idusuario: c.idusuario || '',
          idubicacion: c.idubicacion || '',
        }
        : {
          cantidadratas: 0, sexo: '', fechanacimiento: '',
          talla: '', comentarios: '', idusuario: '',
          idubicacion: '',
        }
      this.modalCaja = true
    },
    async guardarRata() {
      this.saving = true; this.errorModal = null; this.errorIdRata = null
      try {
        const payload = {
          sexo: this.formRata.sexo,
          numerocola: this.formRata.numerocola,
          idcaja: this.formRata.idcaja || null,
        }
        if (this.formRata.idrata) payload.idrata = this.formRata.idrata
        if (this.formRata.idcondicion) payload.idcondicion = this.formRata.idcondicion
        if (this.formRata.fechacirugia) payload.fechacirugia = this.formRata.fechacirugia

        if (this.editandoRata) await api.put(`ratas/${this.formRata.id}/`, payload)
        else await api.post('ratas/', payload)
        this.modalRata = false
        await this.fetchRatas()
        this.$toast.success(this.editandoRata ? 'Rata actualizada.' : 'Rata registrada.')
      } catch (err) {
        const data = err.response?.data
        if (data?.idrata) {
          this.errorIdRata = Array.isArray(data.idrata) ? data.idrata[0] : data.idrata
        } else {
          this.errorModal = this._parseError(err, 'Error al guardar la rata.')
        }
      } finally { this.saving = false }
    },

    async guardarCaja() {
      this.saving = true; this.errorModal = null
      try {
        if (this.editandoCaja) await api.put(`cajas/${this.formCaja.idcaja}/`, this.formCaja)
        else await api.post('cajas/', this.formCaja)
        this.modalCaja = false
        await this.fetchCajas()
        this.$toast.success(this.editandoCaja ? 'Caja actualizada.' : 'Caja registrada.')
      } catch (err) {
        this.errorModal = this._parseError(err, 'Error al guardar la caja.')
      } finally { this.saving = false }
    },

    async eliminarCaja(c) {
      const ok = await this.$confirm(
        `¿Eliminar la caja #${c.idcaja}? Esta acción no se puede deshacer.`,
        'Eliminar caja'
      )
      if (!ok) return
      try {
        await api.delete(`cajas/${c.idcaja}/`)
        await this.fetchCajas()
        this.$toast.success('Caja eliminada.')
      } catch {
        this.$toast.error('No se pudo eliminar la caja.')
      }
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
      try {
        const r = await api.get('usuarios/', { params: { page_size: 200 } })
        this.usuarios = r.data.results ?? r.data
      } catch { /* no bloqueante */ }
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
        const payload = { sexo: this.formRata.sexo, numerocola: this.formRata.numerocola, idcaja: this.formRata.idcaja || null }
        if (this.formRata.idrata) payload.idrata = this.formRata.idrata
        if (this.formRata.idcaja) payload.idcaja = this.formRata.idcaja
        if (this.formRata.idcondicion) payload.idcondicion = this.formRata.idcondicion
        if (this.formRata.pesosemanal) payload.pesosemanal = this.formRata.pesosemanal
        if (this.formRata.fechacirugia) payload.fechacirugia = this.formRata.fechacirugia
        if (this.editandoRata) await api.put(`ratas/${this.formRata.id}/`, payload)
        else await api.post('ratas/', payload)
        this.modalRata = false
        await this.fetchRatas()
        this.$toast.success(this.editandoRata ? 'Rata actualizada.' : 'Rata registrada.')
      } catch (err) {
        const data = err.response?.data
        if (data?.idrata) {
          this.errorIdRata = Array.isArray(data.idrata) ? data.idrata[0] : data.idrata
        } else {
          this.errorModal = this._parseError(err, 'Error al guardar la rata.')
        }
      } finally { this.saving = false }
    },

    async eliminarRata(r) {
      const ok = await this.$confirm(
        `¿Eliminar la rata ${r.sexo[0]}-${r.idrata}?`,
        'Eliminar rata'
      )
      if (!ok) return
      try {
        await api.delete(`ratas/${r.id}/`)
        await this.fetchRatas()
        this.$toast.success('Rata eliminada.')
      } catch {
        this.$toast.error('No se pudo eliminar la rata.')
      }
    },

    // ── Helpers ────────────────────────────────────────────────

    fmtShort(d) {
      if (!d) return ''
      const [y, m, day] = d.split('-')
      return `${day}/${m}`   // solo día/mes para no ocupar espacio
    },
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
    async descargarReporte(tipo, formato) {
      const mimes = {
        pdf: 'application/pdf',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
      const exts = { pdf: 'pdf', excel: 'xlsx' }
      try {
        const url = formato === 'excel'
          ? `reportes/${tipo}/excel/`
          : `reportes/${tipo}/`
        const res = await api.get(url, { responseType: 'blob' })
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(new Blob([res.data], { type: mimes[formato] }))
        link.setAttribute('download', `${tipo}_neurolab.${exts[formato]}`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(link.href)
        this.$toast.success(`Reporte ${formato.toUpperCase()} descargado.`)
      } catch {
        this.$toast.error('No se pudo generar el reporte.')
      }
    },

    async abrirPesos(r) {
      this.rataSeleccionada = r
      this.modalPesos = true
      this.loadingPesos = true
      this.formPeso = {
        fecha: new Date().toISOString().split('T')[0],
        peso: '', notas: '',
      }
      try {
        const res = await api.get('pesos/', { params: { idrata: r.id, page_size: 100 } })
        this.historialPesos = res.data.results ?? res.data
      } catch { this.$toast.error('No se pudo cargar el historial.') }
      finally { this.loadingPesos = false }
    },

    async registrarPeso() {
      if (!this.formPeso.peso || !this.formPeso.fecha) {
        this.$toast.warning('Completa la fecha y el peso.')
        return
      }
      try {
        await api.post('pesos/', {
          idrata: this.rataSeleccionada.id,
          fecha: this.formPeso.fecha,
          peso: this.formPeso.peso,
          notas: this.formPeso.notas || null,
        })
        this.$toast.success('Peso registrado.')
        // Recargar historial
        const res = await api.get('pesos/', {
          params: { idrata: this.rataSeleccionada.id, page_size: 100 }
        })
        this.historialPesos = res.data.results ?? res.data
        this.formPeso.peso = ''
        this.formPeso.notas = ''
        await this.fetchRatas()
      } catch { this.$toast.error('Error al registrar el peso.') }
    },

    async eliminarPeso(p) {
      const ok = await this.$confirm(`¿Eliminar el registro del ${p.fecha}?`, 'Eliminar peso')
      if (!ok) return
      try {
        await api.delete(`pesos/${p.id}/`)
        this.historialPesos = this.historialPesos.filter(x => x.id !== p.id)
        this.$toast.success('Registro eliminado.')
        await this.fetchRatas()
      } catch { this.$toast.error('No se pudo eliminar.') }
    },

    pesoTendencia(index) {
      if (index >= this.historialPesos.length - 1) return ''
      const actual = this.historialPesos[index].peso
      const anterior = this.historialPesos[index + 1].peso
      if (actual > anterior) return '↑'
      if (actual < anterior) return '↓'
      return '='
    },

    async fetchUbicaciones() {
      try {
        const r = await api.get('ubicaciones/')
        this.ubicaciones = r.data.results ?? r.data
      } catch { /* no bloqueante */ }
    },
  },
}
</script>

<style scoped>
.content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.peso-form {
  background: #f8f8fb;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  border: .5px solid #e0e0e0;
}

.peso-historial {
  margin-top: .5rem;
}

.tend {
  font-size: 1rem;
  font-weight: 600;
}

.tend-up {
  color: #2e7d32;
}

.tend-down {
  color: #c62828;
}

.tend-eq {
  color: #888;
}

.peso-fecha {
  font-size: .72rem;
  color: #aaa;
  margin-left: 4px;
}
</style>