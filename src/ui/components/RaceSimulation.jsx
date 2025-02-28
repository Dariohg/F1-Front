import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Table, Button, Typography, Card, Space, Tag, Tooltip, Badge, Alert, Empty, Modal, notification } from 'antd';
import {
    CarOutlined, TrophyOutlined, ClockCircleOutlined, PauseCircleOutlined,
    PlayCircleOutlined, SyncOutlined, InfoCircleOutlined, CheckCircleOutlined,
    FireOutlined
} from '@ant-design/icons';
import PropTypes from 'prop-types';
import RaceSimulationService from '../../infrastructure/services/RaceSimulationService';
import RecordPollingService from '../../infrastructure/services/RecordPollingService';
import tiempoVueltaRepository from '../../infrastructure/repositories/TiempoVueltaRepository';

const { Title, Text } = Typography;

/**
 * Componente para la simulación de una carrera en tiempo real
 */
const RaceSimulation = ({ circuito = null, pilotos = [] }) => {
    // Estado para almacenar datos de la carrera
    // eslint-disable-next-line no-unused-vars - Se usa en renderizado condicional
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
    const [recordPollingActive, setRecordPollingActive] = useState(false); // Estado para el polling de récords

    // Referencias para mantener el estado actualizado en callbacks
    const posicionesRef = useRef(posiciones);
    const circuitoRef = useRef(circuito);
    const pilotosRef = useRef(pilotos);

    // Actualizar referencias cuando cambien los props/estado
    useEffect(() => {
        posicionesRef.current = posiciones;
        circuitoRef.current = circuito;
        pilotosRef.current = pilotos;
    }, [posiciones, circuito, pilotos]);

    // Crear servicios
    const raceService = useMemo(() =>
            new RaceSimulationService(tiempoVueltaRepository),
        []);

    const recordService = useMemo(() =>
            new RecordPollingService(),
        []);

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
     * Inicializa las posiciones de los pilotos
     */
    const inicializarPosiciones = useCallback(() => {
        // Inicializar siempre si hay pilotos disponibles
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
                _freshUpdate: new Date().getTime() // Forzar "frescura" para evitar problemas de memo
            }));

            console.log("[RaceSimulation] Posiciones iniciales creadas:", posicionesIniciales);

            // Actualizar posiciones en el componente
            setPosiciones(posicionesIniciales);
            setForceRender(prev => prev + 1); // Forzar renderizado
        }
    }, []);

    /**
     * Maneja la recepción de un nuevo tiempo de vuelta
     */
    const handleNewLapTime = useCallback((nuevoTiempo) => {
        if (!nuevoTiempo) return;

        console.log("[RaceSimulation] Nuevo tiempo recibido:", nuevoTiempo);

        setTiemposVuelta(prevTiempos => [...prevTiempos, nuevoTiempo]);
        setTiemposCount(prev => prev + 1);
        setStatusMessage(`Nuevo tiempo registrado para piloto ${nuevoTiempo.conductor_id}`);
        setLoadingTiempos(false);
        setError(null);
        setLastUpdate(new Date());
        setForceRender(prev => prev + 1); // Forzar actualización para reflejar cambios
    }, []);

    /**
     * Maneja la actualización de posiciones desde el servicio
     */
    const handlePositionsChanged = useCallback((nuevasPosiciones) => {
        if (!nuevasPosiciones || !Array.isArray(nuevasPosiciones)) return;

        console.log("[RaceSimulation] Posiciones actualizadas:", nuevasPosiciones);
        setPosiciones(nuevasPosiciones);
        setForceRender(prev => prev + 1); // Forzar renderizado
        setLastUpdate(new Date());
    }, []);

    /**
     * Maneja la detección de un nuevo récord
     */
    const handleRecordDetected = useCallback((record) => {
        console.log("[RaceSimulation] ¡RÉCORD DETECTADO!", record);

        // Mostrar notificación visual
        notification.success({
            message: '¡Récord de vuelta!',
            description: `${record.nombre_piloto} ha establecido un nuevo récord con ${record.tiempo_vuelta.toFixed(3)}s (${record.diferencia_tiempo.toFixed(3)}s más rápido)`,
            placement: 'topRight',
            duration: 6,
            icon: <FireOutlined style={{ color: '#ff4d4f' }} />
        });
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

        // Detener el polling de récords
        if (recordPollingActive) {
            recordService.stopPolling();
            setRecordPollingActive(false);
        }
    }, [recordService, recordPollingActive]);

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

        setStatusMessage("Iniciando simulación...");
        console.log("[RaceSimulation] Iniciando simulación para circuito:",
            circuitoRef.current.id, "con pilotos:", pilotosRef.current);

        try {
            // Limpiar estado anterior
            setPosiciones([]);
            setTiemposVuelta([]);
            setTiemposCount(0);
            setWinner(null);

            // Inicializar posiciones
            inicializarPosiciones();

            // Iniciar polling de récords
            recordService.startPolling(circuitoRef.current.id, handleRecordDetected);
            setRecordPollingActive(true);

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
            if (recordPollingActive) {
                recordService.stopPolling();
                setRecordPollingActive(false);
            }
        }
    }, [
        raceService,
        recordService,
        handleNewLapTime,
        handlePositionsChanged,
        handleRaceFinished,
        handleRecordDetected,
        inicializarPosiciones
    ]);

    /**
     * Detiene la simulación de carrera
     */
    const detenerSimulacion = useCallback(() => {
        setStatusMessage("Deteniendo simulación...");

        try {
            raceService.stop();
            if (recordPollingActive) {
                recordService.stopPolling();
                setRecordPollingActive(false);
            }

            setSimulationActive(false);
            setStatusMessage("Simulación detenida");
        } catch (error) {
            console.error("[RaceSimulation] Error al detener simulación:", error);
            setError("Error al detener la simulación");
            setStatusMessage("Error al detener simulación");
        }
    }, [raceService, recordService, recordPollingActive]);

    // Cargar datos iniciales y configurar cleanup
    useEffect(() => {
        cargarTiempos();

        // Inicializar posiciones al montar
        inicializarPosiciones();

        // Limpiar al desmontar
        return () => {
            console.log("[RaceSimulation] Limpiando servicios...");
            raceService.stop();
            recordService.stopPolling();
        };
    }, [cargarTiempos, raceService, recordService, inicializarPosiciones]);

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
            render: (tiempo) => tiempo ? `${parseFloat(tiempo).toFixed(3)}s` : '-',
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
                    <Button type="primary" onClick={iniciarSimulacion} disabled={simulationActive}>
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
                            disabled={!!winner} // Deshabilitar si hay un ganador
                        >
                            {simulationActive ? "Pausar" : winner ? "Carrera finalizada" : "Iniciar"}
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