<template>
    <div class="sw-wrap">

        <!-- ══ TOP BAR ══ -->
        <div class="sw-topbar" v-if="paso !== 'exito'">
            <div class="sw-tb-left">
                <span class="sw-tb-icon">📋</span>
                <div>
                    <div class="sw-tb-title">Registro Semanal de Inventario</div>
                    <div class="sw-tb-sub" v-if="sesion.fecha">
                        {{ sesion.fecha }}
                        <span v-if="paso !== 'setup'"> · {{ nombreUbicacionActual }}</span>
                    </div>
                </div>
            </div>
            <div class="sw-tb-right">
                <div class="sw-prog" v-if="paso === 'cajas' || paso === 'caja'">
                    <span class="sw-prog-n">{{ cajasRevisadasActual.length }}</span>/{{ cajasUbicacionActual.length }}
                    revisadas
                </div>
                <button class="sw-x-btn" @click="cancelarSesion">✕ Salir</button>
            </div>
        </div>

        <!-- Progress bar -->
        <div class="sw-pbar" v-if="paso === 'cajas' || paso === 'caja'">
            <div class="sw-pbar-fill" :style="{ width: progressPct + '%' }"></div>
        </div>

        <transition name="step" mode="out-in">
        <!-- ══════════════════════════════════
         PASO: SETUP
    ══════════════════════════════════ -->
        <div v-if="paso === 'setup'" class="sw-page sw-center">
            <div class="sw-card">
                <div class="sw-big-icon">🐀</div>
                <h2 class="sw-card-h">Registro Semanal</h2>
                <p class="sw-card-p">
                    Guía interactiva para revisar cajas y ratas, registrar pesos y anotar cambios.
                    Al final, todo se guarda en un solo paso.
                </p>

                <!-- Sesión recuperada de localStorage -->
                <div class="sw-recovery" v-if="sesionRecuperada">
                    <p>⚠️ Sesión sin terminar del <strong>{{ sesionRecuperada.fecha }}</strong></p>
                    <div class="sw-row-btns">
                        <button class="btn-primary" @click="retomarSesion">Continuar donde me quedé</button>
                        <button class="btn-ghost" @click="descartarSesion">Comenzar de nuevo</button>
                    </div>
                </div>

                <template v-else>
                    <div class="sw-field">
                        <label class="sw-lbl">Fecha del registro</label>
                        <input type="date" v-model="setupFecha" class="sw-input">
                    </div>

                    <div class="sw-field">
                        <label class="sw-lbl">¿Por dónde comenzar?</label>
                        <div v-if="cargando" class="sw-loading-txt">Cargando datos...</div>
                        <div v-else class="sw-ubic-grid">
                            <div v-for="u in ubicaciones" :key="u.idubicacion" class="sw-ubic-card"
                                :class="{ active: setupUbicacion === u.idubicacion }"
                                @click="setupUbicacion = u.idubicacion">
                                <div class="sw-ubic-name">{{ u.nombreubicacion }}</div>
                                <div class="sw-ubic-count">{{ cajasDeUbicacion(u.idubicacion).length }} cajas</div>
                            </div>
                        </div>
                    </div>

                    <button class="btn-primary sw-full-btn" :disabled="!setupUbicacion || cargando"
                        @click="iniciarSesion">
                        Iniciar registro →
                    </button>
                </template>
            </div>
        </div>

        <!-- ══════════════════════════════════
         PASO: LISTA DE CAJAS
    ══════════════════════════════════ -->
        <div v-else-if="paso === 'cajas'" class="sw-page">
            <div class="sw-sec-head">
                <h3 class="sw-sec-title">{{ nombreUbicacionActual }}</h3>
                <p class="sw-sec-sub">Selecciona una caja para revisarla, o marca "En orden" si no hubo cambios.</p>
            </div>

            <div class="sw-cajas-grid">
                <div v-for="caja in cajasUbicacionActual" :key="caja.idcaja" class="sw-tile"
                    :class="estadoCaja(caja.idcaja)" @click="abrirCaja(caja)">
                    <div class="sw-tile-top">
                        <span class="sw-tile-num">Caja #{{ caja.idcaja }}</span>
                        <span class="rat-badge" :class="'rb-' + (caja.sexo || '').toLowerCase()">{{ caja.sexo || '—'
                            }}</span>
                    </div>
                    <div class="sw-tile-mid">🐀 {{ ratasDeCaja(caja.idcaja).length }} ratas</div>
                    <div class="sw-tile-status">
                        <span v-if="sesion.cajas_en_orden.includes(caja.idcaja)" class="st-ok">✅ En orden</span>
                        <span v-else-if="sesion.cajas_revisadas.includes(caja.idcaja)" class="st-edit">✏️
                            Revisada</span>
                        <span v-else class="st-pend">⏳ Pendiente</span>
                    </div>
                    <button v-if="!sesion.cajas_revisadas.includes(caja.idcaja)" class="sw-en-orden-btn"
                        @click.stop="marcarEnOrden(caja.idcaja)">✓ En orden</button>
                </div>
            </div>

            <div class="sw-cajas-footer">
                <button v-if="todasRevisadasActual && hayOtraUbicacion" class="btn-secondary" @click="cambiarUbicacion">
                    Continuar → {{ nombreOtraUbicacion }}
                </button>
                <button v-if="todasUbicacionesListas" class="btn-primary" @click="paso = 'resumen'">
                    Ver resumen final ✓
                </button>
            </div>
        </div>

        <!-- ══════════════════════════════════
         PASO: CAJA INDIVIDUAL
    ══════════════════════════════════ -->
        <div v-else-if="paso === 'caja' && cajaActiva" class="sw-page">
            <div class="sw-caja-hdr">
                <button class="sw-back-btn" @click="volverACajas">← Cajas</button>
                <div class="sw-caja-info">
                    <span class="sw-caja-num">Caja #{{ cajaActiva.idcaja }}</span>
                    <span class="rat-badge ml" :class="'rb-' + (cajaActiva.sexo || '').toLowerCase()">{{ cajaActiva.sexo
                        }}</span>
                </div>
                <button class="sw-en-orden-btn sw-en-orden-sm" @click="marcarEnOrden(cajaActiva.idcaja)">
                    ✅ Todo en orden
                </button>
            </div>

            <!-- Comentarios de la caja -->
            <div class="sw-sec">
                <label class="sw-lbl">Comentarios / observaciones</label>
                <textarea v-model="comentarioCajaTemp" class="sw-textarea" rows="2"
                    placeholder="Sin novedades..."></textarea>
            </div>

            <!-- Ratas -->
            <div class="sw-sec">
                <div class="sw-sec-flex">
                    <span class="sw-lbl">Ratas ({{ ratasDeCaja(cajaActiva.idcaja).length }})</span>
                    <button class="sw-add-rata-btn" @click="showFormNuevaRata = !showFormNuevaRata">
                        + Agregar rata
                    </button>
                </div>

                <!-- Form nueva rata -->
                <div class="sw-form-nueva-rata" v-if="showFormNuevaRata">
                    <select v-model="formNuevaRata.sexo" class="sw-inp-sm">
                        <option value="">Sexo *</option>
                        <option value="Macho">Macho</option>
                        <option value="Hembra">Hembra</option>
                    </select>
                    <input v-model.number="formNuevaRata.numerocola" type="number" placeholder="N° cola"
                        class="sw-inp-sm">
                    <input v-model="formNuevaRata.fechacirugia" type="date" class="sw-inp-sm">
                    <button class="btn-sm btn-primary" @click="agregarNuevaRata"
                        :disabled="!formNuevaRata.sexo">Agregar</button>
                    <button class="btn-sm btn-ghost" @click="showFormNuevaRata = false">✕</button>
                </div>

                <!-- Sin ratas -->
                <div v-if="ratasDeCaja(cajaActiva.idcaja).length === 0 && nuevasRatasTemp.length === 0"
                    class="sw-empty-txt">
                    No hay ratas registradas en esta caja.
                </div>

                <!-- Ratas existentes -->
                <div v-for="rata in ratasDeCaja(cajaActiva.idcaja)" :key="rata.id" class="sw-rata-row"
                    :class="{ 'rr-baja': esRataDeBaja(rata.id) }">
                    <div class="rr-info">
                        <span class="rr-id">{{ rata.sexo === 'Macho' ? 'M' : 'H' }}-{{ rata.idrata }}</span>
                        <span class="rr-cola">N° {{ rata.numerocola }}</span>
                        <span class="rr-ant" v-if="rata.ultimo_peso">
                            Último: {{ rata.ultimo_peso }}g
                            <span class="rr-fecha">({{ rata.ultima_fecha_peso }})</span>
                        </span>
                    </div>
                    <div class="rr-actions" v-if="!esRataDeBaja(rata.id)">
                        <input type="number" v-model.number="pesosTemp[rata.id]" placeholder="Peso (g)"
                            class="sw-inp-sm sw-inp-peso" step="0.1" min="0">
                        <input type="text" v-model="notasTemp[rata.id]" placeholder="Nota"
                            class="sw-inp-sm sw-inp-nota">
                        <button class="sw-baja-btn" @click="marcarBaja(rata)" title="Dar de baja">🗑</button>
                    </div>
                    <div class="rr-baja-label" v-else>
                        <span>Marcada para baja</span>
                        <button class="btn-sm btn-ghost" @click="desmarcarBaja(rata.id)">Deshacer</button>
                    </div>
                </div>

                <!-- Nuevas ratas en esta sesión -->
                <div v-for="nr in nuevasRatasTemp" :key="nr._temp_id" class="sw-rata-row rr-nueva">
                    <div class="rr-info">
                        <span class="rr-nueva-tag">NUEVA</span>
                        <span class="rr-id">{{ nr.sexo === 'Macho' ? 'M' : 'H' }}-?</span>
                        <span class="rr-cola">N° {{ nr.numerocola || '—' }}</span>
                        <span class="rr-ant" v-if="nr.fechacirugia">Cir: {{ nr.fechacirugia }}</span>
                    </div>
                    <button class="sw-baja-btn" @click="eliminarNuevaRata(nr._temp_id)">✕</button>
                </div>
            </div>

            <!-- Footer sticky -->
            <div class="sw-caja-footer">
                <button class="btn-secondary" @click="volverACajas">Cancelar</button>
                <button class="btn-primary" @click="guardarCaja">Guardar caja ✓</button>
            </div>
        </div>

        <!-- ══════════════════════════════════
         PASO: RESUMEN
    ══════════════════════════════════ -->
        <div v-else-if="paso === 'resumen'" class="sw-page">
            <div class="sw-sec-head">
                <h3 class="sw-sec-title">Resumen del registro</h3>
                <p class="sw-sec-sub">Revisa los cambios antes de confirmar.</p>
            </div>

            <div class="sw-stats-row">
                <div class="sw-stat-box">
                    <div class="sw-stat-val">{{ sesion.nuevos_pesos.length }}</div>
                    <div class="sw-stat-lbl">Pesos registrados</div>
                </div>
                <div class="sw-stat-box">
                    <div class="sw-stat-val">{{ Object.keys(sesion.cambios_cajas).length }}</div>
                    <div class="sw-stat-lbl">Cajas actualizadas</div>
                </div>
                <div class="sw-stat-box sb-danger">
                    <div class="sw-stat-val">{{ sesion.bajas_ratas.length }}</div>
                    <div class="sw-stat-lbl">Ratas dadas de baja</div>
                </div>
                <div class="sw-stat-box sb-ok">
                    <div class="sw-stat-val">{{ sesion.nuevas_ratas.length }}</div>
                    <div class="sw-stat-lbl">Ratas nuevas</div>
                </div>
            </div>

            <div v-if="sesion.bajas_ratas.length" class="sw-detalle">
                <div class="sw-det-hdr">🗑 Ratas dadas de baja</div>
                <div v-for="b in sesion.bajas_ratas" :key="b.id" class="sw-det-item det-danger">
                    {{ b.display }} — Caja #{{ b.idcaja }}
                </div>
            </div>

            <div v-if="sesion.nuevos_pesos.length" class="sw-detalle">
                <div class="sw-det-hdr">⚖️ Pesos registrados</div>
                <div v-for="p in sesion.nuevos_pesos" :key="p.idrata + p.fecha" class="sw-det-item">
                    {{ p.rata_display }}: <strong>{{ p.peso }}g</strong>
                    <span class="det-nota" v-if="p.notas"> — {{ p.notas }}</span>
                </div>
            </div>

            <div v-if="sesion.nuevas_ratas.length" class="sw-detalle">
                <div class="sw-det-hdr">✚ Ratas nuevas</div>
                <div v-for="(nr, i) in sesion.nuevas_ratas" :key="i" class="sw-det-item det-ok">
                    {{ nr.sexo }} · N°{{ nr.numerocola || '—' }} → Caja #{{ nr.idcaja }}
                </div>
            </div>

            <div v-if="!sesion.nuevos_pesos.length && !sesion.bajas_ratas.length && !sesion.nuevas_ratas.length && !Object.keys(sesion.cambios_cajas).length"
                class="sw-empty-txt">
                No se realizaron cambios en esta sesión.
            </div>

            <div class="sw-error-msg" v-if="errorGuardar">⚠️ {{ errorGuardar }}</div>

            <div class="sw-resumen-footer">
                <button class="btn-secondary" @click="paso = 'cajas'">← Revisar</button>
                <button class="btn-primary" @click="confirmarGuardar" :disabled="guardando">
                    {{ guardando ? 'Guardando...' : '✅ Confirmar y guardar' }}
                </button>
            </div>
        </div>

        <!-- ══════════════════════════════════
         PASO: ÉXITO
    ══════════════════════════════════ -->
        <div v-else-if="paso === 'exito'" class="sw-page sw-center">
            <div class="sw-card">
                <div class="sw-big-icon">✅</div>
                <h2 class="sw-card-h">¡Registro completado!</h2>
                <p class="sw-card-p">
                    El inventario del <strong>{{ sesion.fecha }}</strong> fue guardado exitosamente.
                </p>
                <div class="sw-exito-stats">
                    <div v-if="sesion.nuevos_pesos.length">⚖️ {{ sesion.nuevos_pesos.length }} pesos registrados</div>
                    <div v-if="sesion.bajas_ratas.length">🗑 {{ sesion.bajas_ratas.length }} bajas</div>
                    <div v-if="sesion.nuevas_ratas.length">✚ {{ sesion.nuevas_ratas.length }} altas</div>
                    <div v-if="Object.keys(sesion.cambios_cajas).length">
                        📝 {{ Object.keys(sesion.cambios_cajas).length }} cajas actualizadas
                    </div>
                </div>
                <button class="btn-primary sw-full-btn" @click="$router.push('/dashboard')">
                    Volver al dashboard
                </button>
            </div>
        </div>

        </transition>
    </div>
