import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'

axios.defaults.baseURL = 'http://127.0.0.1:8000/api/' // Set your API base URL here
const token = localStorage.getItem('access_token')
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

createApp(App).use(store).use(router).mount('#app')

App.config.globalProperties.$axios = axios
