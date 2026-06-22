<template>
  <div class="page-wrapper">
    <Navbar />
    <main class="content">

      <!-- ══ TABS DE SELECCIÓN DE TABLA ══════════════════════ -->
      <div class="inv-tabs-wrap">
        <div class="inv-tabs">
          <button class="inv-tab" :class="{ 'inv-tab--active': vistaActiva === 'cajas' }"
                  @click="cambiarVista('cajas')">
            <Icon name="box" :size="15" />
            Cajas
          </button>
          <button class="inv-tab" :class="{ 'inv-tab--active': vistaActiva === 'ratas' }"
                  @click="cambiarVista('ratas')">
            <Icon name="rat" :size="15" />
            Ratas
          </button>
          <button class="inv-tab" :class="{ 'inv-tab--active': vistaActiva === 'ambas' }"
                  @click="cambiarVista('ambas')">
            <Icon name="users" :size="15" />
            Ambas
          </button>
        </div>
        <div class="inv-tabs-actions">
          <button class="btn-outline" @click="descargarReporte('inventario', 'pdf')">⬇ PDF</button>
          <button class="btn-outline" @click="descargarReporte('inventario', 'excel')">⬇ Excel</button>
        </div>
      </div>

      <!-- ══ SECCIÓN CAJAS ═══════════════════════════════════ -->
      <transition name="tab-section">
        <div v-show="vistaActiva === 'cajas' || vistaActiva === 'ambas'" class="inv-section">
          <div class="page-header">
            <h1>Inventario de Cajas</h1>
            <button v-if="isEncargado" class="btn-primary btn-breathe" @click="abrirModalCaja()">+ Nueva caja</button>
          </div>

      <div class="filters-bar">
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
        <!-- ── Skeleton loader mientras carga ── -->
        <div v-if="loadingCajas" class="skeleton-table">
          <div class="skeleton-row" v-for="n in 5" :key="n">
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton skeleton-cell skeleton-cell--lg"></div>
          </div>
        </div>
        <div v-else-if="errorCajas" class="state-msg error shake-error">{{ errorCajas }}</div>
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
          <transition-group name="list" tag="tbody">
            <tr v-for="c in cajas" :key="c.idcaja" :class="{ 'row-removing': removingCajaId === c.idcaja }">
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
          </transition-group>
        </table>
        <div v-if="!loadingCajas && !errorCajas && !cajas.length" class="empty-state">
          <span class="empty-state-icon">📦</span>
          No hay cajas registradas.
        </div>

        <div v-if="cajasTotalPages > 1" class="pagination-bar">
          <button :disabled="cajasPage === 1" @click="cajasPage--; fetchCajas()">← Anterior</button>
          <span>Página {{ cajasPage }} de {{ cajasTotalPages }} · {{ cajasTotal }} registros</span>
          <button :disabled="cajasPage === cajasTotalPages" @click="cajasPage++; fetchCajas()">Siguiente →</button>
        </div>
      </div>

      </div><!-- /.inv-section cajas -->
      </transition>

      <!-- ══ SECCIÓN RATAS ════════════════════════════════════ -->
      <transition name="tab-section">
        <div v-show="vistaActiva === 'ratas' || vistaActiva === 'ambas'" class="inv-section">

          <div class="page-header">
            <h1>Registro de Ratas</h1>
            <button v-if="isEncargado" class="btn-primary btn-breathe" @click="abrirModalRata()">+ Nueva rata</button>
          </div>

      <div class="filters-bar">
        <input v-model="busquedaRata" type="text" placeholder="Buscar por ID de rata (ej. M-3, H-12)…" class="search-input"
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
        <div v-if="loadingRatas" class="skeleton-table">
          <div class="skeleton-row" v-for="n in 5" :key="n">
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
          </div>
        </div>
        <div v-else-if="errorRatas" class="state-msg error shake-error">{{ errorRatas }}</div>
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
          <transition-group name="list" tag="tbody">
            <tr v-for="r in ratas" :key="`${r.sexo}-${r.idrata}`" :class="{ 'row-removing': removingRataId === r.id }">
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
          </transition-group>
        </table>
        <div v-if="!loadingRatas && !errorRatas && !ratas.length" class="empty-state">
          <span class="empty-state-icon">🐀</span>
          No hay ratas registradas.
        </div>
        <div v-if="ratasTotalPages > 1" class="pagination-bar">
          <button :disabled="ratasPage === 1" @click="ratasPage--; fetchRatas()">← Anterior</button>
          <span>Página {{ ratasPage }} de {{ ratasTotalPages }} · {{ ratasTotal }} registros</span>
          <button :disabled="ratasPage === ratasTotalPages" @click="ratasPage++; fetchRatas()">Siguiente →</button>
        </div>
      </div>

        </div><!-- /.inv-section ratas -->
      </transition>

      <!-- ══ MODAL CAJA ════════════════════════════════════════ -->
      <transition name="modal-fade">
        <div v-if="modalCaja" class="modal-overlay" @click.self="modalCaja = false">
          <transition name="modal-pop" appear>
            <div class="modal" v-if="modalCaja">
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
                <p v-if="errorModal" class="form-error shake-error" :key="errorModalKey">{{ errorModal }}</p>
                <div class="modal-actions">
                  <button type="button" class="btn-secondary" @click="modalCaja = false">Cancelar</button>
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

      <!-- ══ MODAL RATA ════════════════════════════════════════ -->
      <transition name="modal-fade">
        <div v-if="modalRata" class="modal-overlay" @click.self="modalRata = false">
          <transition name="modal-pop" appear>
            <div class="modal" v-if="modalRata">
              <h2>{{ editandoRata ? 'Editar rata' : 'Registrar rata' }}</h2>
              <form @submit.prevent="guardarRata">
                <div class="fields-grid">

                  <div class="field">
                    <label>Sexo <span class="req">*</span></label>
                    <select v-model="formRata.sexo" required @change="cargarSiguienteId">
                      <option value="">Seleccionar…</option>
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                    </select>
                  </div>

                  <div class="field field-full">
                    <label>
                      ID de rata
                      <span class="label-hint">
                        {{ formRata.sexo ? `Siguiente disponible: ${siguienteId}` : '' }}
                      </span>
                    </label>
                    <div class="id-row">
                      <input v-model.number="formRata.idrata" type="number" min="1"
                        :placeholder="formRata.sexo ? `Auto: ${siguienteId}` : 'Selecciona sexo primero'"
                        :disabled="!formRata.sexo || !isEncargado"
                        :class="{ 'input-error shake-error': errorIdRata }" />
                      <button v-if="formRata.sexo && isEncargado" type="button" class="btn-auto" @click="usarIdAuto"
                        title="Usar ID automático">Auto</button>
                    </div>
                    <span v-if="errorIdRata" class="field-error">{{ errorIdRata }}</span>
                    <span class="field-hint">Deja vacío para asignar automáticamente.</span>
                  </div>

                  <div class="field">
                    <label>N° de cola <span class="req">*</span></label>
                    <input v-model.number="formRata.numerocola" type="number" min="1" required />
                  </div>

                  <div class="field">
                    <label>Caja</label>
                    <select v-model.number="formRata.idcaja">
                      <option value="">Sin asignar</option>
                      <option v-for="c in cajasFiltradas" :key="c.idcaja" :value="c.idcaja">
                        Caja #{{ c.idcaja }} — {{ c.sexo }}
                      </option>
                    </select>
                  </div>

                  <div class="field">
                    <label>Condición</label>
                    <select v-model="formRata.idcondicion">
                      <option value="">Sin condición</option>
                      <option v-for="c in condiciones" :key="c.idcondicion" :value="c.idcondicion">
                        {{ c.nombrecondicion }}
                      </option>
                    </select>
                  </div>

                  <div class="field field-full">
                    <label>Fecha de cirugía / protocolo</label>
                    <input v-model="formRata.fechacirugia" type="date" />
                  </div>
                </div>

                <p v-if="errorModal" class="form-error shake-error" :key="errorModalKey">{{ errorModal }}</p>
                <div class="modal-actions">
                  <button type="button" class="btn-secondary" @click="modalRata = false">Cancelar</button>
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

      <!-- ══ MODAL HISTORIAL DE PESOS ══════════════════════════════ -->
      <transition name="modal-fade">
        <div v-if="modalPesos" class="modal-overlay" @click.self="modalPesos = false">
          <transition name="modal-pop" appear>
            <div class="modal modal--wide" v-if="modalPesos">
              <h2>
                ⚖️ Historial de pesos —
                <span v-if="rataSeleccionada">
                  {{ rataSeleccionada.sexo[0] }}-{{ rataSeleccionada.idrata }}
                  (Cola {{ rataSeleccionada.numerocola }})
                </span>
              </h2>

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
                  <button class="btn-primary" @click="registrarPeso" :disabled="guardandoPeso">
                    <span v-if="guardandoPeso" class="spinner-bounce">⏳</span>
                    <span v-else>+ Registrar peso</span>
                  </button>
                </div>
              </div>

              <div class="peso-historial">
                <!-- ── Gráfica de tendencia de peso ────────────────── -->
                <div v-if="!loadingPesos && historialPesos.length >= 2" class="peso-chart-card">
                  <div class="peso-chart-header">
                    <span class="peso-chart-title">Tendencia de peso</span>
                    <span class="peso-trend-badge" :class="pesoTrendInfo.cls">
                      <Icon :name="pesoTrendInfo.icon" :size="14" />
                      {{ pesoTrendInfo.label }}
                    </span>
                  </div>
                  <svg viewBox="0 0 320 110" class="peso-chart-svg">
                    <!-- líneas guía -->
                    <line x1="0" y1="20" x2="320" y2="20" class="peso-chart-grid" />
                    <line x1="0" y1="55" x2="320" y2="55" class="peso-chart-grid" />
                    <line x1="0" y1="90" x2="320" y2="90" class="peso-chart-grid" />
                    <!-- área bajo la curva -->
                    <polygon :points="pesoChartArea" class="peso-chart-area" :class="pesoTrendInfo.cls" />
                    <!-- línea principal -->
                    <polyline :points="pesoChartLine" class="peso-chart-line" :class="pesoTrendInfo.cls" />
                    <!-- puntos -->
                    <circle v-for="(p, i) in pesoChartPoints" :key="i"
                      :cx="p.x" :cy="p.y" r="3.2" class="peso-chart-dot" :class="pesoTrendInfo.cls" />
                  </svg>
                  <div class="peso-chart-labels">
                    <span>{{ fmtShort(historialPesosAsc[0]?.fecha) }}</span>
                    <span>{{ fmtShort(historialPesosAsc[historialPesosAsc.length - 1]?.fecha) }}</span>
                  </div>
                </div>
                <div v-else-if="!loadingPesos && historialPesos.length === 1" class="peso-chart-hint">
                  Registra al menos 2 pesos para ver la gráfica de tendencia.
                </div>

                <div v-if="loadingPesos" class="skeleton-table">
                  <div class="skeleton-row" v-for="n in 3" :key="n">
                    <div class="skeleton skeleton-cell skeleton-cell--md"></div>
                    <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
                    <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
                    <div class="skeleton skeleton-cell skeleton-cell--lg"></div>
                  </div>
                </div>
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
                  <transition-group name="list" tag="tbody">
                    <tr v-for="(p, i) in historialPesos" :key="p.id" :class="{ 'row-removing': removingPesoId === p.id }">
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
                  </transition-group>
                </table>
                <div v-else class="empty-state">
                  <span class="empty-state-icon">⚖️</span>
                  Sin registros de peso todavía.
                </div>
              </div>

              <div class="modal-actions">
                <button class="btn-secondary" @click="modalPesos = false">Cerrar</button>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </main>
  </div>