</template>

<script>
import api from '@/api/index.js'

export default {
    name: 'InventarioSemanalView',

    data() {
        const today = new Date().toISOString().split('T')[0]
        return {
            paso: 'setup',

            // Datos cargados de API
            ubicaciones: [],
            todasCajas: [],
            todasRatas: [],
            cargando: false,
            guardando: false,
            errorGuardar: '',

            // Setup
            setupFecha: today,
            setupUbicacion: null,

            // Sesión (se persiste en localStorage)
            sesion: {
                fecha: '',
                ubicaciones_orden: [],
                ubicacion_actual_index: 0,
                cajas_revisadas: [],
                cajas_en_orden: [],
                cambios_cajas: {},    // { [idcaja]: { comentarios } }
                nuevos_pesos: [],     // [{ idrata, rata_display, peso, notas, fecha, idcaja }]
                bajas_ratas: [],      // [{ id, display, idcaja }]
                nuevas_ratas: [],     // [{ sexo, numerocola, fechacirugia, idcaja }]
            },

            // Estado temporal de la vista de caja
            cajaActiva: null,
            comentarioCajaTemp: '',
            pesosTemp: {},          // { [rata.id]: valor }
            notasTemp: {},          // { [rata.id]: string }
            bajasTemp: [],
            nuevasRatasTemp: [],
            showFormNuevaRata: false,
            formNuevaRata: { sexo: '', numerocola: '', fechacirugia: '' },

            // Recuperación de sesión
            sesionRecuperada: null,
        }
    },

    computed: {
        usuario() { return this.$store.state.user },
        lsKey() { return `neurolab_sesion_${this.usuario?.idusuario || 'guest'}` },

        idUbicacionActual() {
            return this.sesion.ubicaciones_orden[this.sesion.ubicacion_actual_index]
        },
        nombreUbicacionActual() {
            return this.ubicaciones.find(u => u.idubicacion === this.idUbicacionActual)?.nombreubicacion || ''
        },
        cajasUbicacionActual() {
            return this.todasCajas.filter(c => c.idubicacion === this.idUbicacionActual)
        },
        cajasRevisadasActual() {
            return this.cajasUbicacionActual
                .filter(c => this.sesion.cajas_revisadas.includes(c.idcaja))
                .map(c => c.idcaja)
        },
        todasRevisadasActual() {
            if (!this.cajasUbicacionActual.length) return true
            return this.cajasUbicacionActual.every(c => this.sesion.cajas_revisadas.includes(c.idcaja))
        },
        hayOtraUbicacion() {
            return this.sesion.ubicacion_actual_index < this.sesion.ubicaciones_orden.length - 1
        },
        idOtraUbicacion() {
            return this.sesion.ubicaciones_orden[this.sesion.ubicacion_actual_index + 1]
        },
        nombreOtraUbicacion() {
            return this.ubicaciones.find(u => u.idubicacion === this.idOtraUbicacion)?.nombreubicacion || ''
        },
        todasUbicacionesListas() {
            return !this.hayOtraUbicacion && this.todasRevisadasActual
        },
        progressPct() {
            if (!this.cajasUbicacionActual.length) return 0
            return (this.cajasRevisadasActual.length / this.cajasUbicacionActual.length) * 100
        },
    },

    async mounted() {
        await this.cargarDatos()
        this.checkSesionGuardada()
    },

    methods: {
        // ── Carga inicial ──────────────────────────────────────
        async cargarDatos() {
            this.cargando = true
            try {
                const [rU, rC, rR] = await Promise.all([
                    api.get('/ubicaciones/?page_size=200'),
                    api.get('/cajas/?page_size=200'),
                    api.get('/ratas/?page_size=500'),
                ])
                this.ubicaciones = rU.data.results ?? rU.data
                this.todasCajas = rC.data.results ?? rC.data
                this.todasRatas = rR.data.results ?? rR.data
            } catch (e) {
                console.error('Error cargando datos para sesión:', e)
            } finally {
                this.cargando = false
            }
        },

        // ── Helpers ────────────────────────────────────────────
        cajasDeUbicacion(id) { return this.todasCajas.filter(c => c.idubicacion === id) },
        ratasDeCaja(idcaja) { return this.todasRatas.filter(r => r.idcaja === idcaja) },
        esRataDeBaja(id) { return this.bajasTemp.some(b => b.id === id) },
        estadoCaja(idcaja) {
            if (this.sesion.cajas_en_orden.includes(idcaja)) return 'sw-tile-ok'
            if (this.sesion.cajas_revisadas.includes(idcaja)) return 'sw-tile-edit'
            return ''
        },

        // ── localStorage ───────────────────────────────────────
        guardarLS() { try { localStorage.setItem(this.lsKey, JSON.stringify(this.sesion)) } catch { } },
        checkSesionGuardada() {
            try {
                const s = localStorage.getItem(this.lsKey)
                if (s) { const p = JSON.parse(s); if (p?.fecha) this.sesionRecuperada = p }
            } catch { }
        },
        retomarSesion() { this.sesion = { ...this.sesionRecuperada }; this.sesionRecuperada = null; this.paso = 'cajas' },
        descartarSesion() { localStorage.removeItem(this.lsKey); this.sesionRecuperada = null },

        // ── Setup ──────────────────────────────────────────────
        iniciarSesion() {
            const otras = this.ubicaciones.map(u => u.idubicacion).filter(id => id !== this.setupUbicacion)
            this.sesion = {
                fecha: this.setupFecha,
                ubicaciones_orden: [this.setupUbicacion, ...otras],
                ubicacion_actual_index: 0,
                cajas_revisadas: [], cajas_en_orden: [],
                cambios_cajas: {}, nuevos_pesos: [], bajas_ratas: [], nuevas_ratas: [],
            }
            this.guardarLS()
            this.paso = 'cajas'
        },
        cancelarSesion() {
            if (confirm('¿Salir? Tu progreso quedó guardado localmente y puedes retomarlo.')) {
                this.$router.push('/dashboard')
            }
        },

        // ── Cajas ──────────────────────────────────────────────
        marcarEnOrden(idcaja) {
            if (!this.sesion.cajas_en_orden.includes(idcaja)) this.sesion.cajas_en_orden.push(idcaja)
            if (!this.sesion.cajas_revisadas.includes(idcaja)) this.sesion.cajas_revisadas.push(idcaja)
            this.guardarLS()
            if (this.paso === 'caja') this.volverACajas()
        },
        abrirCaja(caja) {
            this.cajaActiva = caja
            const idc = caja.idcaja
            this.comentarioCajaTemp = this.sesion.cambios_cajas[idc]?.comentarios ?? caja.comentarios ?? ''
            this.bajasTemp = this.sesion.bajas_ratas.filter(b => b.idcaja === idc)
            this.nuevasRatasTemp = this.sesion.nuevas_ratas.filter(r => r.idcaja === idc)
            this.pesosTemp = {}; this.notasTemp = {}
            this.sesion.nuevos_pesos.filter(p => p.idcaja === idc).forEach(p => {
                this.pesosTemp[p.idrata] = p.peso
                this.notasTemp[p.idrata] = p.notas
            })
            this.showFormNuevaRata = false
            this.formNuevaRata = { sexo: '', numerocola: '', fechacirugia: '' }
            this.paso = 'caja'
        },
        volverACajas() { this.cajaActiva = null; this.paso = 'cajas' },

        guardarCaja() {
            const idc = this.cajaActiva.idcaja

            // Comentarios
            if (this.comentarioCajaTemp !== (this.cajaActiva.comentarios ?? '')) {
                this.sesion.cambios_cajas = { ...this.sesion.cambios_cajas, [idc]: { comentarios: this.comentarioCajaTemp } }
            }

            // Pesos — reemplazar los de esta caja
            this.sesion.nuevos_pesos = this.sesion.nuevos_pesos.filter(p => p.idcaja !== idc)
            Object.entries(this.pesosTemp).forEach(([id, peso]) => {
                if (peso !== null && peso !== '' && peso !== undefined) {
                    const idrata = parseInt(id)
                    const rata = this.ratasDeCaja(idc).find(r => r.id === idrata)
                    this.sesion.nuevos_pesos.push({
                        idrata,
                        rata_display: rata
                            ? `${rata.sexo === 'Macho' ? 'M' : 'H'}-${rata.idrata} (N°${rata.numerocola})`
                            : `Rata #${idrata}`,
                        peso: parseFloat(peso),
                        notas: this.notasTemp[id] || '',
                        fecha: this.sesion.fecha,
                        idcaja: idc,
                    })
                }
            })

            // Bajas
            this.sesion.bajas_ratas = [
                ...this.sesion.bajas_ratas.filter(b => b.idcaja !== idc),
                ...this.bajasTemp,
            ]

            // Nuevas ratas
            this.sesion.nuevas_ratas = [
                ...this.sesion.nuevas_ratas.filter(r => r.idcaja !== idc),
                ...this.nuevasRatasTemp,
            ]

            if (!this.sesion.cajas_revisadas.includes(idc)) this.sesion.cajas_revisadas.push(idc)
            this.guardarLS()
            this.volverACajas()
        },

        // ── Ratas ──────────────────────────────────────────────
        marcarBaja(rata) {
            const display = `${rata.sexo === 'Macho' ? 'M' : 'H'}-${rata.idrata} (N°${rata.numerocola})`
            this.bajasTemp.push({ id: rata.id, display, idcaja: this.cajaActiva.idcaja })
        },
        desmarcarBaja(id) { this.bajasTemp = this.bajasTemp.filter(b => b.id !== id) },
        eliminarNuevaRata(tmpId) { this.nuevasRatasTemp = this.nuevasRatasTemp.filter(r => r._temp_id !== tmpId) },
        agregarNuevaRata() {
            if (!this.formNuevaRata.sexo) return
            this.nuevasRatasTemp.push({
                sexo: this.formNuevaRata.sexo,
                numerocola: this.formNuevaRata.numerocola ? parseInt(this.formNuevaRata.numerocola) : null,
                fechacirugia: this.formNuevaRata.fechacirugia || null,
                idcaja: this.cajaActiva.idcaja,
                _temp_id: Date.now(),
            })
            this.formNuevaRata = { sexo: '', numerocola: '', fechacirugia: '' }
            this.showFormNuevaRata = false
        },

        // ── Ubicación ──────────────────────────────────────────
        cambiarUbicacion() { this.sesion.ubicacion_actual_index++; this.guardarLS() },

        // ── Confirmar ──────────────────────────────────────────
        async confirmarGuardar() {
            this.guardando = true; this.errorGuardar = ''
            try {
                const payload = {
                    fecha: this.sesion.fecha,
                    cambios_cajas: Object.entries(this.sesion.cambios_cajas).map(([k, v]) => ({ idcaja: parseInt(k), ...v })),
                    nuevos_pesos: this.sesion.nuevos_pesos,
                    bajas_ratas: this.sesion.bajas_ratas.map(b => b.id),
                    // Quitar _temp_id antes de enviar
                    nuevas_ratas: this.sesion.nuevas_ratas.map(({ _temp_id, ...rest }) => rest),
                }
                const res = await api.post('inventario/sesion/', payload)
                if (res.data.ok) {
                    localStorage.removeItem(this.lsKey)
                    this.paso = 'exito'
                } else {
                    this.errorGuardar = res.data.error || 'Error desconocido'
                }
            } catch (e) {
                this.errorGuardar = e.response?.data?.error || 'Error al conectar con el servidor'
            } finally {
                this.guardando = false
            }
        },
    },
}
</script>

