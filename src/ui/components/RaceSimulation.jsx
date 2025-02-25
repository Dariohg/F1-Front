import { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Typography, Card, Space, Tag, Tooltip, Badge, Alert, Empty } from 'antd';
import { CarOutlined, TrophyOutlined, ClockCircleOutlined, PauseCircleOutlined, PlayCircleOutlined, SyncOutlined,
    InfoCircleOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import RaceSimulationService from '../../infrastructure/services/RaceSimulationService';
import PosicionesPollingService from '../../infrastructure/services/PosicionesPollingService';
import tiempoVueltaRepository from '../../infrastructure/repositories/TiempoVueltaRepository';
import posicionesRepository from '../../infrastructure/repositories/PosicionesRepository';

const { Title, Text } = Typography;

/**
 * Componente para la simulación de una carrera en tiempo real
 */
const RaceSimulation = ({ circuito = null, pilotos = [] }) => {
    const [tiemposVuelta, setTiemposVuelta] = useState([]);
    const [posiciones, setPosiciones] = useState([]);
    const [simulationActive, setSimulationActive] = useState(false);
    const [loadingTiempos, setLoadingTiempos] = useState(true);
    const [pollingActive, setPollingActive] = useState(false);
    const [tiemposCount, setTiemposCount] = useState(0);
    const [pollNumber, setPollNumber] = useState(0);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState("Esperando iniciar simulación");

    // Crear servicios
    const raceService = useMemo(() => {
        // Pasar también el repositorio de posiciones para sincronizar
        return new RaceSimulationService(tiempoVueltaRepository, posicionesRepository);
    }, []);

    const posicionesService = useMemo(() => {
        return new PosicionesPollingService(posicionesRepository);
    }, []);

    // Función para cargar los tiempos de vuelta existentes
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
            console.log("Tiempos cargados:", tiempos);

            // Asegurarnos de que siempre sea un array, incluso si la API devuelve null/undefined
            const tiemposArray = Array.isArray(tiempos) ? tiempos : [];
            setTiemposVuelta(tiemposArray);
            setTiemposCount(tiemposArray.length);
            setStatusMessage(`${tiemposArray.length} tiempos cargados. Listo para iniciar simulación.`);
            setError(null);
        } catch (error) {
            console.error('Error al cargar tiempos:', error);
            // Si hay un error, inicializamos con un array vacío
            setTiemposVuelta([]);
            setTiemposCount(0);
            setStatusMessage("Error al cargar tiempos. Intente nuevamente.");
            setError("No se pudieron cargar los tiempos de vuelta. La API podría no estar disponible.");
        } finally {
            // Siempre desactivamos el spinner después de cargar los datos iniciales
            setLoadingTiempos(false);
        }
    }, [circuito?.id]);

    // Manejar nuevo tiempo de vuelta
    const handleNewLapTime = useCallback((nuevoTiempo) => {
        if (nuevoTiempo) {
            console.log("Nuevo tiempo recibido:", nuevoTiempo);
            setTiemposVuelta(prevTiempos => [...prevTiempos, nuevoTiempo]);
            setTiemposCount(prev => prev + 1);
            setStatusMessage(`Nuevo tiempo registrado para piloto ${nuevoTiempo.conductor_id}`);
            // Asegurarnos de que el spinner no esté visible cuando llegan nuevos tiempos
            setLoadingTiempos(false);
            setError(null);
        }
    }, []);

    // Manejar actualización de posiciones oficiales
    const handlePosicionesUpdate = useCallback((data) => {
        console.log("Actualización de posiciones recibida:", data);

        // Si data es un string, puede contener múltiples objetos JSON concatenados
        let jsonData = data;
        if (typeof data === 'string') {
            try {
                // Intentar extraer el primer objeto JSON válido
                const firstObjectEndIndex = data.indexOf('}') + 1;
                const firstObject = data.substring(0, firstObjectEndIndex);
                jsonData = JSON.parse(firstObject);
            } catch (error) {
                console.error("Error al parsear posiciones concatenadas:", error);
                return;
            }
        }

        // Si data no es un objeto después de intentar parsear
        if (!jsonData || typeof jsonData !== 'object') {
            console.warn("Datos de posiciones inválidos: formato no es un objeto", jsonData);
            return;
        }

        // Verificar si hay posiciones
        if (!Array.isArray(jsonData.posiciones)) {
            console.warn("Datos de posiciones inválidos: posiciones no es un array", jsonData);
            return;
        }

        setPollNumber(jsonData.poll_number || 0);
        setLastUpdate(jsonData.timestamp || new Date().toISOString());

        // Actualizar posiciones directamente desde el servidor
        const posicionesServer = jsonData.posiciones.map(pos => {
            // Buscar datos del piloto
            const piloto = pilotos.find(p => p.id === pos.conductor_id);
            if (!piloto) return null;

            return {
                id: pos.conductor_id,
                posicion: pos.posicion,
                nombre: piloto.nombre_completo || 'Desconocido',
                equipo: piloto.nombre_equipo || 'Desconocido',
                numero: piloto.numero_carro || 0,
                timestamp: pos.timestamp
            };
        }).filter(Boolean).sort((a, b) => a.posicion - b.posicion);

        console.log("Posiciones procesadas:", posicionesServer);

        // Establecer las posiciones directamente desde el servidor
        if (posicionesServer.length > 0) {
            setPosiciones(posicionesServer);
            setStatusMessage(`Posiciones actualizadas (Poll #${jsonData.poll_number})`);
            setError(null);
        }
    }, [pilotos]);

    // Iniciar simulación
    const iniciarSimulacion = useCallback(() => {
        if (!circuito?.id) {
            setError("No se ha seleccionado un circuito válido");
            return;
        }

        if (!pilotos?.length) {
            setError("No hay pilotos registrados para este circuito");
            return;
        }

        setStatusMessage("Iniciando simulación...");
        console.log("Iniciando simulación para circuito:", circuito.id, "con pilotos:", pilotos);

        try {
            // Iniciar simulación de tiempos y posiciones (ahora integrados en un solo servicio)
            raceService.start(circuito.id, pilotos, handleNewLapTime);

            // Iniciar polling de posiciones para obtener actualizaciones del servidor
            posicionesService.startPolling(circuito.id, handlePosicionesUpdate);

            setSimulationActive(true);
            setPollingActive(true);
            setError(null);
            setStatusMessage("Simulación iniciada correctamente");
        } catch (error) {
            console.error("Error al iniciar simulación:", error);
            setError("Error al iniciar la simulación. Verifique la consola para más detalles.");
            setStatusMessage("Error al iniciar simulación");
        }
    }, [circuito?.id, pilotos, raceService, posicionesService, handleNewLapTime, handlePosicionesUpdate]);

    // Detener simulación
    const detenerSimulacion = useCallback(() => {
        setStatusMessage("Deteniendo simulación...");

        try {
            raceService.stop();
            posicionesService.stopPolling();

            setSimulationActive(false);
            setPollingActive(false);
            setStatusMessage("Simulación detenida");
        } catch (error) {
            console.error("Error al detener simulación:", error);
            setError("Error al detener la simulación");
            setStatusMessage("Error al detener simulación");
        }
    }, [raceService, posicionesService]);

    // Efecto para cargar tiempos iniciales
    useEffect(() => {
        cargarTiempos();

        // También podemos hacer un polling inicial para obtener posiciones existentes
        if (circuito?.id) {
            setStatusMessage("Obteniendo posiciones iniciales...");
            posicionesRepository.obtenerPosiciones(circuito.id)
                .then(data => {
                    console.log("Posiciones iniciales:", data);
                    handlePosicionesUpdate(data);
                    setStatusMessage("Posiciones iniciales cargadas");
                })
                .catch(error => {
                    console.error('Error al obtener posiciones iniciales:', error);
                    setStatusMessage("Error al obtener posiciones iniciales");
                });
        }

        // Limpiar simulación al desmontar
        return () => {
            raceService.stop();
            posicionesService.stopPolling();
            setStatusMessage("Componente desmontado");
        };
    }, [cargarTiempos, raceService, posicionesService, circuito?.id, handlePosicionesUpdate]);

    // Crear pilotos iniciales si no hay posiciones
    useEffect(() => {
        // Si no hay posiciones pero hay pilotos, crear posiciones iniciales
        if (posiciones.length === 0 && pilotos.length > 0 && !loadingTiempos) {
            // Crear posiciones iniciales estáticas (no enviadas al backend aún)
            const posicionesIniciales = pilotos.map((piloto, index) => ({
                id: piloto.id,
                nombre: piloto.nombre_completo || 'Desconocido',
                equipo: piloto.nombre_equipo || 'Desconocido',
                numero: piloto.numero_carro || 0,
                posicion: index + 1,
                vueltas: 0,
                mejorTiempo: 0,
                ultimoTiempo: 0
            }));

            console.log("Creando posiciones iniciales:", posicionesIniciales);
            setPosiciones(posicionesIniciales);
        }
    }, [pilotos, posiciones.length, loadingTiempos]);

    // Calcular los datos de los pilotos para mostrar información de vueltas y tiempos
    const pilotosData = useMemo(() => {
        if (!Array.isArray(tiemposVuelta) || !Array.isArray(posiciones)) {
            return [];
        }

        console.log("Calculando datos de pilotos con posiciones:", posiciones.length, "y tiempos:", tiemposVuelta.length);

        // Para cada piloto en las posiciones, enriquecer con datos de tiempos de vuelta
        return posiciones.map(posicion => {
            const pilotoId = posicion.id;

            // Calcular el mejor tiempo
            let mejorTiempo = 0;
            tiemposVuelta.forEach(tiempo => {
                if (tiempo && tiempo.conductor_id === pilotoId) {
                    if (mejorTiempo === 0 || tiempo.tiempo < mejorTiempo) {
                        mejorTiempo = tiempo.tiempo;
                    }
                }
            });

            // Calcular vueltas completadas
            const vueltas = tiemposVuelta.filter(
                tiempo => tiempo && tiempo.conductor_id === pilotoId
            ).length;

            // Obtener último tiempo
            const tiemposDelPiloto = tiemposVuelta.filter(
                tiempo => tiempo && tiempo.conductor_id === pilotoId
            ).sort((a, b) => (b.numero_vuelta || 0) - (a.numero_vuelta || 0));

            const ultimoTiempo = tiemposDelPiloto.length > 0 ? tiemposDelPiloto[0].tiempo : 0;

            // Devolver piloto con todos los datos
            return {
                ...posicion,
                vueltas,
                mejorTiempo,
                ultimoTiempo
            };
        });
    }, [tiemposVuelta, posiciones]);

    // Columnas para la tabla
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
            render: (vueltas) => (
                <Tag color="green">{vueltas}</Tag>
            ),
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
        if (loadingTiempos && pilotosData.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <SyncOutlined spin style={{ fontSize: 24 }} />
                    <p style={{ marginTop: 16 }}>Cargando datos de la carrera...</p>
                </div>
            );
        }

        if (pilotosData.length === 0) {
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

        return (
            <Table
                dataSource={pilotosData}
                columns={columns}
                rowKey="id"
                loading={loadingTiempos && pilotosData.length === 0}
                pagination={false}
                size="middle"
            />
        );
    };

    return (
        <Card
            title={
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Title level={3}>
                        <CarOutlined /> Simulación de Carrera
                    </Title>
                    <Text type="secondary">
                        {circuito?.nombre || 'Circuito'} - {circuito?.pais || ''}
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
                        >
                            {simulationActive ? "Pausar" : "Iniciar"}
                        </Button>
                    </Tooltip>
                    <Space size={4}>
                        <Tooltip title="Total de tiempos registrados">
                            <Tag color="blue" icon={<ClockCircleOutlined />}>
                                {tiemposCount} tiempos
                            </Tag>
                        </Tooltip>
                        {pollingActive && (
                            <Badge status="processing" text={
                                <Text type="secondary">
                                    <SyncOutlined spin /> Poll #{pollNumber}
                                </Text>
                            } />
                        )}
                    </Space>
                </Space>
            }
            style={{ marginBottom: 24 }}
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
                        Última actualización: {new Date(lastUpdate).toLocaleTimeString()}
                    </Text>
                </div>
            )}
        </Card>
    );
};

// Definimos las propTypes para validar las props recibidas
RaceSimulation.propTypes = {
    // Definición de la estructura del objeto circuito
    circuito: PropTypes.shape({
        id: PropTypes.number,
        nombre: PropTypes.string,
        pais: PropTypes.string,
        // Añadir otras propiedades según sea necesario
        longitud: PropTypes.number,
        numero_vueltas: PropTypes.number,
        numero_curvas: PropTypes.number
    }),

    // Definición del array de pilotos
    pilotos: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number,
            nombre_completo: PropTypes.string,
            nombre_equipo: PropTypes.string,
            numero_carro: PropTypes.number,
            // Añadir otras propiedades según sea necesario
            nacionalidad: PropTypes.string,
            edad: PropTypes.number
        })
    )
};

export default RaceSimulation;