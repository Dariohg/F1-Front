import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Card, Button, Empty, Spin, Typography, Modal, notification } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import pilotoListViewModel from '../../../viewModels/pilotos/PilotoListViewModel';
import styles from '../../../styles/pages/List.module.css';

const { Title } = Typography;
const { confirm } = Modal;

const PilotoList = observer(() => {
    const navigate = useNavigate();

    useEffect(() => {
        pilotoListViewModel.cargarPilotos();
    }, []);

    const handleEdit = (id) => {
        navigate(`/pilotos/editar/${id}`);
    };

    const showDeleteConfirm = (id, nombre) => {
        confirm({
            title: '¿Estás seguro de eliminar este piloto?',
            icon: <ExclamationCircleOutlined />,
            content: `Se eliminará ${nombre}. Esta acción no se puede deshacer.`,
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'No, cancelar',
            async onOk() {
                const success = await pilotoListViewModel.eliminarPiloto(id);
                if (success) {
                    notification.success({
                        message: 'Éxito',
                        description: 'El piloto ha sido eliminado correctamente.'
                    });
                } else {
                    notification.error({
                        message: 'Error',
                        description: pilotoListViewModel.error || 'Error al eliminar el piloto'
                    });
                }
            },
        });
    };

    const renderPilotoCard = (piloto) => (
        <Card
            key={piloto.id}
            className={styles.card}
            title={
                <div className={styles.cardTitle}>
                    <span className={styles.cardTitleText}>{piloto.nombre_completo}</span>
                    <div className={styles.cardActions}>
                        <Button
                            icon={<EditOutlined />}
                            type="text"
                            onClick={() => handleEdit(piloto.id)}
                        />
                        <Button
                            icon={<DeleteOutlined />}
                            type="text"
                            danger
                            onClick={() => showDeleteConfirm(piloto.id, piloto.nombre_completo)}
                        />
                    </div>
                </div>
            }
        >
            <div className={styles.dataRow}>
                <span className={styles.label}>Nacionalidad:</span>
                <span className={styles.value}>{piloto.nacionalidad}</span>
            </div>
            <div className={styles.dataRow}>
                <span className={styles.label}>Equipo:</span>
                <span className={styles.value}>{piloto.nombre_equipo}</span>
            </div>
            <div className={styles.dataRow}>
                <span className={styles.label}>Número:</span>
                <span className={styles.value}>{piloto.numero_carro}</span>
            </div>
            <div className={styles.dataRow}>
                <span className={styles.label}>Edad:</span>
                <span className={styles.value}>{piloto.edad} años</span>
            </div>
        </Card>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title level={2}>Pilotos</Title>
                <Button
                    type="primary"
                    onClick={() => navigate('/pilotos/nuevo')}
                >
                    Agregar Piloto
                </Button>
            </div>

            {pilotoListViewModel.loading ? (
                <div className={styles.spinContainer}>
                    <Spin size="large" />
                </div>
            ) : (
                <div className={styles.cardGrid}>
                    {pilotoListViewModel.pilotos.length > 0 ? (
                        pilotoListViewModel.pilotos.map(renderPilotoCard)
                    ) : (
                        <div className={styles.noData}>
                            <Empty description="No hay pilotos registrados" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

export default PilotoList;