<style scoped>
/* ── Layout ── */
.sw-wrap {
    min-height: 100vh;
    background: #f5f5f7;
    display: flex;
    flex-direction: column;
}

.sw-page {
    flex: 1;
    max-width: 860px;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 5rem;
    width: 100%;
}

.sw-center {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 110px);
}

/* ── Top bar ── */
.sw-topbar {
    background: #1a1a2e;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .7rem 1.5rem;
    position: sticky;
    top: 0;
    z-index: 100;
}

.sw-tb-left {
    display: flex;
    align-items: center;
    gap: .75rem;
}

.sw-tb-icon {
    font-size: 1.3rem;
}

.sw-tb-title {
    font-weight: 600;
    font-size: .92rem;
}

.sw-tb-sub {
    font-size: .74rem;
    color: rgba(255, 255, 255, .55);
    margin-top: 1px;
}

.sw-tb-right {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.sw-prog {
    font-size: .8rem;
    color: rgba(255, 255, 255, .65);
}

.sw-prog-n {
    font-weight: 700;
    color: #fff;
}

.sw-x-btn {
    background: rgba(255, 255, 255, .15);
    border: none;
    color: #fff;
    padding: .3rem .7rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: .82rem;
}

.sw-x-btn:hover {
    background: rgba(255, 255, 255, .28);
}

/* ── Progress bar ── */
.sw-pbar {
    height: 3px;
    background: #ddd;
}

.sw-pbar-fill {
    height: 100%;
    background: #80201d;
    transition: width .35s ease;
}

/* ── Setup card ── */
.sw-card {
    background: #fff;
    border-radius: 16px;
    padding: 2.25rem 2rem;
    max-width: 460px;
    width: 100%;
    text-align: center;
    box-shadow: 0 4px 24px rgba(0, 0, 0, .07);
}

.sw-big-icon {
    font-size: 2.5rem;
    margin-bottom: .75rem;
}

.sw-card-h {
    font-size: 1.2rem;
    color: #1a1a2e;
    margin-bottom: .4rem;
}

.sw-card-p {
    font-size: .84rem;
    color: #777;
    line-height: 1.5;
    margin-bottom: 1.5rem;
}

.sw-loading-txt {
    color: #bbb;
    font-size: .84rem;
    padding: .5rem 0;
}

.sw-recovery {
    background: #fff8e1;
    border: 1px solid #ffe082;
    border-radius: 10px;
    padding: .9rem;
    font-size: .84rem;
    color: #555;
    margin-bottom: 1.25rem;
}

.sw-row-btns {
    display: flex;
    gap: .5rem;
    margin-top: .65rem;
    justify-content: center;
    flex-wrap: wrap;
}

.sw-field {
    text-align: left;
    margin-bottom: 1.2rem;
}

.sw-lbl {
    font-size: .8rem;
    font-weight: 500;
    color: #555;
    display: block;
    margin-bottom: .35rem;
}

.sw-input {
    width: 100%;
    padding: .45rem .7rem;
    border: 1.5px solid #ddd;
    border-radius: 8px;
    font-size: .88rem;
    outline: none;
}

.sw-input:focus {
    border-color: #80201d;
}

.sw-ubic-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .65rem;
}

