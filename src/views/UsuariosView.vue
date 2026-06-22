<template>
  <div class="page-wrapper">
    <Navbar />
    <main class="content">
      <div class="page-header">
        <h1>Gestión de Usuarios</h1>
        <button class="btn-primary btn-breathe" @click="openModal()">+ Nuevo usuario</button>
      </div>

      <!-- ── Tabla ────────────────────────────────────────── -->
      <div class="table-card">
        <div v-if="loading" class="skeleton-table">
          <div class="skeleton-row" v-for="n in 5" :key="n">
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton skeleton-cell skeleton-cell--md"></div>
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
            <div class="skeleton skeleton-cell skeleton-cell--sm"></div>
          </div>
        </div>
        <div v-else-if="error" class="state-msg error shake-error">{{ error }}</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Nombre completo</th>
              <th>Sexo</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <transition-group name="list" tag="tbody">
            <tr v-for="u in usuarios" :key="u.idusuario" :class="{ 'row-removing': removingId === u.idusuario }">
              <td>{{ u.idusuario }}</td>
              <td>{{ u.nombreusuario }}</td>
              <td>{{ u.apellidopaterno }} {{ u.apellidomaterno }}</td>
              <td>{{ u.sexo }}</td>
              <td><span class="role-chip" :class="'role-' + (u.rol_nombre || '').toLowerCase()">{{ u.rol_nombre }}</span></td>
              <td class="actions">
                <button class="btn-icon" @click="openModal(u)" title="Editar">✏️</button>
                <button class="btn-icon danger" @click="confirmDelete(u)" title="Eliminar">🗑️</button>
              </td>
            </tr>
          </transition-group>
        </table>
        <div v-if="!loading && !error && !usuarios.length" class="empty-state">
          <span class="empty-state-icon">👤</span>
          No hay usuarios registrados.
        </div>
        <div v-if="usuariosTotalPages > 1" class="pagination-bar">
          <button :disabled="usuariosPage === 1" @click="usuariosPage--; fetchUsuarios()">← Anterior</button>
          <span>Página {{ usuariosPage }} de {{ usuariosTotalPages }} · {{ usuariosTotal }} registros</span>
          <button :disabled="usuariosPage === usuariosTotalPages" @click="usuariosPage++; fetchUsuarios()">Siguiente
            →</button>
        </div>
      </div>

      <!-- ── Modal ────────────────────────────────────────── -->
      <transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <transition name="modal-pop" appear>
            <div class="modal" v-if="showModal">
              <h2>{{ editando ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
              <form @submit.prevent="guardarUsuario">
                <div class="fields-grid">

                  <div class="field">
                    <label>Nombre de usuario <span class="req">*</span></label>
                    <input v-model="form.nombreusuario" required :disabled="editando"
                      :class="{ 'input-error shake-error': fieldErrors.nombreusuario }" />
                    <span v-if="fieldErrors.nombreusuario" class="field-error">
                      {{ fieldErrors.nombreusuario }}
                    </span>
                  </div>

                  <div class="field">
                    <label>
                      Contraseña
                      <span v-if="editando" class="label-hint">(vacío = sin cambios)</span>
                      <span v-else class="req"> *</span>
                    </label>
                    <input v-model="form.password" type="password" :required="!editando" autocomplete="new-password"
                      :class="{ 'input-error shake-error': fieldErrors.password }" />
                    <span v-if="fieldErrors.password" class="field-error">
                      {{ fieldErrors.password }}
                    </span>
                  </div>

                  <div class="field">
                    <label>Confirmar contraseña</label>
                    <input v-model="form.password_confirm" type="password" :required="!editando || !!form.password"
                      autocomplete="new-password" :class="{ 'input-error shake-error': fieldErrors.password_confirm }" />
                    <span v-if="fieldErrors.password_confirm" class="field-error">
                      {{ fieldErrors.password_confirm }}
                    </span>
                  </div>

                  <div class="field">
                    <label>Apellido paterno <span class="req">*</span></label>
                    <input v-model="form.apellidopaterno" required />
                  </div>

                  <div class="field">
                    <label>Apellido materno <span class="req">*</span></label>
                    <input v-model="form.apellidomaterno" required />
                  </div>

                  <div class="field">
                    <label>Sexo <span class="req">*</span></label>
                    <select v-model="form.sexo" required>
                      <option value="">Seleccionar…</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                    </select>
                  </div>

                  <div class="field">
                    <label>Rol <span class="req">*</span></label>
                    <select v-model="form.idrol" required>
                      <option value="">Seleccionar…</option>
                      <option v-for="r in roles" :key="r.idrol" :value="r.idrol">
                        {{ r.nombrerol }}
                      </option>
                    </select>
                    <span v-if="fieldErrors.idrol" class="field-error">{{ fieldErrors.idrol }}</span>
                  </div>

                </div>

                <p v-if="formError" class="form-error shake-error" :key="formErrorKey">{{ formError }}</p>

                <div class="modal-actions">
                  <button type="button" class="btn-secondary" @click="closeModal">Cancelar</button>
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

export default {
  name: 'UsuariosView',
  components: { Navbar },
  data() {
    return {
      usuarios: [],
      roles: [],
      loading: true,
      error: null,
      showModal: false,
      editando: false,
      saving: false,
      formError: null,
      formErrorKey: 0,
      fieldErrors: {},
      form: {
        nombreusuario: '',
        password: '',
        password_confirm: '',
        apellidopaterno: '',
        apellidomaterno: '',
        sexo: '',
        idrol: '',
      },
      usuariosPage: 1,
      usuariosTotalPages: 1,
      usuariosTotal: 0,
      removingId: null,
    }
  },
  async created() {
    await Promise.all([this.fetchUsuarios(), this.fetchRoles()])
  },
  methods: {
    _showFormError(msg) {
      this.formError = msg
      this.formErrorKey++
    },

    async fetchUsuarios() {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('usuarios/', { params: { page: this.usuariosPage } })
        this.usuarios = res.data.results ?? res.data
        this.usuariosTotalPages = res.data.total_pages ?? 1
        this.usuariosTotal = res.data.count ?? this.usuarios.length
      } catch {
        this.error = 'No se pudieron cargar los usuarios.'
      } finally {
        this.loading = false
      }
    },

    async fetchRoles() {
      try {
        const res = await api.get('roles/')
        this.roles = res.data
      } catch { /* no bloqueante */ }
    },

    openModal(u = null) {
      this.formError = null
      this.fieldErrors = {}
      if (u) {
        this.editando = true
        this.form = {
          idusuario: u.idusuario,
          nombreusuario: u.nombreusuario,
          password: '',
          password_confirm: '',
          apellidopaterno: u.apellidopaterno,
          apellidomaterno: u.apellidomaterno,
          sexo: u.sexo,
          idrol: u.idrol,
        }
      } else {
        this.editando = false
        this.form = {
          nombreusuario: '', password: '', password_confirm: '',
          apellidopaterno: '', apellidomaterno: '', sexo: '', idrol: '',
        }
      }
      this.showModal = true
    },

    closeModal() {
      this.showModal = false
      this.fieldErrors = {}
      this.formError = null
    },

    async guardarUsuario() {
      this.saving = true; this.formError = null; this.fieldErrors = {}
      if (this.form.password && this.form.password !== this.form.password_confirm) {
        this.fieldErrors.password_confirm = 'Las contraseñas no coinciden.'
        this.saving = false; return
      }
      try {
        const payload = {
          nombreusuario: this.form.nombreusuario,
          apellidopaterno: this.form.apellidopaterno,
          apellidomaterno: this.form.apellidomaterno,
          sexo: this.form.sexo, idrol: this.form.idrol,
        }
        if (this.form.password) {
          payload.password = this.form.password
          payload.password_confirm = this.form.password_confirm
        }
        if (this.editando) await api.put(`usuarios/${this.form.idusuario}/`, payload)
        else await api.post('usuarios/', payload)
        this.closeModal()
        await this.fetchUsuarios()
        this.$toast.success(this.editando ? 'Usuario actualizado.' : 'Usuario creado.')
      } catch (err) {
        const data = err.response?.data
        if (data && typeof data === 'object') {
          this.fieldErrors = data
          if (data.non_field_errors) {
            this._showFormError(Array.isArray(data.non_field_errors)
              ? data.non_field_errors.join(' ')
              : data.non_field_errors)
          }
        } else {
          this._showFormError('Error al guardar. Verifica los datos.')
        }
      } finally { this.saving = false }
    },

    async confirmDelete(u) {
      const ok = await this.$confirm(
        `¿Eliminar al usuario "${u.nombreusuario}"? Esta acción no se puede deshacer.`,
        'Eliminar usuario'
      )
      if (!ok) return
      this.removingId = u.idusuario
      try {
        await api.delete(`usuarios/${u.idusuario}/`)
        setTimeout(async () => {
          await this.fetchUsuarios()
          this.removingId = null
          this.$toast.success('Usuario eliminado.')
        }, 320)
      } catch {
        this.removingId = null
        this.$toast.error('No se pudo eliminar el usuario.')
      }
    },
  },
}
</script>

<style scoped>
.content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.skeleton-table { padding: .5rem 0; }
.skeleton-table .skeleton-row { border-bottom: 1px solid #f3f3f6; }

/* Role chip con colores según rol */
.role-chip {
  transition: transform .15s;
}
.role-administrador { background: #fde7e7; color: #c62828; }
.role-encargado      { background: #e3f2fd; color: #1565c0; }
.role-practicante    { background: #f3e5f5; color: #6a0dad; }

@media (max-width: 640px) {
  .content { padding: 1rem .85rem; }
}
</style>
