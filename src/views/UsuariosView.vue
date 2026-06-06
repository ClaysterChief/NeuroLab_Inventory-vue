<template>
  <div class="page-wrapper">
    <Navbar />
    <main class="content">
      <div class="page-header">
        <h1>Gestión de Usuarios</h1>
        <button class="btn-primary" @click="openModal()">+ Nuevo usuario</button>
      </div>

      <!-- ── Tabla ────────────────────────────────────────── -->
      <div class="table-card">
        <div v-if="loading" class="state-msg">Cargando usuarios…</div>
        <div v-else-if="error" class="state-msg error">{{ error }}</div>
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
          <tbody>
            <tr v-for="u in usuarios" :key="u.idusuario">
              <td>{{ u.idusuario }}</td>
              <td>{{ u.nombreusuario }}</td>
              <td>{{ u.apellidopaterno }} {{ u.apellidomaterno }}</td>
              <td>{{ u.sexo }}</td>
              <td><span class="role-chip">{{ u.rol_nombre }}</span></td>
              <td class="actions">
                <button class="btn-icon" @click="openModal(u)" title="Editar">✏️</button>
                <button class="btn-icon danger" @click="confirmDelete(u)" title="Eliminar">🗑️</button>
              </td>
            </tr>
            <tr v-if="!usuarios.length">
              <td colspan="6" class="empty-row">No hay usuarios registrados.</td>
            </tr>
          </tbody>
        </table>
        <div v-if="usuariosTotalPages > 1" class="pagination-bar">
          <button :disabled="usuariosPage === 1" @click="usuariosPage--; fetchUsuarios()">← Anterior</button>
          <span>Página {{ usuariosPage }} de {{ usuariosTotalPages }} · {{ usuariosTotal }} registros</span>
          <button :disabled="usuariosPage === usuariosTotalPages" @click="usuariosPage++; fetchUsuarios()">Siguiente
            →</button>
        </div>
      </div>

      <!-- ── Modal ────────────────────────────────────────── -->
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <h2>{{ editando ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
          <form @submit.prevent="guardarUsuario">
            <div class="fields-grid">

              <div class="field">
                <label>Nombre de usuario <span class="req">*</span></label>
                <input v-model="form.nombreusuario" required :disabled="editando"
                  :class="{ 'input-error': fieldErrors.nombreusuario }" />
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
                  :class="{ 'input-error': fieldErrors.password }" />
                <span v-if="fieldErrors.password" class="field-error">
                  {{ fieldErrors.password }}
                </span>
              </div>

              <div class="field">
                <label>Confirmar contraseña</label>
                <input v-model="form.password_confirm" type="password" :required="!editando || !!form.password"
                  autocomplete="new-password" :class="{ 'input-error': fieldErrors.password_confirm }" />
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

            <p v-if="formError" class="form-error">{{ formError }}</p>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="closeModal">Cancelar</button>
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
    }
  },
  async created() {
    await Promise.all([this.fetchUsuarios(), this.fetchRoles()])
  },
  methods: {
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
      this.saving = true
      this.formError = null
      this.fieldErrors = {}

      // Validación local de contraseñas
      if (this.form.password && this.form.password !== this.form.password_confirm) {
        this.fieldErrors.password_confirm = 'Las contraseñas no coinciden.'
        this.saving = false
        return
      }

      try {
        const payload = {
          nombreusuario: this.form.nombreusuario,
          apellidopaterno: this.form.apellidopaterno,
          apellidomaterno: this.form.apellidomaterno,
          sexo: this.form.sexo,
          idrol: this.form.idrol,
        }
        if (this.form.password) {
          payload.password = this.form.password
          payload.password_confirm = this.form.password_confirm
        }

        if (this.editando) {
          await api.put(`usuarios/${this.form.idusuario}/`, payload)
        } else {
          await api.post('usuarios/', payload)
        }
        this.closeModal()
        await this.fetchUsuarios()
      } catch (err) {
        const data = err.response?.data
        if (data && typeof data === 'object') {
          this.fieldErrors = data
          if (data.non_field_errors) {
            this.formError = Array.isArray(data.non_field_errors)
              ? data.non_field_errors.join(' ')
              : data.non_field_errors
          }
        } else {
          this.formError = 'Error al guardar. Verifica los datos.'
        }
      } finally {
        this.saving = false
      }
    },

    async confirmDelete(u) {
      if (!confirm(`¿Eliminar al usuario "${u.nombreusuario}"?\nEsta acción no se puede deshacer.`)) return
      try {
        await api.delete(`usuarios/${u.idusuario}/`)
        await this.fetchUsuarios()
      } catch {
        alert('No se pudo eliminar el usuario.')
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
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.table-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .9rem;
}

.data-table th {
  background: #f8f8fb;
  padding: .75rem 1rem;
  text-align: left;
  font-size: .8rem;
  font-weight: 600;
  color: #666;
  border-bottom: 1px solid #e0e0e0;
}

.data-table td {
  padding: .7rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.empty-row {
  text-align: center;
  color: #aaa;
  padding: 2rem !important;
}

.actions {
  display: flex;
  gap: 6px;
}

.role-chip {
  background: #f3e5f5;
  color: #6a0dad;
  font-size: .78rem;
  padding: 2px 8px;
  border-radius: 99px;
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
}

.modal {
  background: #fff;
  border-radius: 14px;
  padding: 2rem;
  width: 100%;
  max-width: 540px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  font-size: 1.2rem;
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

.field label {
  font-size: .82rem;
  font-weight: 500;
  color: #555;
}

.field input,
.field select {
  padding: .55rem .8rem;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  font-size: .9rem;
  outline: none;
}

.field input:focus,
.field select:focus {
  border-color: #80201d;
}

.field input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.input-error {
  border-color: #c62828 !important;
  background: #fff8f8;
}

.field-error {
  color: #c62828;
  font-size: .78rem;
  margin-top: 2px;
}

.label-hint {
  font-size: .75rem;
  color: #999;
  font-weight: 400;
  margin-left: 4px;
}

.req {
  color: #c62828;
}

.form-error {
  color: #c62828;
  font-size: .82rem;
  background: #ffebee;
  padding: .5rem;
  border-radius: 6px;
  margin-top: .5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 1.5rem;
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