</template>

<script>
import Navbar from '../components/Navbar.vue'
import Icon from '../components/Icon.vue'
import api from '../api'
import { mapGetters } from 'vuex'
import { debounce } from '../utils/debounce'

export default {
  name: 'InventarioView',
  components: { Navbar, Icon },
  data() {
    return {
      cajas: [], loadingCajas: true, errorCajas: null,
      busquedaCaja: '', filtroSexoCaja: '',
      modalCaja: false, editandoCaja: false,
      formCaja: { cantidadratas: 1, sexo: '', fechanacimiento: '', talla: '', comentarios: '', idusuario: '' },
      removingCajaId: null,
      ratas: [], loadingRatas: true, errorRatas: null,
      busquedaRata: '', filtroSexoRata: '', filtroCaja: '',
      condiciones: [],
      modalRata: false, editandoRata: false,
      siguienteId: '—', errorIdRata: null,
      formRata: { id: null, idrata: '', sexo: '', numerocola: '', idcaja: '', idcondicion: '', fechacirugia: '' },
      removingRataId: null,
      saving: false, errorModal: null, errorModalKey: 0,
      usuarios: [],
      cajasPage: 1, cajasTotalPages: 1, cajasTotal: 0,
      // Vista activa: 'cajas' | 'ratas' | 'ambas'
      vistaActiva: 'ambas',
      ratasPage: 1, ratasTotalPages: 1, ratasTotal: 0,
      cajasDropdown: [],
      modalPesos: false,
      rataSeleccionada: null,
      historialPesos: [],
      loadingPesos: false,
      guardandoPeso: false,
      removingPesoId: null,
      formPeso: { fecha: '', peso: '', notas: '' },
      ubicaciones: [],
      filtroUbicacion: '',
    }
  },
  computed: {
    ...mapGetters(['isEncargado', 'isAdmin']),
    cajasFiltradas() {
      const source = this.cajasDropdown.length ? this.cajasDropdown : this.cajas
      if (!this.formRata.sexo) return source
      return source.filter(c => c.sexo === this.formRata.sexo)
    },

    // ── Gráfica de tendencia de peso ──────────────────────────────
    historialPesosAsc() {
      // historialPesos viene del API ordenado del más reciente al más
      // antiguo; para graficar de izquierda (antiguo) a derecha (reciente)
      // se invierte el orden.
      return [...this.historialPesos].reverse()
    },

    pesoChartPoints() {
      const data = this.historialPesosAsc
      if (data.length < 2) return []
      const pesos = data.map(p => Number(p.peso))
      const min = Math.min(...pesos)
      const max = Math.max(...pesos)
      const range = (max - min) || 1
      const padY = 15
      const chartH = 110 - padY * 2
      const w = 320
      const step = w / (data.length - 1)
      return data.map((p, i) => {
        const x = i * step
        const normalized = (Number(p.peso) - min) / range
        const y = padY + (1 - normalized) * chartH
        return { x, y, peso: p.peso, fecha: p.fecha }
      })
    },

    pesoChartLine() {
      return this.pesoChartPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    },

    pesoChartArea() {
      const pts = this.pesoChartPoints
      if (!pts.length) return ''
      const first = pts[0]
      const last = pts[pts.length - 1]
      return `${first.x},110 ` + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ` ${last.x},110`
    },

    pesoTrendInfo() {
      const data = this.historialPesosAsc
      if (data.length < 2) return { label: 'Sin datos suficientes', icon: 'minus', cls: 'trend-neutral' }
      const first = Number(data[0].peso)
      const last = Number(data[data.length - 1].peso)
      const diff = last - first
      const pct = first ? (diff / first) * 100 : 0
      if (Math.abs(pct) < 1) return { label: 'Peso estable', icon: 'minus', cls: 'trend-neutral' }
      if (diff > 0) return { label: `Subió ${pct.toFixed(1)}%`, icon: 'trending-up', cls: 'trend-up' }
      return { label: `Bajó ${Math.abs(pct).toFixed(1)}%`, icon: 'trending-down', cls: 'trend-down' }
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
    _showError(msg) {
      this.errorModal = msg
      this.errorModalKey++
    },

    cambiarVista(vista) {
      if (this.vistaActiva === vista) return
      this.vistaActiva = vista
    },

    async fetchCajas() {
      this.loadingCajas = true
      this.errorCajas = null
      try {
        const params = { page: this.cajasPage }
        if (this.busquedaCaja) params.search = this.busquedaCaja
        if (this.filtroSexoCaja) params.sexo = this.filtroSexoCaja
        if (this.filtroUbicacion) params.idubicacion = this.filtroUbicacion
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

    async guardarCaja() {
      this.saving = true; this.errorModal = null
      try {
        if (this.editandoCaja) await api.put(`cajas/${this.formCaja.idcaja}/`, this.formCaja)
        else await api.post('cajas/', this.formCaja)
        this.modalCaja = false
        await this.fetchCajas()
        this.$toast.success(this.editandoCaja ? 'Caja actualizada.' : 'Caja registrada.')
      } catch (err) {
        this._showError(this._parseError(err, 'Error al guardar la caja.'))
      } finally { this.saving = false }
    },

    async eliminarCaja(c) {
      const ok = await this.$confirm(
        `¿Eliminar la caja #${c.idcaja}? Esta acción no se puede deshacer.`,
        'Eliminar caja'
      )
      if (!ok) return
      this.removingCajaId = c.idcaja
      try {
        await api.delete(`cajas/${c.idcaja}/`)
        setTimeout(async () => {
          await this.fetchCajas()
          this.removingCajaId = null
          this.$toast.success('Caja eliminada.')
        }, 320)
      } catch {
        this.removingCajaId = null
        this.$toast.error('No se pudo eliminar la caja.')
      }
    },

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
          this._showError(this._parseError(err, 'Error al guardar la rata.'))
        }
      } finally { this.saving = false }
    },

    async eliminarRata(r) {
      const ok = await this.$confirm(
        `¿Eliminar la rata ${r.sexo[0]}-${r.idrata}?`,
        'Eliminar rata'
      )
      if (!ok) return
      this.removingRataId = r.id
      try {
        await api.delete(`ratas/${r.id}/`)
        setTimeout(async () => {
          await this.fetchRatas()
          this.removingRataId = null
          this.$toast.success('Rata eliminada.')
        }, 320)
      } catch {
        this.removingRataId = null
        this.$toast.error('No se pudo eliminar la rata.')
      }
    },

    fmtShort(d) {
      if (!d) return ''
      const [y, m, day] = d.split('-')
      return `${day}/${m}`
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

      if (typeof data === 'string' && data.includes('<')) {
        console.error('Server HTML response:', data)
        if (status === 500) return 'Error interno del servidor. Por favor, intenta nuevamente.'
        if (status === 400) return 'Datos inválidos. Verifica los campos del formulario.'
        return fallback
      }

      if (typeof data === 'string') return data

      if (typeof data === 'object') {
        if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : data.detail
        if (data.error) return data.error
        if (data.message) return data.message

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
      this.guardandoPeso = true
      try {
        await api.post('pesos/', {
          idrata: this.rataSeleccionada.id,
          fecha: this.formPeso.fecha,
          peso: this.formPeso.peso,
          notas: this.formPeso.notas || null,
        })
        this.$toast.success('Peso registrado.')
        const res = await api.get('pesos/', {
          params: { idrata: this.rataSeleccionada.id, page_size: 100 }
        })
        this.historialPesos = res.data.results ?? res.data
        this.formPeso.peso = ''
        this.formPeso.notas = ''
        await this.fetchRatas()
      } catch { this.$toast.error('Error al registrar el peso.') }
      finally { this.guardandoPeso = false }
    },

    async eliminarPeso(p) {
      const ok = await this.$confirm(`¿Eliminar el registro del ${p.fecha}?`, 'Eliminar peso')
      if (!ok) return
      this.removingPesoId = p.id
      try {
        await api.delete(`pesos/${p.id}/`)
        setTimeout(async () => {
          this.historialPesos = this.historialPesos.filter(x => x.id !== p.id)
          this.removingPesoId = null
          this.$toast.success('Registro eliminado.')
          await this.fetchRatas()
        }, 320)
      } catch {
        this.removingPesoId = null
        this.$toast.error('No se pudo eliminar.')
      }
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

/* ════════════════════════════════════
   TABS DE SELECCIÓN
   ════════════════════════════════════ */
.inv-tabs-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.inv-tabs {
  display: flex;
  gap: .5rem;
  background: #f0f0f5;
  padding: 5px;
  border-radius: 12px;
}

.inv-tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: .5rem 1.1rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: .86rem;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  font-family: inherit;
  position: relative;
  /* transición suave de color y elevación */
  transition: color .2s ease, background .2s ease,
              transform .22s cubic-bezier(.22,.68,0,1.3),
              box-shadow .22s ease;
  user-select: none;
}

.inv-tab:hover:not(.inv-tab--active) {
  color: #555;
  background: rgba(255,255,255,.6);
}

/* Tab activo: fondo blanco, levemente levantado */
.inv-tab--active {
  background: #fff;
  color: #80201d;
  font-weight: 600;
  /* Elevación — se levanta 3px y adquiere una sombra suave */
  transform: translateY(-3px);
  box-shadow:
    0 4px 12px rgba(128,32,29,.18),
    0 1px 3px rgba(0,0,0,.08);
}

/* Pequeño punto de acento debajo del tab activo */
.inv-tab--active::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: #80201d;
  border-radius: 50%;
  animation: dotPop .25s cubic-bezier(.22,.68,0,1.4) both;
}

@keyframes dotPop {
  from { transform: translateX(-50%) scale(0); }
  to   { transform: translateX(-50%) scale(1); }
}

.inv-tabs-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ════════════════════════════════════
   ANIMACIÓN DE SECCIÓN AL CAMBIAR TAB
   (desvanecimiento + deslizamiento hacia abajo)
   ════════════════════════════════════ */
.tab-section-enter-active {
  transition: opacity .28s ease, transform .28s ease;
}

.tab-section-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}

.tab-section-enter-from {
  opacity: 0;
  transform: translateY(14px);
}

.tab-section-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* Separador visual entre secciones cuando están ambas visibles */
.inv-section + .inv-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1.5px solid #f0f0f4;
}

