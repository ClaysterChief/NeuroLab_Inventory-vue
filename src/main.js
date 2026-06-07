/**
 * main.js — Punto de entrada de la aplicación Vue 3.
 *
 * Correcciones aplicadas:
 *  - Se usa 'app' (instancia) en lugar de 'App' (componente) para
 *    registrar propiedades globales
 *  - El token ya no se configura aquí; lo maneja api/index.js con interceptors
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import api from './api'
import { NotificationsPlugin } from './plugins/notifications'

const app = createApp(App)

// Registrar la instancia de axios en propiedades globales
// (accesible como this.$api en Options API)
app.config.globalProperties.$api = api

app.use(store)
app.use(router)
app.use(NotificationsPlugin)
app.mount('#app')
