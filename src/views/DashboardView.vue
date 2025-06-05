<template>
    <Navbar />
    <div id="administrador">
        <h1 id="panelprincipal">Panel Principal</h1>
        <div class="grupo-tarjeta">
            <router-link id="tarjeta" to="/inventario">
                <div id="designer15"></div>
                <div id="texttarjeta">Animales</div>
            </router-link>
            <router-link id="tarjeta" to="/inventario">
                <div id="iconodeusuario"></div>
                <div id="usuarios">Usuarios</div>
            </router-link>
            <router-link id="tarjeta" to="/experimento">
                <div id="iconobitacora"></div>
                <div id="usuarios">Experimentos</div>
            </router-link>
        </div>
    </div>
</template>

<script>
    import Navbar from '../components/Navbar.vue';
    export default {
        name: 'DashboardView',
        components: {
            Navbar
        }
    }
</script>