.peso-form {
  background: #f8f8fb;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  border: .5px solid #e0e0e0;
  animation: fadeSlideUp .3s ease both;
}

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.peso-historial { margin-top: .5rem; }

/* ── Gráfica de tendencia de peso ── */
.peso-chart-card {
  background: #fafafd;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1rem 1.1rem .75rem;
  margin-bottom: 1.1rem;
  animation: fadeSlideUp .3s ease both;
}

.peso-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: .6rem;
}

.peso-chart-title {
  font-size: .82rem;
  font-weight: 600;
  color: #555;
}

.peso-trend-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: .76rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 99px;
}

.trend-up   { color: #2e7d32; background: #e8f5e9; }
.trend-down { color: #c62828; background: #ffebee; }
.trend-neutral { color: #757575; background: #f0f0f0; }

.peso-chart-svg {
  width: 100%;
  height: auto;
  aspect-ratio: 320 / 110;
  display: block;
  overflow: visible;
}

.peso-chart-grid {
  stroke: #eee;
  stroke-width: 1;
}

.peso-chart-area {
  fill-opacity: .12;
  stroke: none;
}
.peso-chart-area.trend-up      { fill: #2e7d32; }
.peso-chart-area.trend-down    { fill: #c62828; }
.peso-chart-area.trend-neutral { fill: #757575; }

.peso-chart-line {
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: drawLine .8s ease both;
}
.peso-chart-line.trend-up      { stroke: #2e7d32; }
.peso-chart-line.trend-down    { stroke: #c62828; }
.peso-chart-line.trend-neutral { stroke: #757575; }

@keyframes drawLine {
  from { stroke-dasharray: 600; stroke-dashoffset: 600; }
  to   { stroke-dasharray: 600; stroke-dashoffset: 0; }
}

.peso-chart-dot {
  stroke: #fff;
  stroke-width: 1.5;
  transition: r .15s;
}
.peso-chart-dot.trend-up      { fill: #2e7d32; }
.peso-chart-dot.trend-down    { fill: #c62828; }
.peso-chart-dot.trend-neutral { fill: #757575; }
.peso-chart-dot:hover { r: 5; }

.peso-chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: .7rem;
  color: #aaa;
  margin-top: .3rem;
}

.peso-chart-hint {
  text-align: center;
  font-size: .82rem;
  color: #aaa;
  padding: 1rem;
  background: #fafafd;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.tend {
  font-size: 1rem;
  font-weight: 600;
  display: inline-block;
}

.tend-up   { color: #2e7d32; animation: tendBounceUp .4s ease; }
.tend-down { color: #c62828; animation: tendBounceDown .4s ease; }

@keyframes tendBounceUp {
  0%   { transform: translateY(4px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes tendBounceDown {
  0%   { transform: translateY(-4px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.tend-eq { color: #888; }

.peso-fecha {
  font-size: .72rem;
  color: #aaa;
  margin-left: 4px;
}

.skeleton-table { padding: .5rem 0; }
.skeleton-table .skeleton-row { border-bottom: 1px solid #f3f3f6; }

@media (max-width: 640px) {
  .content { padding: 1rem .85rem; }
  .skeleton-row { padding: .6rem .75rem; gap: .6rem; }
  .skeleton-cell--lg { display: none; }
}
</style>
