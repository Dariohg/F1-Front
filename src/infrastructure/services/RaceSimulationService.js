/**
 * Servicio para simular una carrera generando tiempos aleatorios para los pilotos
 */
class RaceSimulationService {
    constructor(tiempoVueltaRepository, posicionesRepository) {
        this.tiempoVueltaRepository = tiempoVueltaRepository;
        this.posicionesRepository = posicionesRepository;
        this.isRunning = false;
        this.circuitoId = null;
        this.pilotos = [];
        this.timers = new Map(); // Map para almacenar los timers activos por piloto
        this.vueltasPorPiloto = new Map(); // Contador de vueltas por piloto
        this.tiemposPorPiloto = new Map(); // Mejores tiempos por piloto
        this.onNewLapTime = null; // Callback para notificar nuevos tiempos
        this.maxRetries = 3; // Número máximo de reintentos en caso de error
        this.retryDelayMs = 1000; // Tiempo entre reintentos (1 segundo)
        this.lastPositionsUpdate = 0; // Último timestamp de actualización de posiciones
        this.lastPositions = []; // Últimas posiciones calculadas
    }

    /**
     * Inicia la simulación de la carrera
     * @param {number} circuitoId - ID del circuito
     * @param {Array} pilotos - Lista de pilotos participantes
     * @param {Function} onNewLapTime - Callback para recibir nuevos tiempos
     */
    start(circuitoId, pilotos, onNewLapTime) {
        if (this.isRunning) {
            this.stop(); // Detener si ya está corriendo
        }

        this.isRunning = true;
        this.circuitoId = circuitoId;
        this.pilotos = Array.isArray(pilotos) ? pilotos : [];
        this.onNewLapTime = onNewLapTime;
        this.timers.clear();
        this.vueltasPorPiloto.clear();
        this.tiemposPorPiloto.clear();
        this.lastPositions = [];

        // Validar que tengamos pilotos para simular
        if (this.pilotos.length === 0) {
            console.warn('No hay pilotos para simular la carrera');
            return;
        }

        // Inicializar contador de vueltas para cada piloto
        this.pilotos.forEach(piloto => {
            if (piloto && piloto.id) {
                this.vueltasPorPiloto.set(piloto.id, 1);
                this.tiemposPorPiloto.set(piloto.id, null);
            }
        });

        // Generar tiempos iniciales para todos los pilotos (escalonados)
        this.pilotos.forEach((piloto, index) => {
            if (piloto && piloto.id) {
                // Escalonar el inicio de cada piloto para que no empiecen todos al mismo tiempo
                setTimeout(() => {
                    this.scheduleNextLap(piloto.id);
                }, index * 1000); // 1 segundo entre cada piloto
            }
        });

        // Programar actualizaciones periódicas de posiciones
        this.positionsTimer = setInterval(() => {
            this.updatePositions();
        }, 5000); // Actualizar posiciones cada 5 segundos
    }

    /**
     * Detiene la simulación de la carrera
     */
    stop() {
        this.isRunning = false;
        // Limpiar todos los timers
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();

        // Limpiar timer de posiciones
        if (this.positionsTimer) {
            clearInterval(this.positionsTimer);
            this.positionsTimer = null;
        }
    }

    /**
     * Programa la generación del próximo tiempo de vuelta para un piloto
     * @param {number} pilotoId - ID del piloto
     */
    scheduleNextLap(pilotoId) {
        if (!this.isRunning) return;

        // Generar un tiempo aleatorio para completar la vuelta (entre 3 y 8 segundos)
        const lapDuration = Math.floor(Math.random() * 5000) + 3000;

        // Crear un timer para este piloto
        const timerId = setTimeout(() => {
            this.generateLapTime(pilotoId);
        }, lapDuration);

        // Almacenar el timer para poder cancelarlo si es necesario
        this.timers.set(pilotoId, timerId);
    }

