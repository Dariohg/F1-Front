import  { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Card, Spin, Typography, Row, Col, Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { PilotoViewModel } from '../../../viewModels/pilotos/PilotoViewModel';
import styles from '../../../styles/pages/Detail.module.css';

const { Title } = Typography;

const PilotoDetail = observer(() => {
    const { id } = useParams();
    const navigate = useNavigate();
    const pilotoViewModel = new PilotoViewModel();

    useEffect(() => {
        if (id) {
            pilotoViewModel.cargar(id);
        }
    }, [id]);

    if (pilotoViewModel.loading) {
        return <div className={styles.container}><Spin size="large" /></div>;
    }

    if (!pilotoViewModel.piloto) {
        return <div>No se encontró el piloto</div>;
    }

    return (
        <div className={styles.container}>
            <Card
                title={
                    <div className={styles.titleContainer}>
                        <Title level={2}>{pilotoViewModel.piloto.nombre_completo}</Title>
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/pilotos/edit/${id}`)}
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
                            <span className={styles.label}>Nacionalidad:</span>
                            <span>{pilotoViewModel.piloto.nacionalidad}</span>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>Equipo:</span>
                            <span>{pilotoViewModel.piloto.nombre_equipo}</span>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>Número de Carro:</span>
                            <span>{pilotoViewModel.piloto.numero_carro}</span>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>Edad:</span>
                            <span>{pilotoViewModel.piloto.edad} años</span>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
});

export default PilotoDetail;