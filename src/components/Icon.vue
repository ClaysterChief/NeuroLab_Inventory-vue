<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="icon"
    v-html="paths[name] || paths.help"
  ></svg>
</template>

<script>
/**
 * Icon.vue — Sistema de íconos SVG en línea (sin dependencia de fuentes).
 *
 * POR QUÉ EXISTE: los emojis (🐀📦📋 etc.) dependen de que el sistema
 * operativo tenga una fuente de emoji instalada (Segoe UI Emoji en
 * Windows 10/11). Windows 7 y 8 no la incluyen — en esos equipos los
 * emojis se ven como cuadros vacíos ☐ o glifos en blanco y negro
 * inconsistentes entre navegadores. Como el laboratorio usa equipos
 * variados, esto puede romper la legibilidad de la interfaz.
 *
 * La solución: dibujar los íconos directamente como SVG (vectores),
 * que se ven IDÉNTICOS en cualquier sistema operativo o navegador,
 * sin depender de ninguna fuente externa.
 *
 * CÓMO AGREGAR UN ÍCONO NUEVO:
 * 1. Busca el path en https://lucide.dev (estilo consistente, MIT license)
 * o dibuja uno propio.
 * 2. Agrega una entrada al objeto `paths` de abajo con el contenido
 * interno del <svg> (paths/circles/lines), como string.
 * 3. Úsalo como: <Icon name="nombre-que-elegiste" />
 *
 * Uso: <Icon name="home" :size="20" color="#fff" />
 */
export default {
  name: 'IconComponent',
  props: {
    name: { type: String, required: true },
    size: { type: [Number, String], default: 20 },
    color: { type: String, default: 'currentColor' },
  },
  data() {
    return {
      paths: {
        // ── Navegación ──────────────────────────────────────────
        home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
        box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
        clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h6"/>',
        book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
        calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
        user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',

        // ── Roedor (logo temático, reemplaza al emoji 🐀) ───────
        // Ícono minimalista de perfil (estilo Lucide)
        rat: '<path d="M4 18c-2 0-3-1-2-2l5-5a8 8 0 0 1 13 7H4z"/><path d="M20 17.5C22 17.5 23 16 23 14c0-2-1.5-3-3-3"/><circle cx="10" cy="11.5" r="2.5"/><path d="M6 14.5h.01"/><path d="M3 15l-2-1"/><path d="M3 17l-2 1"/>',

        // ── UI genérico ─────────────────────────────────────────
        'chevron-down': '<polyline points="6 9 12 15 18 9"/>',
        'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><path d="M21 12H9"/>',
        key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
        'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
        'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
        check: '<polyline points="20 6 9 17 4 12"/>',
        'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
        'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
        info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
        help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
        search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
        plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
        edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
        trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><path d="M12 15V3"/>',
        scale: '<path d="M16 16h.01M16 16a2 2 0 0 0 2-2M16 16a2 2 0 0 1-2-2M3 7l4-2 4 2M7 5v14M19 7l-4-2-4 2M15 5v14M3 7l3 7c-1.5 2-4.5 2-6 0l3-7M21 7l-3 7c1.5 2 4.5 2 6 0l-3-7"/>',
        'chart-pie': '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
        clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        package: '<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/>',
        'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
        'trending-down': '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
        minus: '<path d="M5 12h14"/>',
      },
    }
  },
}
</script>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>