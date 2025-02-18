import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Card, Button, Empty, Spin, Typography, Modal, notification } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import circuitoListViewModel from '../../../viewModels/circuitos/CircuitoListViewModel';
import styles from '../../../styles/pages/List.module.css';

const { Title } = Typography;
const { confirm } = Modal;

const CircuitoList = observer(() => {
    const navigate = useNavigate();

    useEffect(() => {
        circuitoListViewModel.cargarCircuitos();
    }, []);

    const handleEdit = (id) => {
        navigate(`/circuitos/editar/${id}`);
    };

    const showDeleteConfirm = (id, nombre) => {
        confirm({
            title: '¿Estás seguro de eliminar este circuito?',
            icon: <ExclamationCircleOutlined />,
            content: `Se eliminará ${nombre}. Esta acción no se puede deshacer.`,
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'No, cancelar',
            async onOk() {
                const success = await circuitoListViewModel.eliminarCircuito(id);
                if (success) {
                    notification.success({
                        message: 'Éxito',
                        description: 'El circuito ha sido eliminado correctamente.'
                    });
                } else {
                    notification.error({
                        message: 'Error',
                        description: circuitoListViewModel.error || 'Error al eliminar el circuito'
                    });
                }
            },
        });
    };

    const renderCircuitoCard = (circuito) => (
        <Card
            key={circuito.id}
            className={styles.card}
            title={
                <div className={styles.cardTitle}>
                    <span className={styles.cardTitleText}>{circuito.nombre}</span>
                    <div className={styles.cardActions}>
                        <Button
                            icon={<EditOutlined />}
                            type="text"
                            onClick={() => handleEdit(circuito.id)}
                        />
                        <Button
                            icon={<DeleteOutlined />}
                            type="text"
                            danger
                            onClick={() => showDeleteConfirm(circuito.id, circuito.nombre)}
                        />
                    </div>
                </div>
            }
        >
            <div className={styles.dataRow}>
                <span className={styles.label}>País:</span>
                <span className={styles.value}>{circuito.pais}</span>
            </div>
            <div className={styles.dataRow}>
                <span className={styles.label}>Longitud:</span>
                <span className={styles.value}>{circuito.longitud} km</span>
            </div>
            <div className={styles.dataRow}>
                <span className={styles.label}>Vueltas:</span>
                <span className={styles.value}>{circuito.numero_vueltas}</span>
            </div>
            <div className={styles.dataRow}>
                <span className={styles.label}>Curvas:</span>
                <span className={styles.value}>{circuito.numero_curvas}</span>
            </div>
        </Card>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title level={2}>Circuitos</Title>
                <Button
                    type="primary"
                    onClick={() => navigate('/circuitos/nuevo')}
                >
                    Agregar Circuito
                </Button>
            </div>

            {circuitoListViewModel.loading ? (
                <div className={styles.spinContainer}>
                    <Spin size="large" />
                </div>
            ) : (
                <div className={styles.cardGrid}>
                    {circuitoListViewModel.circuitos.length > 0 ? (
                        circuitoListViewModel.circuitos.map(renderCircuitoCard)
                    ) : (
                        <div className={styles.noData}>
                            <Empty description="No hay circuitos registrados" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

export default CircuitoList;