.sw-ubic-card {
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    padding: .85rem;
    cursor: pointer;
    transition: all .14s;
    text-align: center;
}

.sw-ubic-card:hover {
    border-color: #80201d;
}

.sw-ubic-card.active {
    border-color: #80201d;
    background: #fff5f5;
}

.sw-ubic-name {
    font-size: .87rem;
    font-weight: 500;
    color: #1a1a2e;
}

.sw-ubic-count {
    font-size: .74rem;
    color: #aaa;
    margin-top: 3px;
}

.sw-full-btn {
    width: 100%;
    padding: .7rem;
    font-size: .92rem;
    margin-top: .5rem;
}

/* ── Cajas grid ── */
.sw-sec-head {
    margin-bottom: 1.1rem;
}

.sw-sec-title {
    font-size: 1.1rem;
    color: #1a1a2e;
    font-weight: 600;
}

.sw-sec-sub {
    font-size: .8rem;
    color: #999;
    margin-top: 2px;
}

.sw-cajas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: .65rem;
    margin-bottom: 1.25rem;
}

.sw-tile {
    background: #fff;
    border: 1.5px solid #e0e0e0;
    border-radius: 12px;
    padding: .9rem;
    cursor: pointer;
    transition: all .14s;
}

.sw-tile:hover {
    border-color: #80201d;
    box-shadow: 0 2px 8px rgba(128, 32, 29, .1);
}

