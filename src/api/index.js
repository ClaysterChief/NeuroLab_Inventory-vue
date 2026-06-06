/**
 * api/index.js — Instancia de Axios centralizada.
 *
 * La URL base se lee de la variable de entorno VUE_APP_API_URL
 * definida en .env.local de cada instalación.
 * Si no existe, usa 127.0.0.1 como fallback para desarrollo local.
 *
 * Para cambiar la URL en una instalación:
 *   1. Copia .env.example como .env.local
 *   2. Edita VUE_APP_API_URL con la IP del servidor
 *   3. Reinicia el servidor Vue (npm run serve)
 */
import axios from 'axios'

const BASE_URL = process.env.VUE_APP_API_URL || `http://${window.location.hostname}:8000/api/`

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

// Adjuntar token antes de cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, (error) => Promise.reject(error))

// Renovar token automáticamente si expiró (HTTP 401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && localStorage.getItem('refresh_token')) {
      original._retry = true
      try {
        const res = await axios.post(`${BASE_URL}token/refresh/`, {
          refresh: localStorage.getItem('refresh_token'),
        })
        const newAccess = res.data.access
        localStorage.setItem('access_token', newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default api
