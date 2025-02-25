
/**
 * Servicio para gestionar el short polling de posiciones de pilotos
 */
class PosicionesPollingService {
    constructor(posicionesRepository) {
        this.posicionesRepository = posicionesRepository;
        this.isPolling = false;
        this.circuitoId = null;
        this.pollingInterval = null;
        this.pollingDelay = 2000; // Intervalo de polling en ms (2 segundos)
        this.onPosicionesUpdate = null;
        this.lastPollNumber = 0;
    }

    /**
     * Inicia el short polling de posiciones
     * @param {number} circuitoId - ID del circuito
     * @param {Function} onPosicionesUpdate - Callback para recibir actualizaciones
     */
    startPolling(circuitoId, onPosicionesUpdate) {
        if (this.isPolling) {
            this.stopPolling();
        }

        this.isPolling = true;
        this.circuitoId = circuitoId;
        this.onPosicionesUpdate = onPosicionesUpdate;
        this.lastPollNumber = 0;

        // Realizar una consulta inicial
        this.pollPosiciones();

        // Configurar el intervalo para las siguientes consultas
        this.pollingInterval = setInterval(() => {
            this.pollPosiciones();
        }, this.pollingDelay);
    }

    /**
     * Detiene el short polling
     */
    stopPolling() {
        this.isPolling = false;
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /**
     * Realiza una consulta de posiciones
     * @private
     */
    async pollPosiciones() {
        if (!this.isPolling || !this.circuitoId) return;

        try {
            const data = await this.posicionesRepository.obtenerPosiciones(this.circuitoId);

            // Solo notificar si hay un cambio (nuevo poll_number)
            if (data && data.poll_number > this.lastPollNumber) {
                this.lastPollNumber = data.poll_number;

                if (this.onPosicionesUpdate) {
                    this.onPosicionesUpdate(data);
                }
            }
        } catch (error) {
            console.error('Error en el polling de posiciones:', error);
            // No detener el polling por errores, simplemente continuar en el siguiente intervalo
        }
    }

    /**
     * Envía una actualización de posición
     * @param {number} conductorId - ID del piloto
     * @param {number} posicion - Posición (1-based)
     * @returns {Promise<any>}
     */
    async enviarPosicion(conductorId, posicion) {
        if (!this.circuitoId) {
            throw new Error('No hay un circuito activo para enviar posiciones');
        }

        try {
            return await this.posicionesRepository.actualizarPosicion(
                this.circuitoId,
                conductorId,
                posicion
            );
        } catch (error) {
            console.error('Error al enviar posición:', error);
            throw error;
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

// Exportamos la clase para crear instancias específicas en los componentes
export default PosicionesPollingService;