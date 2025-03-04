import apiClient from '../api/apiClient';
import {parseApiResponse} from "../../utils/jsonHelpers.js";

class IncidenteRepository {
    async obtenerIncidentes(circuitoId, ultimoId = 0) {
        try {
            console.log(`[IncidenteRepository] Solicitando incidentes para circuito=${circuitoId}, último_id=${ultimoId}`);

            try {
                const response = await apiClient.get(`/circuitos/${circuitoId}/incidentes`, {
                    params: { ultimo_id: ultimoId }
                });

                console.log("Incidentes obtenidos con éxito:", response.data);

                // Procesar la respuesta según el formato esperado
                const responseData = parseApiResponse(response.data);

                if (responseData && responseData.incidentes) {
                    console.log(`[IncidenteRepository] Procesados ${responseData.incidentes.length} incidentes`);
                    return responseData.incidentes;
                } else {
                    return [];
                }
            } catch (apiError) {
                console.warn('[IncidenteRepository] API no disponible para incidentes. Devolviendo datos simulados.');
                return this.generarIncidentesSimulados(circuitoId);
            }
        } catch (error) {
            console.error('[IncidenteRepository] Error al obtener incidentes:', error);
            return [];
        }
    }

    async registrarIncidente(circuitoId, incidente) {
        try {
            const response = await apiClient.post(`/circuitos/${circuitoId}/incidentes`, incidente);
            console.log("Incidente registrado con éxito:", response.data);
            return response.data;
        } catch (error) {
            console.error('Error al registrar incidente:', error);
            throw new Error(error.response?.data?.message || 'Error al registrar el incidente');
        }
    }

    // Método para generar datos de simulación en caso de que la API no responda
    generarIncidentesSimulados(circuitoId) {
        // Tipos de incidentes posibles
        const tiposIncidente = [
            "BANDERA_AMARILLA",
            "BANDERA_ROJA",
            "DEBRIS",
            "ACCIDENTE",
            "FALLO_MECANICO"
        ];

        // Descripciones posibles según el tipo
        const descripciones = {
            "BANDERA_AMARILLA": [
                "Salida de pista en curva 3",
                "Trompo en la chicane",
                "Vehículo lento en pista"
            ],
            "BANDERA_ROJA": [
                "Accidente grave en la recta principal",
                "Condiciones climáticas extremas",
                "Pista bloqueada por múltiples vehículos"
            ],
            "DEBRIS": [
                "Restos en la pista recta principal",
                "Piezas de alerón en la trazada",
                "Neumático en la zona de frenado"
            ],
            "ACCIDENTE": [
                "Colisión entre dos vehículos",
                "Impacto contra las barreras",
                "Vehículo volcado tras contacto"
            ],
            "FALLO_MECANICO": [
                "Fallo de motor, aceite en pista",
                "Pérdida de neumático",
                "Fallo en frenos, salida de pista"
            ]
        };

        // Decidir si crear un incidente (simulación con 30% de probabilidad)
        if (Math.random() < 0.3) {
            // Seleccionar tipo aleatorio
            const tipo = tiposIncidente[Math.floor(Math.random() * tiposIncidente.length)];

            // Seleccionar descripción aleatoria según el tipo
            const descripcionesDisponibles = descripciones[tipo];
            const descripcion = descripcionesDisponibles[Math.floor(Math.random() * descripcionesDisponibles.length)];

            // Decidir si asignar a un piloto (70% de probabilidad) o dejar como null (debris o clima)
            const conductorId = Math.random() < 0.7 ? Math.floor(Math.random() * 5) + 1 : null;

            return [{
                id: Math.floor(Math.random() * 1000),
                circuito_id: parseInt(circuitoId),
                tipo_incidente: tipo,
                descripcion: descripcion,
                conductor_id: conductorId,
                estado: "ACTIVO",
                timestamp: new Date().toISOString()
            }];
        } else {
            // Sin incidentes
            return [];
        }
    }
}

export default new IncidenteRepository();