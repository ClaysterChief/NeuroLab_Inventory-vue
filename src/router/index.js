import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'
import { ROLE_NAMES } from '../store'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { public: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/inventario',
    name: 'inventario',
    component: () => import('../views/InventarioView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/experimento',
    name: 'experimento',
    component: () => import('../views/ExperimentoView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/catalogos',
    name: 'catalogos',
    component: () => import('../views/CatalogosView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/usuarios',
    name: 'usuarios',
    component: () => import('../views/UsuariosView.vue'),
    // Solo Administrador puede gestionar usuarios
    meta: { requiresAuth: true, requiredRole: ROLE_NAMES.ADMINISTRADOR },
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

// ── Navigation Guard Global ────────────────────────────────────────────────
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated
  const userRole = (store.getters.userRole || '').toLowerCase()

  // 1. Ruta pública (login): si ya hay sesión, ir al dashboard
  if (to.meta.public && isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  // 2. Ruta privada sin sesión: redirigir al login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'home' })
  }

  // 3. Ruta con rol requerido: verificar por nombre de rol
  if (to.meta.requiredRole && userRole !== to.meta.requiredRole) {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
