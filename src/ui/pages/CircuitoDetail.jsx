import  { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Statistic, Button, Divider, notification, Spin, Space, Table, Tag } from 'antd';
import { ArrowLeftOutlined, FlagOutlined, EnvironmentOutlined, DashboardOutlined, FieldTimeOutlined, UserOutlined } from '@ant-design/icons';
import circuitoRepository from '../../infrastructure/repositories/CircuitoRepository';
import circuitoPilotosRepository from '../../infrastructure/repositories/CircuitoPilotosRepository';
import RaceSimulation from '../components/RaceSimulation';
import styles from '../../styles/pages/CircuitoDetail.module.css';

const { Title, Text } = Typography;

/**
 * Página de detalle de un circuito con simulación de carrera
 */
function CircuitoDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [circuito, setCircuito] = useState(null);
    const [pilotosInscritos, setPilotosInscritos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingPilotos, setLoadingPilotos] = useState(true);

    // Cargar el circuito
    useEffect(() => {
        const fetchCircuito = async () => {
            setLoading(true);
            try {
                const circuitos = await circuitoRepository.obtenerCircuitos();
                const circuitoEncontrado = circuitos.find(c => c.id === parseInt(id));

                if (!circuitoEncontrado) {
                    notification.error({
                        message: 'Error',
                        description: 'No se pudo encontrar el circuito solicitado',
                    });
                    navigate('/');
                    return;
                }

                setCircuito(circuitoEncontrado);
            } catch (error) {
                console.error('Error al cargar el circuito:', error);
                notification.error({
                    message: 'Error',
                    description: 'No se pudo cargar la información del circuito.',
                });
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        fetchCircuito();
    }, [id, navigate]);

    // Cargar los pilotos inscritos en el circuito
    useEffect(() => {
        const fetchPilotosCircuito = async () => {
            if (!id) return;

            setLoadingPilotos(true);
            try {
                const response = await circuitoPilotosRepository.obtenerPilotosPorCircuito(id);

                if (response && response.pilotos) {
                    // Transformar los datos para que sean compatibles con el componente RaceSimulation
                    const pilotosFormateados = response.pilotos.map(piloto => ({
                        id: piloto.conductor_id,
                        nombre_completo: piloto.nombre_conductor,
                        nombre_equipo: piloto.nombre_equipo,
                        numero_carro: piloto.numero_carro
                    }));

                    setPilotosInscritos(pilotosFormateados);
                } else {
                    setPilotosInscritos([]);
                }
            } catch (error) {
                console.error('Error al cargar pilotos del circuito:', error);
                notification.error({
                    message: 'Error',
                    description: 'No se pudieron cargar los pilotos inscritos en este circuito.',
                });
                setPilotosInscritos([]);
            } finally {
                setLoadingPilotos(false);
            }
        };

        fetchPilotosCircuito();
    }, [id]);

    // Columnas para la tabla de pilotos inscritos
    const pilotosColumns = [
        {
            title: 'Número',
            dataIndex: 'numero_carro',
            key: 'numero_carro',
            width: 100,
            render: (numero) => <Tag color="blue">{numero}</Tag>
        },
        {
            title: 'Piloto',
            dataIndex: 'nombre_completo',
            key: 'nombre_completo',
        },
        {
            title: 'Equipo',
            dataIndex: 'nombre_equipo',
            key: 'nombre_equipo',
        }
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Space style={{ marginBottom: 16 }}>
                <Button
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/')}
                >
                    Volver
                </Button>
            </Space>

            <Card className={styles.circuitoHeader}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={16}>
                        <Title level={2}>
                            <FlagOutlined /> {circuito.nombre}
                        </Title>
                        <Text type="secondary">
                            <EnvironmentOutlined /> {circuito.pais}
                        </Text>
                    </Col>
                    <Col xs={24} md={8}>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Statistic
                                    title="Longitud"
                                    value={circuito.longitud}
                                    suffix="km"
                                    prefix={<DashboardOutlined />}
                                />
                            </Col>
                            <Col span={8}>
                                <Statistic
                                    title="Vueltas"
                                    value={circuito.numero_vueltas}
                                    prefix={<FieldTimeOutlined />}
                                />
                            </Col>
                            <Col span={8}>
                                <Statistic
                                    title="Curvas"
                                    value={circuito.numero_curvas}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Card>

            <Divider orientation="left">Pilotos Inscritos</Divider>

            <Card
                title={
                    <Space>
                        <UserOutlined />
                        <span>Pilotos participantes ({pilotosInscritos.length})</span>
                    </Space>
                }
                loading={loadingPilotos}
                className={styles.pilotosCard}
            >
                {pilotosInscritos.length > 0 ? (
                    <Table
                        dataSource={pilotosInscritos}
                        columns={pilotosColumns}
                        rowKey="id"
                        pagination={false}
                        size="small"
                    />
                ) : (
                    <div className={styles.noPilotos}>
                        <Text type="secondary">No hay pilotos inscritos en este circuito.</Text>
                    </div>
                )}
            </Card>

            <Divider orientation="left">Simulación de Carrera</Divider>

            {pilotosInscritos.length > 0 ? (
                <RaceSimulation circuito={circuito} pilotos={pilotosInscritos} />
            ) : (
                <Card className={styles.noSimulationCard}>
                    <Text type="secondary">
                        No se puede iniciar la simulación sin pilotos inscritos.
                    </Text>
                </Card>
            )}
        </div>
    );
}

export default CircuitoDetail;