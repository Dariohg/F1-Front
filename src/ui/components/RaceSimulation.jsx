// src/ui/components/RaceSimulation.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Button, Typography, Card, Space, Tag, Tooltip, Badge, Alert, Empty, Modal, notification } from 'antd';
import {
    CarOutlined, TrophyOutlined, ClockCircleOutlined, PauseCircleOutlined,
    PlayCircleOutlined, SyncOutlined, InfoCircleOutlined, CheckCircleOutlined,
    FireOutlined, WarningOutlined
} from '@ant-design/icons';
import PropTypes from 'prop-types';
import RaceSimulationService from '../../infrastructure/services/RaceSimulationService';
import tiempoVueltaRepository from '../../infrastructure/repositories/TiempoVueltaRepository';
import IncidentePollingService from '../../infrastructure/services/IncidentePollingService';
import IncidenteAlert from './IncidenteAlert';

const { Title, Text } = Typography;

/**
 * Componente para la simulación de una carrera en tiempo real
 * Optimizado para rendimiento y actualización consistente
 * Con detección de récords e incidentes en tiempo real
 */
const RaceSimulation = ({ circuito = null, pilotos = [] }) => {
    // Estado para almacenar datos de la carrera
    const [tiemposVuelta, setTiemposVuelta] = useState([]);
    const [posiciones, setPosiciones] = useState([]);
    const [simulationActive, setSimulationActive] = useState(false);
    const [loadingTiempos, setLoadingTiempos] = useState(true);
    const [tiemposCount, setTiemposCount] = useState(0);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState("Esperando iniciar simulación");
    const [forceRender, setForceRender] = useState(0); // Estado para forzar renderizado
    const [winner, setWinner] = useState(null); // Estado para almacenar el ganador
    const [showWinnerModal, setShowWinnerModal] = useState(false); // Estado para mostrar el modal del ganador

    // Estados para la detección de récords
    const [mejorTiempoGlobal, setMejorTiempoGlobal] = useState(null);
    const [mejoresTiemposPorPiloto, setMejoresTiemposPorPiloto] = useState({});
    const recordsNotificadosRef = useRef(new Set());

    // Estados para incidentes
    // Eliminamos la variable 'incidentes' no utilizada
    const [incidenteActivo, setIncidenteActivo] = useState(null);

    // Referencias para mantener el estado actualizado en callbacks
    const posicionesRef = useRef(posiciones);
    const circuitoRef = useRef(circuito);
    const pilotosRef = useRef(pilotos);
    const tiemposVueltaRef = useRef(tiemposVuelta);
    const simulationActiveRef = useRef(simulationActive);

    // Actualizar referencias cuando cambien los props/estado
    useEffect(() => {
        posicionesRef.current = posiciones;
        circuitoRef.current = circuito;
        pilotosRef.current = pilotos;
        tiemposVueltaRef.current = tiemposVuelta;
        simulationActiveRef.current = simulationActive;
    }, [posiciones, circuito, pilotos, tiemposVuelta, simulationActive]);

    // Crear servicios
    const raceService = useRef(new RaceSimulationService(tiempoVueltaRepository)).current;
    const incidenteService = useRef(new IncidentePollingService()).current;

    // Declarar detenerSimulacion antes de usarlo en handleIncidenteDetected
    // Usaremos una referencia para resolver la dependencia circular
    const detenerSimulacionRef = useRef(null);

    /**
     * Carga los tiempos de vuelta existentes desde el repositorio
     */
    const cargarTiempos = useCallback(async () => {
        if (!circuito?.id) {
            setStatusMessage("No se ha seleccionado un circuito válido");
            setLoadingTiempos(false);
            return;
        }

        setLoadingTiempos(true);
        setStatusMessage("Cargando tiempos existentes...");

        try {
            const tiempos = await tiempoVueltaRepository.obtenerTiemposPorCircuito(circuito.id);
            console.log("[RaceSimulation] Tiempos cargados:", tiempos);

            // Asegurarse de que siempre sea un array, incluso si la API devuelve null/undefined
            const tiemposArray = Array.isArray(tiempos) ? tiempos : [];
            setTiemposVuelta(tiemposArray);
            setTiemposCount(tiemposArray.length);
            setStatusMessage(`${tiemposArray.length} tiempos cargados. Listo para iniciar simulación.`);
            setError(null);

            // Procesar tiempos existentes para encontrar el mejor tiempo global
            procesarTiemposParaRecords(tiemposArray);
        } catch (error) {
            console.error('[RaceSimulation] Error al cargar tiempos:', error);
            setTiemposVuelta([]);
            setTiemposCount(0);
            setStatusMessage("Error al cargar tiempos. Intente nuevamente.");
            setError("No se pudieron cargar los tiempos de vuelta. La API podría no estar disponible.");
        } finally {
            setLoadingTiempos(false);
        }
    }, [circuito?.id]);

    /**
     * Procesa los tiempos cargados para encontrar récords existentes
     */
    const procesarTiemposParaRecords = useCallback((tiempos) => {
        if (!tiempos || !tiempos.length) return;

        let mejorTiempoTemp = null;
        const mejoresTiemposTemp = {};

        // Procesar todos los tiempos para encontrar el mejor global y por piloto
        tiempos.forEach(tiempo => {
            const pilotoId = tiempo.conductor_id;
            const tiempoValor = parseFloat(tiempo.tiempo);

            // Actualizar mejor tiempo global
            if (mejorTiempoTemp === null || tiempoValor < mejorTiempoTemp) {
                mejorTiempoTemp = tiempoValor;
            }

            // Actualizar mejor tiempo por piloto
            if (!mejoresTiemposTemp[pilotoId] || tiempoValor < mejoresTiemposTemp[pilotoId]) {
                mejoresTiemposTemp[pilotoId] = tiempoValor;
            }
        });

        // Actualizar el estado con los mejores tiempos encontrados
        setMejorTiempoGlobal(mejorTiempoTemp);
        setMejoresTiemposPorPiloto(mejoresTiemposTemp);

        console.log("[RaceSimulation] Récords iniciales cargados:", {
            mejorTiempoGlobal: mejorTiempoTemp,
            mejoresTiemposPorPiloto: mejoresTiemposTemp
        });
    }, []);

    /**
     * Inicializa las posiciones de los pilotos
     */
    const inicializarPosiciones = useCallback(() => {
        if (pilotosRef.current && pilotosRef.current.length > 0) {
            console.log("[RaceSimulation] Inicializando posiciones para", pilotosRef.current.length, "pilotos");

            // Crear posiciones iniciales en el orden de la lista de pilotos
            const posicionesIniciales = pilotosRef.current.map((piloto, index) => ({
                id: piloto.id,
                nombre: piloto.nombre_completo || 'Desconocido',
                equipo: piloto.nombre_equipo || 'Desconocido',
                numero: piloto.numero_carro || 0,
                posicion: index + 1,
                vueltas: 0,
                mejorTiempo: 0,
                ultimoTiempo: 0,
                finalizado: false,
                _freshUpdate: new Date().getTime() // Forzar "frescura" para evitar problemas de memo
            }));

            // Usar una función de actualización para garantizar consistencia
            setPosiciones(prevPositions => {
                // Solo actualizar si no hay posiciones o si hay cambios
                if (prevPositions.length === 0 ||
                    JSON.stringify(prevPositions) !== JSON.stringify(posicionesIniciales)) {
                    return posicionesIniciales;
                }
                return prevPositions;
            });

            // Forzar renderizado
            setForceRender(prev => prev + 1);
        }
    }, []);

    /**
     * Verifica si el tiempo dado representa un récord y notifica si es necesario
     */
    const verificarRecord = useCallback((tiempo) => {
        if (!tiempo || !circuito) return false;

        const pilotoId = tiempo.conductor_id;
        const tiempoValor = parseFloat(tiempo.tiempo);
        const tiempoPromedioCircuito = circuito.tiempo_promedio_vuelta;

        // Solo considerar como posible récord si está por debajo del promedio del circuito
        if (tiempoValor >= tiempoPromedioCircuito) return false;

        // Encontrar datos del piloto
        const piloto = pilotos.find(p => p.id === pilotoId);
        if (!piloto) return false;

        // Generar un ID único para este récord
        const recordId = `${pilotoId}_${tiempo.numero_vuelta}_${tiempoValor}`;

        // Verificar si este récord ya fue notificado
        if (recordsNotificadosRef.current.has(recordId)) return false;

        // Marcar este récord como notificado
        recordsNotificadosRef.current.add(recordId);

        // Verificar si es un récord global
        let isGlobalRecord = false;
        let diferencia = 0;

        if (!mejorTiempoGlobal || tiempoValor < mejorTiempoGlobal) {
            // Calcular diferencia con el récord anterior
            diferencia = mejorTiempoGlobal ? (mejorTiempoGlobal - tiempoValor) : 0;

            // Actualizar mejor tiempo global
            setMejorTiempoGlobal(tiempoValor);
            isGlobalRecord = mejorTiempoGlobal !== null;

            // Mostrar notificación de récord global
            notification.success({
                message: '¡RÉCORD DE PISTA!',
                description: `${piloto.nombre_completo} ha establecido un nuevo récord con ${tiempoValor.toFixed(3)}s${
                    diferencia > 0 ? ` (${diferencia.toFixed(3)}s más rápido)` : ''
                }`,
                placement: 'topRight',
                duration: 6,
                icon: <FireOutlined style={{ color: '#ff4d4f' }} />
            });

            console.log(`[RaceSimulation] ¡RÉCORD GLOBAL DETECTADO! Piloto: ${piloto.nombre_completo}, Tiempo: ${tiempoValor.toFixed(3)}s`);
            return true;
        }

        // Verificar si es un récord personal
        const mejorTiempoPiloto = mejoresTiemposPorPiloto[pilotoId];

        if (!mejorTiempoPiloto || tiempoValor < mejorTiempoPiloto) {
            // Calcular diferencia con el mejor tiempo anterior de este piloto
            diferencia = mejorTiempoPiloto ? (mejorTiempoPiloto - tiempoValor) : 0;

            // Actualizar mejor tiempo del piloto
            setMejoresTiemposPorPiloto(prev => ({
                ...prev,
                [pilotoId]: tiempoValor
            }));

            // Si no es su primer tiempo registrado, notificar récord personal
            if (mejorTiempoPiloto) {
                notification.success({
                    message: '¡Mejor tiempo personal!',
                    description: `${piloto.nombre_completo} ha mejorado su tiempo en ${diferencia.toFixed(3)}s (${tiempoValor.toFixed(3)}s)`,
                    placement: 'topRight',
                    duration: 5,
                    icon: <FireOutlined style={{ color: '#faad14' }} />
                });

                console.log(`[RaceSimulation] ¡RÉCORD PERSONAL DETECTADO! Piloto: ${piloto.nombre_completo}, Tiempo: ${tiempoValor.toFixed(3)}s`);
                return true;
            }
        }

        return false;
    }, [circuito, pilotos, mejorTiempoGlobal, mejoresTiemposPorPiloto]);

    /**
     * Detiene la simulación de carrera
     */
    const detenerSimulacion = useCallback(() => {
        setStatusMessage("Deteniendo simulación...");

        try {
            raceService.stop();
            incidenteService.stopPolling(); // Detener servicio de incidentes
            setSimulationActive(false);
            setStatusMessage(incidenteActivo
                ? `Simulación detenida por incidente: ${incidenteActivo.tipo_incidente}`
                : "Simulación detenida");
        } catch (error) {
            console.error("[RaceSimulation] Error al detener simulación:", error);
            setError("Error al detener la simulación");
            setStatusMessage("Error al detener simulación");
        }
    }, [raceService, incidenteService, incidenteActivo]);

    // Asignar a la referencia una vez que la función está definida
    detenerSimulacionRef.current = detenerSimulacion;

    /**
     * Maneja la detección de un nuevo incidente
     */
    const handleIncidenteDetected = useCallback((incidente) => {
        console.log("[RaceSimulation] Incidente detectado:", incidente);

        // Añadir como incidente activo
        setIncidenteActivo(incidente);

        // Mostrar notificación
        notification.error({
            message: `¡${incidente.tipo_incidente.replace(/_/g, ' ')}!`,
            description: incidente.descripcion,
            placement: 'topRight',
            duration: 0, // No desaparece automáticamente
            icon: <WarningOutlined style={{ color: '#ff4d4f' }} />
        });

        // Detener la simulación si está activa
        if (simulationActiveRef.current && detenerSimulacionRef.current) {
            detenerSimulacionRef.current();
        }
    }, []);

    /**
     * Maneja la limpieza de un incidente
     */
    const handleClearIncidente = useCallback(() => {
        setIncidenteActivo(null);
    }, []);

    /**
     * Maneja la recepción de un nuevo tiempo de vuelta
     */
    const handleNewLapTime = useCallback((nuevoTiempo) => {
        if (!nuevoTiempo) return;

        console.log("[RaceSimulation] Nuevo tiempo recibido:", nuevoTiempo);

        // Actualizar el estado de tiempos de vuelta (usando función para garantizar consistencia)
        setTiemposVuelta(prevTiempos => [...prevTiempos, nuevoTiempo]);
        setTiemposCount(prev => prev + 1);
        setStatusMessage(`Nuevo tiempo registrado para piloto ${nuevoTiempo.conductor_id}`);
        setLoadingTiempos(false);
        setError(null);
        setLastUpdate(new Date());

        // Verificar si este tiempo representa un récord
        verificarRecord(nuevoTiempo);

        // Forzar actualización para reflejar cambios
        setForceRender(prev => prev + 1);
    }, [verificarRecord]);

    /**
     * Maneja la actualización de posiciones desde el servicio
     */
    const handlePositionsChanged = useCallback((nuevasPosiciones) => {
        if (!nuevasPosiciones || !Array.isArray(nuevasPosiciones) || nuevasPosiciones.length === 0) return;

        // Usar función de actualización para garantizar consistencia
        setPosiciones(prevPosiciones => {
            // Verificar si hay cambios reales antes de actualizar
            const hasChanges = !prevPosiciones.every((prev, index) => {
                const nuevo = nuevasPosiciones[index];
                return nuevo &&
                    prev.id === nuevo.id &&
                    prev.posicion === nuevo.posicion &&
                    prev.vueltas === nuevo.vueltas;
            });

            // Solo actualizar si hay cambios
            if (hasChanges || prevPosiciones.length !== nuevasPosiciones.length) {
                console.log("[RaceSimulation] Posiciones actualizadas:", nuevasPosiciones);
                return [...nuevasPosiciones]; // Crear nueva referencia para forzar renderizado
            }
            return prevPosiciones;
        });

        setLastUpdate(new Date());
        setForceRender(prev => prev + 1); // Ayuda a forzar renderizados en componentes memoizados
    }, []);

    /**
     * Maneja el fin de la carrera
     */
    const handleRaceFinished = useCallback((raceResult) => {
        console.log("[RaceSimulation] Carrera finalizada:", raceResult);
        setWinner(raceResult);
        setShowWinnerModal(true);
        setSimulationActive(false);
        setStatusMessage(`Carrera finalizada. Ganador: ${raceResult.winnerName}`);

        // Detener servicio de incidentes
        incidenteService.stopPolling();
    }, [incidenteService]);

    /**
     * Inicia la simulación de carrera
     */
    const iniciarSimulacion = useCallback(() => {
        if (!circuitoRef.current?.id) {
            setError("No se ha seleccionado un circuito válido");
            return;
        }

        if (!pilotosRef.current?.length) {
            setError("No hay pilotos registrados para este circuito");
            return;
        }

        // Si hay un incidente activo, no permitir iniciar
        if (incidenteActivo) {
            notification.warning({
                message: 'No se puede iniciar la simulación',
                description: 'Hay un incidente activo en la pista. Debe ser resuelto antes de continuar.',
                placement: 'topRight',
                duration: 5
            });
            return;
        }

        setStatusMessage("Iniciando simulación...");
        console.log("[RaceSimulation] Iniciando simulación para circuito:",
            circuitoRef.current.id, "con pilotos:", pilotosRef.current);

        try {
            // Limpiar estado anterior
            setWinner(null);
            recordsNotificadosRef.current.clear();

            // Inicializar posiciones
            inicializarPosiciones();

            // Iniciar polling de incidentes
            incidenteService.startPolling(circuitoRef.current.id, handleIncidenteDetected);

            // Iniciar simulación con los callbacks
            raceService.start(
                circuitoRef.current.id,
                circuitoRef.current,
                pilotosRef.current,
                handleNewLapTime,
                handlePositionsChanged,
                handleRaceFinished
            );

            setSimulationActive(true);
            setError(null);
            setStatusMessage("Simulación iniciada correctamente");
        } catch (error) {
            console.error("[RaceSimulation] Error al iniciar simulación:", error);
            setError("Error al iniciar la simulación. Verifique la consola para más detalles.");
            setStatusMessage("Error al iniciar simulación");

            // Detener servicios en caso de error
            incidenteService.stopPolling();
        }
    }, [
        raceService,
        incidenteService,
        handleNewLapTime,
        handlePositionsChanged,
        handleRaceFinished,
        handleIncidenteDetected,
        inicializarPosiciones,
        incidenteActivo
    ]);

    // Cargar datos iniciales y configurar cleanup
    useEffect(() => {
        cargarTiempos();
        inicializarPosiciones();

        // Limpiar al desmontar
        return () => {
            console.log("[RaceSimulation] Limpiando servicios...");
            raceService.stop();
            incidenteService.stopPolling();
        };
    }, [cargarTiempos, inicializarPosiciones, raceService, incidenteService]);

    // Efecto adicional para inicializar posiciones cuando los pilotos cambian
    useEffect(() => {
        // Solo inicializar si hay pilotos nuevos y no hay posiciones actuales
        if (pilotos.length > 0 && posiciones.length === 0) {
            inicializarPosiciones();
        }
    }, [pilotos, posiciones.length, inicializarPosiciones]);

    // Columnas para la tabla de pilotos
    const columns = [
        {
            title: 'Pos',
            dataIndex: 'posicion',
            key: 'posicion',
            width: 60,
            render: (pos) => (
                <Text strong>
                    {pos === 1 ? <TrophyOutlined style={{ color: 'gold' }} /> : pos}
                </Text>
            ),
        },
        {
            title: 'Piloto',
            dataIndex: 'nombre',
            key: 'nombre',
            render: (nombre, record) => (
                <Space>
                    <Tag color="blue">{record.numero}</Tag>
                    <Text strong>{nombre}</Text>
                </Space>
            ),
        },
        {
            title: 'Equipo',
            dataIndex: 'equipo',
            key: 'equipo',
        },
        {
            title: 'Vueltas',
            dataIndex: 'vueltas',
            key: 'vueltas',
            width: 100,
            render: (vueltas, record) => {
                // Destacar las vueltas cuando el piloto es el ganador
                const isWinner = winner && winner.winnerId === record.id;
                return (
                    <Tag color={isWinner ? "gold" : "green"}>
                        {vueltas} {isWinner && <CheckCircleOutlined />}
                    </Tag>
                );
            },
        },
        {
            title: 'Mejor Tiempo',
            dataIndex: 'mejorTiempo',
            key: 'mejorTiempo',
            width: 150,
            render: (tiempo, record) => {
                // Destacar si este piloto tiene el mejor tiempo global
                const esMejorTiempoGlobal = mejorTiempoGlobal &&
                    parseFloat(tiempo) > 0 &&
                    parseFloat(tiempo) === mejorTiempoGlobal;

                return tiempo ? (
                    <Tag color={esMejorTiempoGlobal ? "purple" : "green"}>
                        {parseFloat(tiempo).toFixed(3)}s
                        {esMejorTiempoGlobal && <FireOutlined style={{ marginLeft: 5 }} />}
                    </Tag>
                ) : '-';
            },
        },
        {
            title: 'Último Tiempo',
            dataIndex: 'ultimoTiempo',
            key: 'ultimoTiempo',
            width: 150,
            render: (tiempo) => tiempo ? `${parseFloat(tiempo).toFixed(3)}s` : '-',
        },
    ];

    // Renderizado condicional según el estado
    const renderContent = () => {
        if (loadingTiempos && posiciones.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <SyncOutlined spin style={{ fontSize: 24 }} />
                    <p style={{ marginTop: 16 }}>Cargando datos de la carrera...</p>
                </div>
            );
        }

        if (posiciones.length === 0) {
            return (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No hay datos de posiciones disponibles"
                >
                    <Button
                        type="primary"
                        onClick={iniciarSimulacion}
                        disabled={simulationActive || !!incidenteActivo}
                    >
                        Iniciar simulación
                    </Button>
                </Empty>
            );
        }

        // Usar la propiedad de clave para forzar un re-renderizado completo
        return (
            <Table
                dataSource={posiciones}
                columns={columns}
                rowKey={record => `${record.id}_${forceRender}`}
                loading={loadingTiempos && posiciones.length === 0}
                pagination={false}
                size="middle"
            />
        );
    };

    // Modal para mostrar al ganador
    const winnerModal = (
        <Modal
            title={<Space><TrophyOutlined style={{ color: 'gold' }} /> ¡Tenemos un ganador!</Space>}
            open={showWinnerModal}
            onOk={() => setShowWinnerModal(false)}
            onCancel={() => setShowWinnerModal(false)}
            footer={[
                <Button key="close" type="primary" onClick={() => setShowWinnerModal(false)}>
                    Cerrar
                </Button>
            ]}
        >
            {winner && (
                <div style={{ textAlign: 'center' }}>
                    <Title level={2} style={{ color: 'gold' }}>
                        <TrophyOutlined /> {winner.winnerName}
                    </Title>
                    <p>
                        <Text strong>
                            Ha completado las {winner.totalLaps} vueltas del circuito {circuito?.nombre}
                        </Text>
                    </p>
                    <p>
                        <Tag color="gold">1º Posición</Tag>
                    </p>
                    <p>
                        <Text type="secondary">
                            Total de pilotos: {winner.totalPilotos}
                        </Text>
                    </p>
                </div>
            )}
        </Modal>
    );

    return (
        <Card
            title={
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Title level={3}>
                        <CarOutlined /> Simulación de Carrera
                    </Title>
                    <Text type="secondary">
                        {circuito?.nombre || 'Circuito'} - {circuito?.pais || ''}
                        {circuito?.numero_vueltas && ` (${circuito.numero_vueltas} vueltas)`}
                    </Text>
                </Space>
            }
            extra={
                <Space>
                    <Tooltip title={simulationActive ? "Pausar simulación" : "Iniciar simulación"}>
                        <Button
                            type={simulationActive ? "default" : "primary"}
                            icon={simulationActive ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                            onClick={simulationActive ? detenerSimulacion : iniciarSimulacion}
                            disabled={!!winner || !!incidenteActivo} // Deshabilitar si hay un ganador o incidente
                        >
                            {simulationActive
                                ? "Pausar"
                                : winner
                                    ? "Carrera finalizada"
                                    : incidenteActivo
                                        ? "Incidente activo"
                                        : "Iniciar"
                            }
                        </Button>
                    </Tooltip>
                    <Space size={4}>
                        <Tooltip title="Total de tiempos registrados">
                            <Tag color="blue" icon={<ClockCircleOutlined />}>
                                {tiemposCount} tiempos
                            </Tag>
                        </Tooltip>
                        {simulationActive && (
                            <Badge status="processing" text={
                                <Text type="secondary">
                                    <SyncOutlined spin /> Simulación en curso
                                </Text>
                            } />
                        )}
                    </Space>
                </Space>
            }
            style={{ marginBottom: 24 }}
            key={forceRender} // Ayuda a forzar re-renderizado
        >
            {/* Mostrar incidente activo si existe usando el componente dedicado */}
            {incidenteActivo && <IncidenteAlert
                incidente={incidenteActivo}
                onClear={handleClearIncidente}
            />}

            {error && (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError(null)}
                    style={{ marginBottom: 16 }}
                />
            )}

            <Alert
                message={statusMessage}
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                style={{ marginBottom: 16 }}
            />

            {renderContent()}

            {lastUpdate && (
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                    <Text type="secondary">
                        Última actualización: {lastUpdate.toLocaleTimeString()}
                    </Text>
                </div>
            )}

            {winnerModal}
        </Card>
    );
};

// Definimos las propTypes para validar las props recibidas
RaceSimulation.propTypes = {
    circuito: PropTypes.shape({
        id: PropTypes.number,
        nombre: PropTypes.string,
        pais: PropTypes.string,
        longitud: PropTypes.number,
        numero_vueltas: PropTypes.number,
        numero_curvas: PropTypes.number,
        tiempo_promedio_vuelta: PropTypes.number
    }),
    pilotos: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number,
            nombre_completo: PropTypes.string,
            nombre_equipo: PropTypes.string,
            numero_carro: PropTypes.number,
            nacionalidad: PropTypes.string,
            edad: PropTypes.number
        })
    )
};

export default RaceSimulation;