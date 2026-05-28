/**
 * store/index.js — Módulo Vuex de autenticación.
 *
 * State:  token, refreshToken, user (id, username, nombre_completo, role_id, role_name)
 * Getters: isAuthenticated, currentUser, userRole, isAdmin, isResponsable
 * Mutations: SET_AUTH, CLEAR_AUTH
 * Actions: login, logout, restoreSession
 */
import { createStore } from 'vuex'
import api from '../api'

// Nombres de roles tal como están en la tabla 'roles' de la BD.
// Se comparan en minúsculas para ser case-insensitive.
// Si en tu BD el nombre es diferente, cámbialo aquí.
export const ROLE_NAMES = {
  ADMINISTRADOR: 'administrador',
  ENCARGADO: 'encargado',
  PRACTICANTE: 'practicante',
}

export default createStore({
  state: {
    token: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  },

  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
    userRole: (state) => state.user?.role_name || null,

    // Helpers por nombre de rol (case-insensitive)
    isAdmin: (state) => {
      const role = (state.user?.role_name || '').toLowerCase()
      return role === ROLE_NAMES.ADMINISTRADOR
    },
    isEncargado: (state) => {
      const role = (state.user?.role_name || '').toLowerCase()
      return [ROLE_NAMES.ADMINISTRADOR, ROLE_NAMES.ENCARGADO].includes(role)
    },
    isPracticante: (state) => {
      const role = (state.user?.role_name || '').toLowerCase()
      return role === ROLE_NAMES.PRACTICANTE
    },
  },

  mutations: {
    SET_AUTH(state, { token, refreshToken, user }) {
      state.token = token
      state.refreshToken = refreshToken
      state.user = user
      // Persistir en localStorage
      localStorage.setItem('access_token', token)
      localStorage.setItem('refresh_token', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
    },
    CLEAR_AUTH(state) {
      state.token = null
      state.refreshToken = null
      state.user = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    },
  },

  actions: {
    /**
     * Login: llama a POST /api/login/ y guarda el JWT + datos del usuario.
     * @returns {Object} user — datos del usuario autenticado
     */
    async login({ commit }, { username, password }) {
      const res = await api.post('login/', { username, password })
      const { access, refresh, user } = res.data
      commit('SET_AUTH', { token: access, refreshToken: refresh, user })
      return user
    },

    /**
     * Logout: limpia el store y redirige al inicio.
     */
    logout({ commit }) {
      commit('CLEAR_AUTH')
    },

    /**
     * Restaurar sesión al recargar la página.
     * Verifica con /api/me/ que el token almacenado sigue siendo válido.
     */
    async restoreSession({ commit, state }) {
      if (!state.token) return false
      try {
        const res = await api.get('me/')
        // Actualizar datos del usuario (pueden haber cambiado en la BD)
        commit('SET_AUTH', {
          token: state.token,
          refreshToken: state.refreshToken,
          user: res.data,
        })
        return true
      } catch {
        commit('CLEAR_AUTH')
        return false
      }
    },
  },
})
