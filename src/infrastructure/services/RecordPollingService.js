import apiClient from '../api/apiClient';

/**
 * Servicio para gestionar el short polling de récords de vuelta
 */
class RecordPollingService {
    constructor() {
        this.isPolling = false;
        this.circuitoId = null;
        this.pollingInterval = null;
        this.pollingDelay = 3000; // Intervalo de polling en ms (3 segundos)
        this.onRecordDetected = null;
        this.lastPollNumber = 0;
        this.consecutiveErrors = 0;
        this.maxConsecutiveErrors = 3;
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

        // Realizar una consulta inicial
        this.pollRecords();

        // Configurar el intervalo para las siguientes consultas
        this.pollingInterval = setInterval(() => {
            this.pollRecords();
        }, this.pollingDelay);
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
            const response = await apiClient.get(`/circuitos/${this.circuitoId}/records`);
            const data = response.data;

            if (!data) {
                console.warn('[RecordPollingService] No se recibieron datos del servidor');
                this.consecutiveErrors++;
                return;
            }

            console.log(`[RecordPollingService] Respuesta recibida: poll=${data.poll_number}, record=${data.record_detectado}`);

            // Solo notificar si hay un cambio (nuevo poll_number) y se detectó un récord
            if (data.poll_number > this.lastPollNumber && data.record_detectado) {
                this.lastPollNumber = data.poll_number;
                this.consecutiveErrors = 0; // Resetear contador de errores

                if (this.onRecordDetected && data.record) {
                    this.onRecordDetected(data.record);
                }
            } else {
                // Actualizar el último poll_number aunque no haya récord
                if (data.poll_number > this.lastPollNumber) {
                    this.lastPollNumber = data.poll_number;
                    this.consecutiveErrors = 0;
                }
            }
        } catch (error) {
            console.error('[RecordPollingService] Error en el polling de récords:', error);
            this.consecutiveErrors++;

            // Si hay demasiados errores consecutivos, reducir frecuencia de polling
            if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
                console.warn(`[RecordPollingService] ${this.consecutiveErrors} errores consecutivos, reduciendo frecuencia de polling`);
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
     * Verifica si el polling está activo
     * @returns {boolean}
     */
    isActive() {
        return this.isPolling;
    }
}

export default RecordPollingService;