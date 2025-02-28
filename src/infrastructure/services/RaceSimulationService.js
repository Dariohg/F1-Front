/**
 * Servicio para simular una carrera generando tiempos aleatorios para los pilotos
 * Versión simplificada que se basa solo en tiempos de vuelta
 */
class RaceSimulationService {
    constructor(tiempoVueltaRepository) {
        this.tiempoVueltaRepository = tiempoVueltaRepository;
        this.isRunning = false;
        this.circuitoId = null;
        this.pilotos = [];
        this.circuito = null;
        this.timers = new Map(); // Map para almacenar los timers activos por piloto
        this.vueltasPorPiloto = new Map(); // Contador de vueltas por piloto
        this.tiemposPorPiloto = new Map(); // Mejores tiempos por piloto
        this.ultimosTiempos = new Map(); // Últimos tiempos registrados por piloto
        this.posicionesPorPiloto = new Map(); // Posiciones actuales de los pilotos
        this.onNewLapTime = null; // Callback para notificar nuevos tiempos
        this.onPositionsChanged = null; // Callback para notificar cambios en posiciones
        this.onRaceFinished = null; // Callback para notificar fin de carrera
        this.maxRetries = 3; // Número máximo de reintentos en caso de error
        this.retryDelayMs = 1000; // Tiempo entre reintentos (1 segundo)
        this.lastPositionsUpdate = 0; // Último timestamp de actualización de posiciones
        this.positionsUpdateInterval = 1000; // Intervalo para calcular posiciones (ms)
        this.positionsTimer = null; // Timer para actualizaciones periódicas de posiciones
        this.winnerDetermined = false; // Flag para indicar si ya se determinó un ganador
    }

