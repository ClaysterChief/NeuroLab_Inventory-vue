<template>
  <div id="HomeView">
    <h1>Bienvenido</h1>
    <div id="grupo">
      <div id="grupo">
        <div id="valo">
          <div id="designer14"></div>
          <div id="neurolabinventory">Neurolab Inventory</div>
        </div>
      </div>
    </div>
    <div id="rectngulo"></div>
    <form @submit.prevent="login" id="formulario">
      <input
        v-model="username"
        id="webinputdefault"
        type="text" required
        placeholder="Usuario"
      />
      <input
        v-model="password"
        id="webinputdefault2"
        type="password" required
        placeholder="Contraseña"
      />
      <p v-if="error" :class="error">{{ error }}</p>
      <input id="webbuttonprimarydefa" type="submit" value="Iniciar sesión" />
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'HomeView',
  data() {
    return {
      username: '',
      password: '',
      error: null
    }
  },
  methods: {
    async login() {
      try {
        const res = await axios.post('http://127.0.0.1:8000/api/token/', {
          username: this.username,
          password: this.password
        })
        localStorage.setItem('access_token', res.data.access); // Guarda el token en localStorage
        localStorage.setItem('refresh_token', res.data.refresh); // Guarda el refresh token en localStorage
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`; // Configura el header de autorización para futuras solicitudes
        this.$router.push('/dashboard'); // Redirige al dashboard si las credenciales son correctas

      } catch (error) {
        this.error = 'Usuario o contraseña incorrectos'; // Muestra un mensaje de error
        console.error(error);
      }
    }
  },
  mounted() {
  }
}
</script>

<style>
.error { color: red; }
.success { color: green; }
</style>
