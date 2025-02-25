import apiClient from '../api/apiClient';
import IPosicionesRepository from '../../core/interfaces/IPosicionesRepository';
import { parseApiResponse } from '../../utils/jsonHelpers';

class PosicionesRepository extends IPosicionesRepository {
    constructor() {
        super();
        // Para simulación, mantener un estado local
        this.posicionesSimuladas = new Map(); // circuitoId -> {posiciones, pollNumber}
        this.pollNumber = 0;
    }

    /**
     * Actualiza la posición de un piloto en un circuito
     * @param {number} circuitoId - ID del circuito
     * @param {number} conductorId - ID del piloto
     * @param {number} posicion - Posición (1-based)
     * @returns {Promise<any>}
     */
    async actualizarPosicion(circuitoId, conductorId, posicion) {
        try {
            console.log(`Enviando posición para circuito ${circuitoId}, piloto ${conductorId}, posición ${posicion}`);

            // Datos a enviar en el formato esperado por el backend
            const data = {
                conductor_id: conductorId,
                posicion: posicion
            };

            // Intentar con la API primero
            try {
                // Asegurarse de que la URL es correcta para tu backend
                const response = await apiClient.post(`/circuitos/${circuitoId}/posiciones`, data);
                console.log("Posición actualizada con éxito:", response.data);
                return response.data;
            } catch (apiError) {
                console.warn('API no disponible para posiciones. Simulando respuesta.', apiError);

                // Modo simulación para desarrollo
                // Inicializar el circuito si no existe
                if (!this.posicionesSimuladas.has(circuitoId)) {
                    this.posicionesSimuladas.set(circuitoId, {
                        pollNumber: 0,
                        posiciones: []
                    });
                }

                const circuitoData = this.posicionesSimuladas.get(circuitoId);

                // Buscar si ya existe una posición para este piloto
                const posicionExistente = circuitoData.posiciones.findIndex(p => p.conductor_id === conductorId);

                // Crear nueva posición
                const nuevaPosicion = {
                    id: Math.floor(Math.random() * 10000),
                    circuito_id: circuitoId,
                    conductor_id: conductorId,
                    posicion: posicion,
                    timestamp: new Date().toISOString()
                };

                // Actualizar o añadir
                if (posicionExistente >= 0) {
                    circuitoData.posiciones[posicionExistente] = nuevaPosicion;
                } else {
                    circuitoData.posiciones.push(nuevaPosicion);
                }

                // Incrementar contador de poll
                circuitoData.pollNumber++;
                this.pollNumber++;

                // Actualizar datos simulados
                this.posicionesSimuladas.set(circuitoId, circuitoData);

                console.log("Posición simulada:", nuevaPosicion);
                return nuevaPosicion;
            }
        } catch (error) {
            console.error('Error al actualizar posición:', error);
            throw new Error(error.response?.data?.message || 'Error al actualizar la posición');
        }
    }

    /**
     * Obtiene las posiciones actuales de los pilotos en un circuito
     * @param {number} circuitoId - ID del circuito
     * @returns {Promise<any>}
     */
    async obtenerPosiciones(circuitoId) {
        try {
            // Intentar con la API primero
            try {
                const response = await apiClient.get(`/circuitos/${circuitoId}/posiciones`);

                // Procesar la respuesta que puede contener múltiples objetos JSON
                const parsedResponse = parseApiResponse(response.data);

                if (parsedResponse) {
                    console.log("Posiciones obtenidas y procesadas:", parsedResponse);
                    return parsedResponse;
                } else {
                    console.warn("No se pudo obtener un objeto JSON válido de la respuesta");
                    throw new Error("Respuesta inválida del servidor");
                }
            } catch (apiError) {
                console.warn('API no disponible para posiciones. Devolviendo datos simulados.', apiError);

                // Devolver datos simulados si existen
                if (this.posicionesSimuladas.has(circuitoId)) {
                    const circuitoData = this.posicionesSimuladas.get(circuitoId);

                    // Ordenar posiciones por su valor
                    const posicionesOrdenadas = [...circuitoData.posiciones].sort((a, b) => a.posicion - b.posicion);

                    // Construir respuesta en formato esperado
                    const respuesta = {
                        circuito_id: circuitoId,
                        poll_number: this.pollNumber,
                        posiciones: posicionesOrdenadas,
                        timestamp: new Date().toISOString()
                    };

                    console.log("Devolviendo posiciones simuladas:", respuesta);
                    return respuesta;
                }

                // Si no hay datos simulados, devolver objeto vacío
                return {
                    circuito_id: circuitoId,
                    poll_number: 0,
                    posiciones: [],
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('Error al obtener posiciones:', error);
            // Devolver un objeto con estructura básica para evitar errores
            return {
                circuito_id: circuitoId,
                poll_number: 0,
                posiciones: [],
                timestamp: new Date().toISOString()
            };
        }
    }
}

export default new PosicionesRepository();