.sw-tile-ok {
    border-color: #4caf50;
    background: #f1f8f1;
}

.sw-tile-edit {
    border-color: #2196f3;
    background: #f0f5ff;
}

.sw-tile-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: .4rem;
}

.sw-tile-num {
    font-weight: 600;
    font-size: .87rem;
    color: #1a1a2e;
}

.sw-tile-mid {
    font-size: .75rem;
    color: #888;
    margin-bottom: .4rem;
}

.sw-tile-status {
    font-size: .72rem;
    margin-bottom: .45rem;
}

.st-ok {
    color: #4caf50;
}

.st-edit {
    color: #2196f3;
}

.st-pend {
    color: #bbb;
}

.rat-badge {
    font-size: .68rem;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
}

.rb-macho {
    background: #e3f2fd;
    color: #1565c0;
}

.rb-hembra {
    background: #fce4ec;
    color: #880e4f;
}

.ml {
    margin-left: .3rem;
}

.sw-en-orden-btn {
    background: transparent;
    border: 1px solid #ccc;
    color: #777;
    padding: .22rem .5rem;
    border-radius: 5px;
    font-size: .7rem;
    cursor: pointer;
    width: 100%;
    transition: all .12s;
}

.sw-en-orden-btn:hover {
    border-color: #4caf50;
    color: #4caf50;
}

