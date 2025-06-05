<template>
    <Navbar />
    <div id="administrador">
        <form class="grupo-formulario-columnas__2">
            <div class="formulario-columna">
                <h3>Busqueda de Tejido:</h3>
                Buscar tejido: <input type="text" placeholder="Buscar por nombre o ID" class="formulario-input"> <input type="button" value="Buscar" class="formulario-input formulario-input-btn">
                <br> <br>
                Nombre de tejido: <textarea name="nombreTejido" id="nombreTejido"></textarea>
                <br> <br>
                Descripción: <textarea name="descripcion" id="descripcion"></textarea>
                <br> <br>
                <input type="button" value="Guardar" class="formulario-input formulario-input-btn">
                <input type="button" value="Eliminar" class="formulario-input formulario-input-btn">
            </div>
            <div class="formulario-columna">
            </div>
        </form>
    </div>
</template>

<script>
import Navbar from '../components/Navbar.vue';
export default {
    name: 'InventarioView',
    components: {
        Navbar
    }
}
</script>