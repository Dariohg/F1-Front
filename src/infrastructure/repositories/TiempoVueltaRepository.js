import apiClient from '../api/apiClient';
import ITiempoVueltaRepository from '../../core/interfaces/ITiempoVueltaRepository';

class TiempoVueltaRepository extends ITiempoVueltaRepository {
    async registrarTiempo(circuitoId, tiempoVuelta) {
        try {
            // MODO DESARROLLO: Si el backend aún no está listo, simular una respuesta exitosa
            try {
                const response = await apiClient.post(`/circuitos/${circuitoId}/tiempos`, {
                    conductor_id: tiempoVuelta.conductor_id,
                    numero_vuelta: tiempoVuelta.numero_vuelta,
                    tiempo: tiempoVuelta.tiempo
                });
                console.log("Tiempo registrado con éxito:", response.data);
                return response.data;
            } catch (apiError) {
                console.warn('API no disponible para tiempos. Usando datos simulados.');
                // Simular una respuesta exitosa para desarrollo
                const simulatedResponse = {
                    id: Math.floor(Math.random() * 10000),
                    circuito_id: circuitoId,
                    conductor_id: tiempoVuelta.conductor_id,
                    numero_vuelta: tiempoVuelta.numero_vuelta,
                    tiempo: tiempoVuelta.tiempo,
                    created_at: new Date().toISOString()
                };
                console.log("Tiempo simulado:", simulatedResponse);
                return simulatedResponse;
            }
        } catch (error) {
            console.error('Error al registrar tiempo de vuelta:', error);
            throw new Error(error.response?.data?.message || 'Error al registrar el tiempo de vuelta');
        }
    }

    async obtenerTiemposPorCircuito(circuitoId) {
        try {
            // MODO DESARROLLO: Si el backend aún no está listo, devolver datos simulados
            try {
                const response = await apiClient.get(`/circuitos/${circuitoId}/tiempos`);
                console.log("Tiempos obtenidos con éxito:", response.data);
                return response.data;
                // eslint-disable-next-line no-unused-vars
            } catch (apiError) {
                console.warn('API no disponible para tiempos. Devolviendo datos simulados.');
                // Devolver un array vacío para desarrollo (la primera vez)
                return [];
            }
        } catch (error) {
            console.error('Error al obtener tiempos de vuelta:', error);
            // En caso de error, devolver un array vacío para evitar errores en cascada
            return [];
        }
    }
}

export default new TiempoVueltaRepository();