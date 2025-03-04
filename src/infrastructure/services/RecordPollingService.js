// src/infrastructure/services/RecordPollingService.js
import apiClient from '../api/apiClient';

/**
 * Servicio para gestionar el short polling de récords de vuelta
 * Versión optimizada para reducir interferencias con la simulación principal
 */
class RecordPollingService {
    constructor() {
        this.isPolling = false;
        this.circuitoId = null;
        this.pollingInterval = null;
        this.pollingDelay = 5000; // Aumentado a 5 segundos para reducir carga
        this.onRecordDetected = null;
        this.lastPollNumber = 0;
        this.consecutiveErrors = 0;
        this.maxConsecutiveErrors = 3;
        this.useSimulation = false; // Flag para usar datos simulados
        this.lastRecordTimestamp = null; // Para evitar notificar el mismo récord varias veces
    }

    /**
     * Inicia el short polling de récords
     * @param {number} circuitoId - ID del circuito
     * @param {Function} onRecordDetected - Callback cuando se detecta un récord
     */
    startPolling(circuitoId, onRecordDetected) {
        if (this.isPolling) {
            this.stopPolling();
        }

        console.log(`[RecordPollingService] Iniciando polling para circuito=${circuitoId}`);

        this.isPolling = true;
        this.circuitoId = circuitoId;
        this.onRecordDetected = onRecordDetected;
        this.lastPollNumber = 0;
        this.consecutiveErrors = 0;
        this.lastRecordTimestamp = null;

        // Realizar la primera consulta después de un retraso para permitir que la simulación se inicialice
        setTimeout(() => {
            // Realizar una consulta inicial
            this.pollRecords();

            // Configurar el intervalo para las siguientes consultas
            this.pollingInterval = setInterval(() => {
                this.pollRecords();
            }, this.pollingDelay);
        }, 2000);
    }

    /**
     * Detiene el short polling
     */
    stopPolling() {
        console.log('[RecordPollingService] Deteniendo polling');

        this.isPolling = false;
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /**
     * Realiza una consulta de récords
     * @private
     */
    async pollRecords() {
        if (!this.isPolling || !this.circuitoId) return;

        try {
            console.log(`[RecordPollingService] Consultando récords para circuito=${this.circuitoId}`);

            let data;

            // Primero intentamos obtener los datos del servidor
            try {
                const response = await apiClient.get(`/circuitos/${this.circuitoId}/records`);
                data = response.data;
                this.useSimulation = false; // Si la respuesta es exitosa, no usamos simulación
            } catch (apiError) {
                // En caso de error, no spammear la consola constantemente
                if (this.consecutiveErrors % 5 === 0) { // Solo logueamos cada 5 errores
                    console.warn('[RecordPollingService] API de récords no disponible, usando simulación');
                }
                this.useSimulation = true;

                // Generar datos simulados con probabilidad baja (5%) de detectar un récord
                // para evitar demasiadas notificaciones durante pruebas
                const detectarRecord = Math.random() < 0.05;

                // Simulamos el aumento del poll_number
                const newPollNumber = this.lastPollNumber + 1;

                data = {
                    poll_number: newPollNumber,
                    record_detectado: detectarRecord,
                    record: detectarRecord ? this.generateSimulatedRecord(this.circuitoId) : null
                };

                if (detectarRecord) {
                    console.log('[RecordPollingService] Récord simulado generado:', data.record);
                }
            }

            if (!data) {
                this.consecutiveErrors++;
                return;
            }

            // Evitar loguear constantemente la misma información
            if (data.record_detectado) {
                console.log(`[RecordPollingService] Respuesta recibida: poll=${data.poll_number}, record=${data.record_detectado}`);
            }

            // Solo notificar si hay un cambio (nuevo poll_number) y se detectó un récord
            if (data.poll_number > this.lastPollNumber && data.record_detectado) {
                this.lastPollNumber = data.poll_number;
                this.consecutiveErrors = 0; // Resetear contador de errores

                if (this.onRecordDetected && data.record) {
                    // Verificar que no sea el mismo récord (comparando timestamp o ID)
                    const currentRecordId = data.record.id || data.record.timestamp;
                    if (currentRecordId !== this.lastRecordTimestamp) {
                        this.lastRecordTimestamp = currentRecordId;
                        this.onRecordDetected(data.record);
                    }
                }
            } else {
                // Actualizar el último poll_number aunque no haya récord
                if (data.poll_number > this.lastPollNumber) {
                    this.lastPollNumber = data.poll_number;
                    this.consecutiveErrors = 0;
                }
            }
        } catch (error) {
            this.consecutiveErrors++;

            // No spammear la consola con errores
            if (this.consecutiveErrors % 5 === 0) {
                console.error('[RecordPollingService] Error en el polling de récords:', error);
            }

            // Si hay demasiados errores consecutivos, reducir frecuencia de polling
            if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
                if (this.consecutiveErrors === this.maxConsecutiveErrors) {
                    console.warn(`[RecordPollingService] ${this.consecutiveErrors} errores consecutivos, reduciendo frecuencia de polling`);
                }

                if (this.pollingInterval) {
                    clearInterval(this.pollingInterval);
                    this.pollingInterval = setInterval(() => {
                        this.pollRecords();
                    }, this.pollingDelay * 2); // Duplicar el intervalo
                }
            }
        }
    }

    /**
     * Genera un récord simulado (para desarrollo)
     * @param {number} circuitoId - ID del circuito
     * @returns {Object} Objeto con datos de récord simulados
     * @private
     */
    generateSimulatedRecord(circuitoId) {
        // Lista de nombres de muestra para la simulación
        const nombresPilotos = [
            "Max Verstappen", "Lewis Hamilton", "Charles Leclerc",
            "Lando Norris", "Carlos Sainz", "Fernando Alonso"
        ];

        const pilotoIndex = Math.floor(Math.random() * nombresPilotos.length);
        const tiempo = 80 + (Math.random() * 10); // Tiempo entre 80 y 90 segundos
        const diferencia = 0.1 + (Math.random() * 0.5); // Diferencia entre 0.1 y 0.6 segundos

        return {
            id: Math.floor(Math.random() * 10000),
            circuito_id: parseInt(circuitoId),
            conductor_id: pilotoIndex + 1,
            nombre_piloto: nombresPilotos[pilotoIndex],
            vuelta: Math.floor(Math.random() * 50) + 1,
            tiempo_vuelta: parseFloat(tiempo.toFixed(3)),
            tiempo_anterior: parseFloat((tiempo + diferencia).toFixed(3)),
            diferencia_tiempo: parseFloat(diferencia.toFixed(3)),
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

export default RecordPollingService;