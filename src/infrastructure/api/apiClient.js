import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'https://tu-api.com/api', // Cambia esto por la URL de tu API
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;