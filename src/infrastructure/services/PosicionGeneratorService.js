/**
 * Servicio para generar posiciones aleatorias para los pilotos
 */
class PosicionGeneratorService {
    constructor(posicionesRepository) {
        this.posicionesRepository = posicionesRepository;
        this.isGenerating = false;
        this.circuitoId = null;
        this.pilotos = [];
        this.timer = null;
        this.intervalMs = 5000; // Generar nuevas posiciones cada 5 segundos
        this.lastPositions = new Map(); // Almacenar las últimas posiciones enviadas
    }

    /**
     * Inicia la generación de posiciones aleatorias
     * @param {number} circuitoId - ID del circuito
     * @param {Array} pilotos - Lista de pilotos participantes
     */
    start(circuitoId, pilotos) {
        if (this.isGenerating) {
            this.stop();
        }

        this.isGenerating = true;
        this.circuitoId = circuitoId;
        this.pilotos = Array.isArray(pilotos) ? pilotos : [];
        this.lastPositions.clear();

        // Generar posiciones iniciales aleatorias
        this.generateRandomPositions();

        // Programar generación periódica
        this.timer = setInterval(() => {
            this.generateRandomPositions();
        }, this.intervalMs);
    }

    /**
     * Detiene la generación de posiciones
     */
    stop() {
        this.isGenerating = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Genera y envía posiciones aleatorias para todos los pilotos
     * @private
     */
    async generateRandomPositions() {
        if (!this.isGenerating || !this.pilotos.length) return;

        // Obtener IDs de los pilotos
        const pilotoIds = this.pilotos.map(piloto => piloto.id);

        // Barajar aleatoriamente los IDs para simular cambios en las posiciones
        const shuffledIds = this.shuffleArray([...pilotoIds]);

        // Asignar posiciones (1-based) y enviar al backend
        for (let i = 0; i < shuffledIds.length; i++) {
            const pilotoId = shuffledIds[i];
            const posicion = i + 1; // Posiciones comienzan en 1

            // Verificar si la posición ha cambiado para enviar solo los cambios
            if (!this.lastPositions.has(pilotoId) || this.lastPositions.get(pilotoId) !== posicion) {
                try {
                    await this.posicionesRepository.actualizarPosicion(
                        this.circuitoId,
                        pilotoId,
                        posicion
                    );

                    // Actualizar la última posición enviada
                    this.lastPositions.set(pilotoId, posicion);
                } catch (error) {
                    console.error(`Error al enviar posición para piloto ${pilotoId}:`, error);
                }
            }
        }
    }

    /**
     * Baraja aleatoriamente un array
     * @param {Array} array - Array a barajar
     * @returns {Array} - Array barajado
     * @private
     */
    shuffleArray(array) {
        // Algoritmo de Fisher-Yates para barajar un array
        let currentIndex = array.length;
        let randomIndex;

        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    /**
     * Verifica si la generación está activa
     * @returns {boolean}
     */
    isActive() {
        return this.isGenerating;
    }
}

export default PosicionGeneratorService;