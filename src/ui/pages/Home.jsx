import  { useEffect, useState } from 'react';
import { Card, Button, Empty, Spin, Typography, Modal, notification } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import circuitoRepository from '../../infrastructure/repositories/CircuitoRepository';
import pilotoRepository from '../../infrastructure/repositories/PilotoRepository';
import EditCircuitoModal from '../components/EditCircuitoModal';
import EditPilotoModal from '../components/EditPilotoModal';
import styles from '../../styles/pages/Home.module.css';

const { Title } = Typography;
const { confirm } = Modal;

function Home() {
    const [circuitos, setCircuitos] = useState([]);
    const [pilotos, setPilotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCircuito, setEditingCircuito] = useState(null);
    const [editingPiloto, setEditingPiloto] = useState(null);
    const [editCircuitoModalVisible, setEditCircuitoModalVisible] = useState(false);
    const [editPilotoModalVisible, setEditPilotoModalVisible] = useState(false);

    const fetchData = async () => {
        try {
            const [circuitosData, pilotosData] = await Promise.all([
                circuitoRepository.obtenerCircuitos(),
                pilotoRepository.obtenerPilotos()
            ]);
            setCircuitos(circuitosData);
            setPilotos(pilotosData);
        } catch (error) {
            console.error('Error al cargar los datos:', error);
            notification.error({
                message: 'Error',
                description: 'No se pudieron cargar los datos. Por favor, intenta nuevamente.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (id, type) => {
        if (type === 'circuito') {
            const circuito = circuitos.find(c => c.id === id);
            setEditingCircuito(circuito);
            setEditCircuitoModalVisible(true);
        } else {
            const piloto = pilotos.find(p => p.id === id);
            setEditingPiloto(piloto);
            setEditPilotoModalVisible(true);
        }
    };

    const handleEditSuccess = (type) => {
        if (type === 'circuito') {
            setEditCircuitoModalVisible(false);
            setEditingCircuito(null);
        } else {
            setEditPilotoModalVisible(false);
            setEditingPiloto(null);
        }
        fetchData();
    };

    const showDeleteConfirm = (id, type, nombre) => {
        confirm({
            title: `¿Estás seguro de eliminar este ${type === 'circuito' ? 'circuito' : 'piloto'}?`,
            icon: <ExclamationCircleOutlined />,
            content: `Se eliminará ${nombre}. Esta acción no se puede deshacer.`,
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'No, cancelar',
            async onOk() {
                try {
                    if (type === 'circuito') {
                        await circuitoRepository.eliminarCircuito(id);
                    } else {
                        await pilotoRepository.eliminarPiloto(id);
                    }

                    notification.success({
                        message: 'Eliminado con éxito',
                        description: `El ${type} ha sido eliminado correctamente.`
                    });

                    fetchData();
                    // eslint-disable-next-line no-unused-vars
                } catch (error) {
                    notification.error({
                        message: 'Error',
                        description: `No se pudo eliminar el ${type}. Por favor, intenta nuevamente.`
                    });
                }
            },
        });
    };

    const renderCircuitoCard = (circuito) => (
        <Card
            key={circuito.id}
            className={styles.card}
            title={circuito.nombre}
        >
            <div className={styles.cardActions}>
                <Button
                    icon={<EditOutlined />}
                    type="text"
                    onClick={() => handleEdit(circuito.id, 'circuito')}
                />
                <Button
                    icon={<DeleteOutlined />}
                    type="text"
                    danger
                    onClick={() => showDeleteConfirm(circuito.id, 'circuito', circuito.nombre)}
                />
            </div>
            <div className={styles.dataRow}>
                <span className={styles.label}>País:</span>
                <span>{circuito.pais}</span>
            </div>
            <div className={styles.dataRow}>
                <span className={styles.label}>Longitud:</span>
                <span>{circuito.longitud} km</span>
            </div>
            <div className={styles.dataRow}>
                <span className={styles.label}>Vueltas:</span>
                <span>{circuito.numero_vueltas}</span>
            </div>
            <div className={styles.dataRow}>
                <span className={styles.label}>Curvas:</span>
                <span>{circuito.numero_curvas}</span>
            </div>
        </Card>
    );

    const renderPilotoCard = (piloto) => (
        <Card
            key={piloto.id}
            className={styles.card}
            title={piloto.nombre_completo}
        >
            <div className={styles.cardActions}>
                <Button
                    icon={<EditOutlined />}
                    type="text"
                    onClick={() => handleEdit(piloto.id, 'piloto')}
                />
                <Button
                    icon={<DeleteOutlined />}
                    type="text"
                    danger
                    onClick={() => showDeleteConfirm(piloto.id, 'piloto', piloto.nombre_completo)}
                />
            </div>
            <div className={styles.dataRow}>
                <span className={styles.label}>Nacionalidad:</span>
                <span>{piloto.nacionalidad}</span>
            </div>
            <div className={styles.dataRow}>
                <span className={styles.label}>Equipo:</span>
                <span>{piloto.nombre_equipo}</span>
            </div>
            <div className={styles.dataRow}>
                <span className={styles.label}>Número:</span>
                <span>{piloto.numero_carro}</span>
            </div>
            <div className={styles.dataRow}>
                <span className={styles.label}>Edad:</span>
                <span>{piloto.edad} años</span>
            </div>
        </Card>
    );

    if (loading) {
        return <div className={styles.container}><Spin size="large" /></div>;
    }

    return (
        <div className={styles.container}>
            <Title level={2} className={styles.sectionTitle}>
                Circuitos
            </Title>
            <div className={styles.cardGrid}>
                {circuitos.length > 0 ? (
                    circuitos.map(renderCircuitoCard)
                ) : (
                    <div className={styles.noData}>
                        <Empty description="No hay circuitos registrados" />
                    </div>
                )}
            </div>

            <Title level={2} className={styles.sectionTitle}>
                Pilotos
            </Title>
            <div className={styles.cardGrid}>
                {pilotos.length > 0 ? (
                    pilotos.map(renderPilotoCard)
                ) : (
                    <div className={styles.noData}>
                        <Empty description="No hay pilotos registrados" />
                    </div>
                )}
            </div>

            <EditCircuitoModal
                visible={editCircuitoModalVisible}
                circuito={editingCircuito}
                onCancel={() => {
                    setEditCircuitoModalVisible(false);
                    setEditingCircuito(null);
                }}
                onSuccess={() => handleEditSuccess('circuito')}
            />

            <EditPilotoModal
                visible={editPilotoModalVisible}
                piloto={editingPiloto}
                onCancel={() => {
                    setEditPilotoModalVisible(false);
                    setEditingPiloto(null);
                }}
                onSuccess={() => handleEditSuccess('piloto')}
            />
        </div>
    );
}

export default Home;