.sw-en-orden-sm {
    width: auto;
    white-space: nowrap;
}

.sw-cajas-footer {
    display: flex;
    justify-content: flex-end;
    gap: .65rem;
    padding-top: .9rem;
    border-top: 1px solid #eee;
}

/* ── Caja individual ── */
.sw-caja-hdr {
    display: flex;
    align-items: center;
    gap: .65rem;
    margin-bottom: 1.1rem;
    flex-wrap: wrap;
}

.sw-back-btn {
    background: none;
    border: none;
    color: #80201d;
    font-size: .84rem;
    cursor: pointer;
    padding: 0;
}

.sw-caja-info {
    display: flex;
    align-items: center;
    flex: 1;
    gap: .4rem;
}

.sw-caja-num {
    font-weight: 600;
    font-size: .97rem;
    color: #1a1a2e;
}

.sw-sec {
    margin-bottom: 1.4rem;
}

.sw-sec-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: .5rem;
}

.sw-textarea {
    width: 100%;
    padding: .45rem .7rem;
    border: 1.5px solid #ddd;
    border-radius: 8px;
    font-size: .84rem;
    resize: vertical;
    font-family: inherit;
    outline: none;
}

.sw-textarea:focus {
    border-color: #80201d;
}

.sw-add-rata-btn {
    background: none;
    border: 1.5px dashed #ccc;
    color: #888;
    padding: .25rem .65rem;
    border-radius: 6px;
    font-size: .77rem;
    cursor: pointer;
}

.sw-add-rata-btn:hover {
    border-color: #80201d;
    color: #80201d;
}

.sw-form-nueva-rata {
    display: flex;
    gap: .4rem;
    align-items: center;
    flex-wrap: wrap;
    padding: .7rem;
    background: #fafafa;
    border-radius: 8px;
    margin-bottom: .65rem;
    border: 1px solid #eee;
}

.sw-inp-sm {
    padding: .32rem .55rem;
    border: 1.5px solid #ddd;
    border-radius: 6px;
    font-size: .8rem;
    outline: none;
}

.sw-inp-sm:focus {
    border-color: #80201d;
}

.sw-inp-peso {
    width: 120px;
}

.sw-inp-nota {
    flex: 1;
    min-width: 90px;
}

.sw-empty-txt {
    text-align: center;
    color: #ccc;
    font-size: .84rem;
    padding: 1.25rem 0;
}

.sw-rata-row {
    display: flex;
    align-items: center;
    gap: .65rem;
    padding: .55rem .7rem;
    border-radius: 8px;
    border: 1px solid #eee;
    margin-bottom: .35rem;
    background: #fff;
    flex-wrap: wrap;
    transition: opacity .13s;
}

.rr-baja {
    opacity: .55;
    background: #fff5f5;
    border-color: #ffcdd2;
}

.rr-nueva {
    border-style: dashed;
    border-color: #a5d6a7;
    background: #f1f8f1;
}

.rr-info {
    display: flex;
    align-items: center;
    gap: .55rem;
    flex: 1;
    flex-wrap: wrap;
}

.rr-id {
    font-weight: 600;
    font-size: .83rem;
    color: #1a1a2e;
}

.rr-cola {
    font-size: .78rem;
    color: #999;
}

.rr-ant {
    font-size: .72rem;
    color: #bbb;
}

.rr-fecha {
    font-size: .7rem;
    color: #ccc;
}

.rr-nueva-tag {
    font-size: .62rem;
    background: #e8f5e9;
    color: #2e7d32;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 600;
}

.rr-actions {
    display: flex;
    align-items: center;
    gap: .35rem;
    flex-wrap: wrap;
}

.rr-baja-label {
    display: flex;
    align-items: center;
    gap: .5rem;
    font-size: .78rem;
    color: #c62828;
}

.sw-baja-btn {
    background: transparent;
    border: 1px solid #ffcdd2;
    color: #c62828;
    padding: .22rem .42rem;
    border-radius: 5px;
    cursor: pointer;
    font-size: .75rem;
}

.sw-baja-btn:hover {
    background: #ffebee;
}

.sw-caja-footer {
    display: flex;
    gap: .65rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
    padding-top: .9rem;
    border-top: 1px solid #eee;
    position: sticky;
    bottom: 0;
    background: #f5f5f7;
    padding-bottom: 1.25rem;
}

