// src/infrastructure/services/IncidentePollingService.js

/**
 * Servicio para gestionar el long polling de incidentes en la carrera
 */
class IncidentePollingService {
    constructor() {
        this.isPolling = false;
        this.circuitoId = null;
        this.pollingInterval = null;
        this.pollingDelay = 4000; // 4 segundos
        this.onIncidenteDetected = null;
        this.ultimoIncidenteId = 0;
        this.consecutiveErrors = 0;
        this.maxConsecutiveErrors = 3;
        this.incidenteProbability = 0.3; // 30% probabilidad de incidente
        this.notifiedIncidentIds = new Set(); // Para evitar notificar duplicados
    }

    /**
     * Inicia el polling de incidentes
     * @param {number} circuitoId - ID del circuito
     * @param {Function} onIncidenteDetected - Callback cuando se detecta un incidente
     */
    startPolling(circuitoId, onIncidenteDetected) {
        if (this.isPolling) {
            this.stopPolling();
        }

        console.log(`[IncidentePollingService] Iniciando polling para circuito=${circuitoId}`);

        this.isPolling = true;
        this.circuitoId = circuitoId;
        this.onIncidenteDetected = onIncidenteDetected;
        this.ultimoIncidenteId = 0;
        this.consecutiveErrors = 0;
        this.notifiedIncidentIds.clear();

        // Comenzar con un pequeño retraso para no interferir con la inicialización
        setTimeout(() => {
            // Simular un incidente con 30% de probabilidad
            this.simulateIncidente();

            // Establecer intervalo para consultas periódicas
            this.pollingInterval = setInterval(() => {
                this.simulateIncidente();
            }, this.pollingDelay);
        }, 3000);
    }

    /**
     * Detiene el polling de incidentes
     */
    stopPolling() {
        console.log('[IncidentePollingService] Deteniendo polling');

        this.isPolling = false;
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /**
     * Simula la ocurrencia de un incidente
     */
    simulateIncidente() {
        if (!this.isPolling || !this.circuitoId) return;

        try {
            // Generar incidente aleatorio con 30% de probabilidad
            if (Math.random() < this.incidenteProbability) {
                const incidente = this.generarIncidenteSimulado();

                // Verificar si ya se notificó este incidente
                const incidenteId = incidente.id;
                if (!this.notifiedIncidentIds.has(incidenteId)) {
                    // Marcar como notificado
                    this.notifiedIncidentIds.add(incidenteId);

                    // Actualizar el último ID de incidente
                    this.ultimoIncidenteId = Math.max(this.ultimoIncidenteId, incidenteId);

                    // Notificar el incidente
                    if (this.onIncidenteDetected) {
                        this.onIncidenteDetected(incidente);
                    }

                    console.log("[IncidentePollingService] Incidente generado:", incidente);

                    // Detener el polling después de generar un incidente
                    // para evitar múltiples incidentes simultáneos
                    this.stopPolling();
                }
            }
        } catch (error) {
            console.error('[IncidentePollingService] Error al simular incidente:', error);
        }
    }

    /**
     * Genera un incidente simulado
     * @returns {Object} Incidente simulado
     */
    generarIncidenteSimulado() {
        // Tipos de incidentes posibles
        const tiposIncidente = [
            "BANDERA_AMARILLA",
            "BANDERA_ROJA",
            "DEBRIS",
            "ACCIDENTE",
            "FALLO_MECANICO"
        ];

        // Descripciones según el tipo
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

        // Seleccionar tipo aleatorio
        const tipo = tiposIncidente[Math.floor(Math.random() * tiposIncidente.length)];

        // Seleccionar descripción aleatoria según el tipo
        const descripcionesDisponibles = descripciones[tipo];
        const descripcion = descripcionesDisponibles[Math.floor(Math.random() * descripcionesDisponibles.length)];

        // Decidir si asignar a un piloto (70% de probabilidad) o dejar como null (debris o clima)
        const conductorId = Math.random() < 0.7 ? Math.floor(Math.random() * 5) + 1 : null;

        return {
            id: Math.floor(Math.random() * 1000) + 1,
            circuito_id: parseInt(this.circuitoId),
            tipo_incidente: tipo,
            descripcion: descripcion,
            conductor_id: conductorId,
            estado: "ACTIVO",
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Verifica si el polling está activo
     * @returns {boolean}
     */
    isActive() {
        return this.isPolling;
    }
}

export default IncidentePollingService;