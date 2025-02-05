import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api',  // Cambiamos a ruta relativa
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;