    /**
     * Inicia la simulación de la carrera
     * @param {number} circuitoId - ID del circuito
     * @param {Object} circuito - Datos del circuito
     * @param {Array} pilotos - Lista de pilotos participantes
     * @param {Function} onNewLapTime - Callback para recibir nuevos tiempos
     * @param {Function} onPositionsChanged - Callback para notificar cambios de posición
     * @param {Function} onRaceFinished - Callback para notificar fin de carrera
     */
    start(circuitoId, circuito, pilotos, onNewLapTime, onPositionsChanged, onRaceFinished) {
        if (this.isRunning) {
            this.stop(); // Detener si ya está corriendo
        }

        console.log(`[RaceSimulationService] Iniciando simulación: circuito=${circuitoId}, pilotos=${pilotos.length}`);

        this.isRunning = true;
        this.circuitoId = circuitoId;
        this.circuito = circuito;
        this.pilotos = Array.isArray(pilotos) ? pilotos : [];
        this.onNewLapTime = onNewLapTime;
        this.onPositionsChanged = onPositionsChanged;
        this.onRaceFinished = onRaceFinished;
        this.timers.clear();
        this.vueltasPorPiloto.clear();
        this.tiemposPorPiloto.clear();
        this.ultimosTiempos.clear();
        this.posicionesPorPiloto.clear();
        this.lastPositionsUpdate = 0;
        this.winnerDetermined = false;

        // Validar que tengamos pilotos para simular
        if (this.pilotos.length === 0) {
            console.warn('[RaceSimulationService] No hay pilotos para simular la carrera');
            return;
        }

        // Inicializar contadores y posiciones para cada piloto
        this.pilotos.forEach((piloto, index) => {
            if (piloto && piloto.id) {
                this.vueltasPorPiloto.set(piloto.id, 0); // Empezamos en 0 vueltas
                this.tiemposPorPiloto.set(piloto.id, null);
                this.ultimosTiempos.set(piloto.id, null);
                this.posicionesPorPiloto.set(piloto.id, index + 1); // Posición inicial basada en el orden
            }
        });

        // Reportar las posiciones iniciales
        this.notifyPositionsChanged();

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
            this.calculatePositions();
        }, this.positionsUpdateInterval);
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

        console.log('[RaceSimulationService] Simulación detenida');
    }

    /**
     * Programa la generación del próximo tiempo de vuelta para un piloto
     * @param {number} pilotoId - ID del piloto
     */
    scheduleNextLap(pilotoId) {
        if (!this.isRunning || this.winnerDetermined) return;

        // Si ya se alcanzó el número máximo de vueltas para este piloto, no programar más
        const currentLaps = this.vueltasPorPiloto.get(pilotoId) || 0;
        const maxLaps = this.circuito?.numero_vueltas || 0;

        if (maxLaps > 0 && currentLaps >= maxLaps) {
            // Este piloto ha terminado la carrera
            if (!this.winnerDetermined) {
                this.winnerDetermined = true;

                // Notificar fin de carrera si hay un callback
                if (this.onRaceFinished) {
                    const piloto = this.pilotos.find(p => p.id === pilotoId);
                    this.onRaceFinished({
                        winnerId: pilotoId,
                        winnerName: piloto?.nombre_completo || 'Desconocido',
                        totalLaps: currentLaps,
                        totalPilotos: this.pilotos.length
                    });
                }

                // Detener la simulación
                this.stop();
            }
            return;
        }

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
        if (!this.isRunning || this.winnerDetermined) return;

        try {
            // Incrementar el contador de vueltas para este piloto
            const currentLaps = this.vueltasPorPiloto.get(pilotoId) || 0;
            const nextLap = currentLaps + 1;
            this.vueltasPorPiloto.set(pilotoId, nextLap);

            // Obtener el tiempo promedio del circuito
            const tiempoPromedio = this.circuito?.tiempo_promedio_vuelta || 90;

            // Determinar si el piloto batirá el tiempo promedio (solo 5% de probabilidad)
            const batiraPromedio = Math.random() < 0.05;

            let tiempoFormateado;

            if (batiraPromedio) {
                // Si bate el promedio: generar tiempo entre 98% y 99.9% del tiempo promedio
                const min = tiempoPromedio * 0.98;
                const max = tiempoPromedio * 0.999;
                const tiempo = min + (Math.random() * (max - min));
                tiempoFormateado = parseFloat(tiempo.toFixed(3));
                console.log(`[RaceSimulationService] Piloto ${pilotoId} batió el tiempo promedio: ${tiempoFormateado}s (promedio: ${tiempoPromedio}s)`);
            } else {
                // Si no bate el promedio: generar tiempo entre 100.1% y 110% del tiempo promedio
                const min = tiempoPromedio * 1.001;
                const max = tiempoPromedio * 1.10;
                const tiempo = min + (Math.random() * (max - min));
                tiempoFormateado = parseFloat(tiempo.toFixed(3));
            }

            // Crear objeto de tiempo de vuelta
            const tiempoVuelta = {
                conductor_id: pilotoId,
                numero_vuelta: nextLap,
                tiempo: tiempoFormateado
            };

            // Registrar el tiempo en el backend
            const resultado = await this.tiempoVueltaRepository.registrarTiempo(
                this.circuitoId,
                tiempoVuelta
            );

            // Actualizar el último tiempo para este piloto
            this.ultimosTiempos.set(pilotoId, tiempoFormateado);

            // Actualizar el mejor tiempo para este piloto
            const mejorTiempoActual = this.tiemposPorPiloto.get(pilotoId);
            if (!mejorTiempoActual || tiempoFormateado < mejorTiempoActual) {
                this.tiemposPorPiloto.set(pilotoId, tiempoFormateado);
            }

            // Notificar a través del callback
            if (this.onNewLapTime && resultado) {
                this.onNewLapTime(resultado);
            }

            // Verificar si necesitamos recalcular posiciones
            this.calculatePositions();

            // Verificar si el piloto ha terminado la carrera
            const maxLaps = this.circuito?.numero_vueltas || 0;
            if (maxLaps > 0 && nextLap >= maxLaps) {
                // Este piloto ha terminado la carrera
                if (!this.winnerDetermined) {
                    this.winnerDetermined = true;

                    // Notificar fin de carrera si hay un callback
                    if (this.onRaceFinished) {
                        const piloto = this.pilotos.find(p => p.id === pilotoId);
                        this.onRaceFinished({
                            winnerId: pilotoId,
                            winnerName: piloto?.nombre_completo || 'Desconocido',
                            totalLaps: nextLap,
                            totalPilotos: this.pilotos.length
                        });
                    }

                    // Detener la simulación
                    this.stop();
                    return;
                }
            }

            // Si no ha terminado, programar la próxima vuelta
            this.scheduleNextLap(pilotoId);
        } catch (error) {
            console.error(`[RaceSimulationService] Error al generar tiempo para piloto ${pilotoId}:`, error);

            // Implementar lógica de reintento si no hemos excedido el máximo de reintentos
            if (retryCount < this.maxRetries && this.isRunning && !this.winnerDetermined) {
                setTimeout(() => {
                    this.generateLapTime(pilotoId, retryCount + 1);
                }, this.retryDelayMs * (retryCount + 1)); // Incrementar el tiempo entre reintentos
            } else {
                // Si fallaron todos los reintentos, programar la próxima vuelta de todos modos
                if (this.isRunning && !this.winnerDetermined) {
                    setTimeout(() => this.scheduleNextLap(pilotoId), this.retryDelayMs * 2);
                }
            }
        }
    }

    /**
     * Calcula las posiciones actuales de los pilotos
     */
    calculatePositions() {
        if (!this.isRunning) return;

        // No actualizar posiciones con mucha frecuencia
        const now = Date.now();
        if (now - this.lastPositionsUpdate < 500) {
            return;
        }
        this.lastPositionsUpdate = now;

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
                    posicion: index + 1,
                    vueltas: item.vueltas,
                    mejorTiempo: item.mejorTiempo
                }));

            // Verificar si las posiciones han cambiado
            let posicionesChanged = false;
            posicionesCalculadas.forEach(pos => {
                const currentPos = this.posicionesPorPiloto.get(pos.pilotoId);
                if (currentPos !== pos.posicion) {
                    this.posicionesPorPiloto.set(pos.pilotoId, pos.posicion);
                    posicionesChanged = true;
                }
            });

            // Notificar cambios si es necesario
            if (posicionesChanged) {
                this.notifyPositionsChanged();
            }
        } catch (error) {
            console.error('[RaceSimulationService] Error al calcular posiciones:', error);
        }
    }

    /**
     * Notifica a la UI los cambios en las posiciones
     */
    notifyPositionsChanged() {
        if (!this.onPositionsChanged) return;

        // Crear array de posiciones actuales
        const posiciones = [];

        this.pilotos.forEach(piloto => {
            if (piloto && piloto.id) {
                const pos = this.posicionesPorPiloto.get(piloto.id) || 0;
                const vueltas = this.vueltasPorPiloto.get(piloto.id) || 0;
                const mejorTiempo = this.tiemposPorPiloto.get(piloto.id) || 0;
                const ultimoTiempo = this.ultimosTiempos.get(piloto.id) || 0;

                posiciones.push({
                    id: piloto.id,
                    nombre: piloto.nombre_completo,
                    equipo: piloto.nombre_equipo,
                    numero: piloto.numero_carro,
                    posicion: pos,
                    vueltas: vueltas,
                    mejorTiempo: mejorTiempo,
                    ultimoTiempo: ultimoTiempo,
                    _update: Date.now() // Para forzar actualización en el UI
                });
            }
        });

        // Ordenar por posición
        posiciones.sort((a, b) => a.posicion - b.posicion);

        // Notificar
        this.onPositionsChanged(posiciones);
    }

    /**
     * Verifica si la simulación está en ejecución
     * @returns {boolean}
     */
    isSimulationRunning() {
        return this.isRunning;
    }
}

export default RaceSimulationService;