    /**
     * Genera y registra un nuevo tiempo de vuelta para un piloto
     * @param {number} pilotoId - ID del piloto
     * @param {number} retryCount - Contador de reintentos (interno)
     */
    async generateLapTime(pilotoId, retryCount = 0) {
        if (!this.isRunning) return;

        try {
            // Obtener el número de vuelta actual para este piloto
            const numeroVuelta = this.vueltasPorPiloto.get(pilotoId);

            // Generar un tiempo de vuelta aleatorio (entre 75 y 120 segundos)
            const tiempo = 75 + (Math.random() * 45);
            const tiempoFormateado = parseFloat(tiempo.toFixed(3));

            // Crear objeto de tiempo de vuelta
            const tiempoVuelta = {
                conductor_id: pilotoId,
                numero_vuelta: numeroVuelta,
                tiempo: tiempoFormateado
            };

            // Registrar el tiempo en el backend
            const resultado = await this.tiempoVueltaRepository.registrarTiempo(
                this.circuitoId,
                tiempoVuelta
            );

            // Actualizar el mejor tiempo para este piloto
            const mejorTiempoActual = this.tiemposPorPiloto.get(pilotoId);
            if (!mejorTiempoActual || tiempoFormateado < mejorTiempoActual) {
                this.tiemposPorPiloto.set(pilotoId, tiempoFormateado);
            }

            // Incrementar el contador de vueltas para este piloto
            this.vueltasPorPiloto.set(pilotoId, numeroVuelta + 1);

            // Notificar a través del callback
            if (this.onNewLapTime && resultado) {
                this.onNewLapTime(resultado);
            }

            // Calcular y enviar posiciones al backend después de cada tiempo
            const shouldUpdatePositions = Date.now() - this.lastPositionsUpdate > 5000;
            if (shouldUpdatePositions) {
                this.updatePositions();
            }

            // Programar la próxima vuelta
            this.scheduleNextLap(pilotoId);
        } catch (error) {
            console.error(`Error al generar tiempo para piloto ${pilotoId}:`, error);

            // Implementar lógica de reintento si no hemos excedido el máximo de reintentos
            if (retryCount < this.maxRetries && this.isRunning) {
                console.log(`Reintentando para piloto ${pilotoId}, intento ${retryCount + 1} de ${this.maxRetries}`);
                setTimeout(() => {
                    this.generateLapTime(pilotoId, retryCount + 1);
                }, this.retryDelayMs * (retryCount + 1)); // Incrementar el tiempo entre reintentos
            } else {
                // Si fallaron todos los reintentos, programar la próxima vuelta de todos modos
                if (this.isRunning) {
                    console.log(`Se agotaron los reintentos para piloto ${pilotoId}, programando siguiente vuelta`);

                    // Incrementar el contador de vueltas para este piloto a pesar del error
                    const numeroVuelta = this.vueltasPorPiloto.get(pilotoId);
                    this.vueltasPorPiloto.set(pilotoId, numeroVuelta + 1);

                    // Programar con un retraso adicional
                    setTimeout(() => this.scheduleNextLap(pilotoId), this.retryDelayMs * 2);
                }
            }
        }
    }

    /**
     * Calcula y envía las posiciones actuales al backend
     */
    async updatePositions() {
        if (!this.isRunning) return;

        try {
            // Calcular posiciones en base a vueltas y tiempos
            const posicionesCalculadas = this.pilotos
                .filter(piloto => piloto && piloto.id)
                .map(piloto => {
                    const pilotoId = piloto.id;
                    const vueltas = this.vueltasPorPiloto.get(pilotoId) || 0;
                    const mejorTiempo = this.tiemposPorPiloto.get(pilotoId) || 999999;

                    return {
                        pilotoId,
                        vueltas,
                        mejorTiempo
                    };
                })
                // Ordenar por número de vueltas (descendente) y mejor tiempo (ascendente)
                .sort((a, b) => {
                    if (b.vueltas !== a.vueltas) {
                        return b.vueltas - a.vueltas; // Más vueltas = mejor posición
                    }
                    // Si tienen las mismas vueltas, gana el que tiene mejor tiempo
                    return a.mejorTiempo - b.mejorTiempo;
                })
                // Asignar posiciones
                .map((item, index) => ({
                    pilotoId: item.pilotoId,
                    posicion: index + 1
                }));

            console.log('Posiciones calculadas:', posicionesCalculadas);

            // Verificar si las posiciones han cambiado desde la última actualización
            const posicionesChanged = !this.arrayEquals(
                posicionesCalculadas,
                this.lastPositions,
                (a, b) => a.pilotoId === b.pilotoId && a.posicion === b.posicion
            );

            if (posicionesChanged) {
                // Enviar cada posición al backend individualmente
                for (const pos of posicionesCalculadas) {
                    await this.posicionesRepository.actualizarPosicion(
                        this.circuitoId,
                        pos.pilotoId,
                        pos.posicion
                    );

                    // Pequeña pausa para no sobrecargar el backend
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                // Actualizar estado
                this.lastPositions = posicionesCalculadas;
                this.lastPositionsUpdate = Date.now();
                console.log('Posiciones actualizadas en el backend');
            }
        } catch (error) {
            console.error('Error al actualizar posiciones:', error);
        }
    }

    /**
     * Compara dos arrays usando una función personalizada
     * @private
     */
    arrayEquals(arr1, arr2, compareFunc) {
        if (arr1.length !== arr2.length) return false;

        for (let i = 0; i < arr1.length; i++) {
            if (!compareFunc(arr1[i], arr2[i])) return false;
        }

        return true;
    }

    /**
     * Verifica si la simulación está en ejecución
     * @returns {boolean}
     */
    isSimulationRunning() {
        return this.isRunning;
    }
}

// Exportamos la clase para crear instancias específicas en los componentes
export default RaceSimulationService;