/* ── Resumen ── */
.sw-stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
    gap: .65rem;
    margin-bottom: 1.35rem;
}

.sw-stat-box {
    background: #fff;
    border: 1.5px solid #e0e0e0;
    border-radius: 10px;
    padding: .9rem;
    text-align: center;
}

.sb-danger {
    border-color: #ffcdd2;
    background: #fff5f5;
}

.sb-ok {
    border-color: #c8e6c9;
    background: #f1f8f1;
}

.sw-stat-val {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a2e;
}

.sb-danger .sw-stat-val {
    color: #c62828;
}

.sb-ok .sw-stat-val {
    color: #2e7d32;
}

.sw-stat-lbl {
    font-size: .72rem;
    color: #999;
    margin-top: 2px;
}

.sw-detalle {
    margin-bottom: 1.15rem;
}

.sw-det-hdr {
    font-size: .79rem;
    font-weight: 600;
    color: #666;
    padding: .35rem 0;
    border-bottom: 1px solid #eee;
    margin-bottom: .45rem;
}

.sw-det-item {
    font-size: .82rem;
    padding: .3rem .5rem;
    border-radius: 5px;
    margin-bottom: .2rem;
    color: #333;
}

.det-danger {
    background: #fff5f5;
}

.det-ok {
    background: #f1f8f1;
}

.det-nota {
    color: #aaa;
    font-size: .77rem;
}

.sw-error-msg {
    background: #fff5f5;
    border: 1px solid #ffcdd2;
    color: #c62828;
    padding: .65rem .9rem;
    border-radius: 8px;
    margin-bottom: .9rem;
    font-size: .83rem;
}

.sw-resumen-footer {
    display: flex;
    justify-content: flex-end;
    gap: .65rem;
    padding-top: .9rem;
    border-top: 1px solid #eee;
    margin-top: 1rem;
}

/* ── Éxito ── */
.sw-exito-stats {
    font-size: .84rem;
    color: #555;
    line-height: 1.9;
    margin-bottom: 1.5rem;
}

/* ── Transición entre pasos ── */
.step-enter-active,
.step-leave-active {
    transition: opacity .25s ease, transform .25s ease;
}
.step-enter-from {
    opacity: 0;
    transform: translateX(24px);
}
.step-leave-to {
    opacity: 0;
    transform: translateX(-18px);
}

/* ════════════════════════════════════════════════
   ANIMACIONES
   ════════════════════════════════════════════════ */

/* Fade + slide general de cada paso */
@keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
}

@keyframes popIn {
    0%   { opacity: 0; transform: scale(.88); }
    70%  { transform: scale(1.04); }
    100% { opacity: 1; transform: scale(1); }
}

@keyframes slideRight {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: translateX(0); }
}

@keyframes barFill {
    from { width: 0%; }
}

@keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    40%       { transform: translateY(-8px); }
    60%       { transform: translateY(-4px); }
}

/* Aplicar fade al cambio de paso */
.sw-page {
    animation: fadeSlideIn .35s ease both;
}

/* Card de setup y éxito */
.sw-card {
    animation: popIn .4s cubic-bezier(.22,.68,0,1.2) both;
}

.sw-big-icon {
    animation: bounce 1.2s ease 0.4s both;
    display: inline-block;
}

/* Tiles de cajas — escalonados */
.sw-tile {
    animation: fadeSlideIn .3s ease both;
}

.sw-cajas-grid .sw-tile:nth-child(1)  { animation-delay: .05s; }
.sw-cajas-grid .sw-tile:nth-child(2)  { animation-delay: .09s; }
.sw-cajas-grid .sw-tile:nth-child(3)  { animation-delay: .13s; }
.sw-cajas-grid .sw-tile:nth-child(4)  { animation-delay: .17s; }
.sw-cajas-grid .sw-tile:nth-child(5)  { animation-delay: .21s; }
.sw-cajas-grid .sw-tile:nth-child(6)  { animation-delay: .25s; }
.sw-cajas-grid .sw-tile:nth-child(7)  { animation-delay: .29s; }
.sw-cajas-grid .sw-tile:nth-child(8)  { animation-delay: .33s; }
.sw-cajas-grid .sw-tile:nth-child(n+9){ animation-delay: .37s; }

/* Tile hover más expresivo */
.sw-tile {
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.sw-tile:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 6px 18px rgba(128,32,29,.14);
}
.sw-tile:active {
    transform: scale(.97);
}

/* Filas de ratas */
.sw-rata-row {
    animation: slideRight .25s ease both;
    transition: background .15s, opacity .2s;
}

/* Stats del resumen */
.sw-stat-box {
    animation: popIn .35s cubic-bezier(.22,.68,0,1.2) both;
}
.sw-stats-row .sw-stat-box:nth-child(1) { animation-delay: .05s; }
.sw-stats-row .sw-stat-box:nth-child(2) { animation-delay: .12s; }
.sw-stats-row .sw-stat-box:nth-child(3) { animation-delay: .19s; }
.sw-stats-row .sw-stat-box:nth-child(4) { animation-delay: .26s; }

/* Detalles del resumen */
.sw-detalle {
    animation: fadeSlideIn .3s ease both;
}

/* Barra de progreso animada */
.sw-pbar-fill {
    animation: barFill .5s ease both;
}

/* Botón primary — efecto ripple suave */
.btn-primary {
    position: relative;
    overflow: hidden;
    transition: background .2s, transform .12s, box-shadow .2s;
}
.btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(128,32,29,.3);
}
.btn-primary:active:not(:disabled) {
    transform: translateY(0) scale(.97);
}

.btn-secondary {
    transition: background .15s, transform .12s;
}
.btn-secondary:active { transform: scale(.96); }

/* Ubicación card hover */
.sw-ubic-card {
    transition: border-color .15s, background .15s, transform .15s, box-shadow .15s;
}
.sw-ubic-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
}
.sw-ubic-card.active {
    animation: popIn .25s ease both;
}

/* Formulario de nueva rata — fade in */
.sw-form-nueva-rata {
    animation: fadeSlideIn .22s ease both;
}

