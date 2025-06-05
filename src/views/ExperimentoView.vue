<template>
    <Navbar />
    <div id="administrador">
        <form class="grupo-formulario-columnas__2">
            <div class="formulario-columna">
                Responsable: <input type="text" placeholder="Alan Nava Ortiz" class="formulario-input" readonly>
                <h3>Datos de experimento:</h3>
                Registro: <input type="number" placeholder="10" class="formulario-input" readonly> Sexo: <select name="Sexo" class="formulario-input">
                    <option value="1">Macho</option>
                    <option value="2">Hembra</option>
                </select>
                <br> <br>
                Anestésico: <select name="Anestesico" class="formulario-input">
                    <option value="1">Isoflurano</option>
                    <option value="2">Ketamina</option>
                </select>
                Peso: <input type="number" placeholder="100" class="formulario-input">g
                <br> <br>
                Dosis Total: <input type="number" placeholder="10" class="formulario-input">ml <br> <br> Dosis administrada: <input type="number" placeholder="5" class="formulario-input">ml
                <br>
            </div>
            <div class="formulario-columna">
                Fecha de registro: <input type="date" placeholder="2023-10-01" class="formulario-input"> <br> <br>
                Actividad: <br> <textarea placeholder="Notas del experimento" class="formulario-input"></textarea>
                <br> <br>
                Notas: <br> <textarea placeholder="Notas del experimento" class="formulario-input"></textarea>
                <br>
                <input type="button" value="Guardar" class="formulario-input formulario-input-btn">
            </div>
        </form>
    </div>
</template>

<script>
import Navbar from '../components/Navbar.vue';
export default {
    name: 'ExperimentoView',
    components: {
        Navbar
    }
}
</script>