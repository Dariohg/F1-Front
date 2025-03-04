import apiClient from '../api/apiClient';
import ITiempoVueltaRepository from '../../core/interfaces/ITiempoVueltaRepository';
import {parseApiResponse} from "../../utils/jsonHelpers.js";

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
                // eslint-disable-next-line no-unused-vars
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
            console.log(`[TiempoVueltaRepository] Solicitando tiempos para circuito=${circuitoId}`);

            try {
                const response = await apiClient.get(`/circuitos/${circuitoId}/tiempos`);
                console.log("Tiempos obtenidos con éxito:", response.data);

                // Usar parseApiResponse para extraer el objeto JSON más reciente
                const processedData = parseApiResponse(response.data);

                if (processedData && processedData.tiempos_vuelta) {
                    console.log(`[TiempoVueltaRepository] Procesados ${processedData.tiempos_vuelta.length} tiempos de vuelta`);
                    return processedData.tiempos_vuelta;
                } else {
                    return [];
                }
            } catch (apiError) {
                console.warn('[TiempoVueltaRepository] API no disponible para tiempos. Devolviendo datos simulados.');
                return [];
            }
        } catch (error) {
            console.error('[TiempoVueltaRepository] Error al obtener tiempos de vuelta:', error);
            return [];
        }
    }
}

export default new TiempoVueltaRepository();