/* Input focus */
.sw-inp-sm, .sw-input, .sw-textarea {
    transition: border-color .18s, box-shadow .18s;
}
.sw-inp-sm:focus, .sw-input:focus, .sw-textarea:focus {
    box-shadow: 0 0 0 3px rgba(128,32,29,.12);
}

/* Recovery box */
.sw-recovery {
    animation: fadeSlideIn .3s ease .1s both;
}

/* Error message shake */
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
}
.sw-error-msg {
    animation: shake .4s ease both;
}

/* Éxito stats — lista animada */
.sw-exito-stats div {
    animation: slideRight .3s ease both;
}
.sw-exito-stats div:nth-child(1) { animation-delay: .1s; }
.sw-exito-stats div:nth-child(2) { animation-delay: .18s; }
.sw-exito-stats div:nth-child(3) { animation-delay: .26s; }
.sw-exito-stats div:nth-child(4) { animation-delay: .34s; }

/* Top bar gradient animado */
.sw-topbar {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    transition: box-shadow .2s;
}

/* Badge colores */
.rat-badge {
    transition: transform .15s;
}
.rat-badge:hover {
    transform: scale(1.1);
}


/* ════════════════════════════════════════════════
   RESPONSIVIDAD COMPLETA
   ════════════════════════════════════════════════ */

/* ── Tablet (≤ 768px) ── */
@media (max-width: 768px) {
    .sw-page {
        padding: 1rem 1rem 5rem;
    }

    .sw-topbar {
        padding: .55rem 1rem;
        gap: .5rem;
    }

    .sw-tb-title {
        font-size: .82rem;
    }

    .sw-tb-sub {
        display: none; /* más espacio en tablet */
    }

    .sw-prog {
        font-size: .72rem;
    }

    /* Grid de cajas: 3 columnas en tablet */
    .sw-cajas-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: .55rem;
    }

    .sw-tile {
        padding: .75rem;
    }

    .sw-tile-num {
        font-size: .8rem;
    }

    /* Stats */
    .sw-stats-row {
        grid-template-columns: repeat(2, 1fr);
    }

    .sw-stat-val {
        font-size: 1.3rem;
    }

    /* Caja individual */
    .sw-caja-hdr {
        flex-wrap: wrap;
        gap: .5rem;
    }

    .sw-caja-num {
        font-size: .9rem;
    }

    /* Ratas row en tablet */
    .rr-info {
        flex-wrap: wrap;
        gap: .35rem;
    }

    .rr-actions {
        width: 100%;
        flex-wrap: wrap;
    }

    .sw-inp-peso {
        width: 100px;
    }

    /* Card de setup */
    .sw-card {
        padding: 1.75rem 1.5rem;
    }
}

/* ── Móvil grande (≤ 580px) ── */
@media (max-width: 580px) {
    .sw-page {
        padding: .85rem .85rem 5rem;
    }

    .sw-cajas-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: .5rem;
    }

    .sw-tile {
        padding: .65rem .7rem;
    }

    .sw-tile-mid {
        font-size: .7rem;
    }

    .sw-tile-status {
        font-size: .67rem;
    }

    .sw-en-orden-btn {
        font-size: .65rem;
        padding: .18rem .4rem;
    }

    /* Footer de cajas */
    .sw-cajas-footer {
        flex-direction: column;
        gap: .5rem;
    }

    .sw-cajas-footer button {
        width: 100%;
        text-align: center;
    }

    /* Resumen footer */
    .sw-resumen-footer {
        flex-direction: column-reverse;
        gap: .5rem;
    }

    .sw-resumen-footer button {
        width: 100%;
    }

    /* Caja footer */
    .sw-caja-footer {
        flex-direction: column-reverse;
        gap: .5rem;
    }

    .sw-caja-footer button {
        width: 100%;
    }

    /* Stats 2 columnas en móvil */
    .sw-stats-row {
        grid-template-columns: repeat(2, 1fr);
        gap: .5rem;
    }

    .sw-stat-val {
        font-size: 1.2rem;
    }

    .sw-stat-lbl {
        font-size: .67rem;
    }

    /* Topbar en móvil */
    .sw-tb-icon {
        font-size: 1.1rem;
    }

    .sw-x-btn {
        padding: .25rem .55rem;
        font-size: .75rem;
    }

    /* Card de setup */
    .sw-card {
        padding: 1.5rem 1.1rem;
        border-radius: 12px;
    }

    .sw-big-icon {
        font-size: 2rem;
    }

    .sw-card-h {
        font-size: 1.05rem;
    }

    .sw-ubic-grid {
        grid-template-columns: 1fr;
    }

    /* Rata row en móvil: stack vertical */
    .sw-rata-row {
        flex-direction: column;
        align-items: flex-start;
        gap: .5rem;
        padding: .7rem .75rem;
    }

    .rr-actions {
        width: 100%;
        gap: .4rem;
    }

    .sw-inp-peso {
        flex: 1;
        min-width: 80px;
    }

    .sw-inp-nota {
        flex: 2;
    }

    /* Sección head */
    .sw-sec-head {
        margin-bottom: .85rem;
    }

    .sw-sec-title {
        font-size: .97rem;
    }

    /* Header de caja individual */
    .sw-caja-hdr {
        align-items: flex-start;
    }

    .sw-en-orden-sm {
        font-size: .72rem;
        padding: .25rem .55rem;
    }

    /* Form nueva rata en móvil */
    .sw-form-nueva-rata {
        flex-direction: column;
        gap: .5rem;
    }

    .sw-form-nueva-rata select,
    .sw-form-nueva-rata input {
        width: 100%;
    }

    /* Detalles del resumen */
    .sw-det-item {
        font-size: .78rem;
    }
}

/* ── Móvil pequeño (≤ 360px) ── */
@media (max-width: 360px) {
    .sw-cajas-grid {
        grid-template-columns: 1fr 1fr;
        gap: .4rem;
    }

    .sw-tile {
        padding: .55rem .6rem;
    }

    .sw-tile-num {
        font-size: .74rem;
    }

    .sw-stats-row {
        grid-template-columns: 1fr 1fr;
    }

    .sw-topbar {
        flex-wrap: wrap;
        height: auto;
        padding: .5rem .85rem;
    }
}
</style>