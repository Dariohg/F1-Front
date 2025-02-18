import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Card, Spin, Typography, Row, Col, Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { CircuitoViewModel } from '../../../viewModels/circuitos/CircuitoViewModel';
import styles from '../../../styles/pages/Detail.module.css';

const { Title } = Typography;

const CircuitoDetail = observer(() => {
    const { id } = useParams();
    const navigate = useNavigate();
    const circuitoViewModel = new CircuitoViewModel();

    useEffect(() => {
        if (id) {
            circuitoViewModel.cargar(id);
        }
    }, [id]);

    if (circuitoViewModel.loading) {
        return <div className={styles.container}><Spin size="large" /></div>;
    }

    if (!circuitoViewModel.circuito) {
        return <div>No se encontró el circuito</div>;
    }

    return (
        <div className={styles.container}>
            <Card
                title={
                    <div className={styles.titleContainer}>
                        <Title level={2}>{circuitoViewModel.circuito.nombre}</Title>
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/circuitos/edit/${id}`)}
                        >
                            Editar
                        </Button>
                    </div>
                }
                className={styles.card}
            >
                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>País:</span>
                            <span>{circuitoViewModel.circuito.pais}</span>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>Longitud:</span>
                            <span>{circuitoViewModel.circuito.longitud} km</span>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>Número de Vueltas:</span>
                            <span>{circuitoViewModel.circuito.numero_vueltas}</span>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>Número de Curvas:</span>
                            <span>{circuitoViewModel.circuito.numero_curvas}</span>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
});

export default CircuitoDetail;