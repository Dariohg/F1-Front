import  'react';
import { Typography, Card, Row, Col, Button } from 'antd';
import { Link } from 'react-router-dom';
import { RightOutlined } from '@ant-design/icons';
import styles from '../../styles/pages/Home.module.css';

const { Title } = Typography;

function Home() {
    return (
        <div className={styles.container}>
            <Title>Bienvenido a la Fórmula 1</Title>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                    <Card
                        title="Circuitos"
                        extra={
                            <Link to="/circuitos">
                                <Button type="link" icon={<RightOutlined />}>
                                    Ver todos
                                </Button>
                            </Link>
                        }
                    >
                        <p>Gestiona los circuitos de la Fórmula 1</p>
                        <Link to="/circuitos/nuevo">
                            <Button type="primary">
                                Agregar Circuito
                            </Button>
                        </Link>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card
                        title="Pilotos"
                        extra={
                            <Link to="/pilotos">
                                <Button type="link" icon={<RightOutlined />}>
                                    Ver todos
                                </Button>
                            </Link>
                        }
                    >
                        <p>Gestiona los pilotos de la Fórmula 1</p>
                        <Link to="/pilotos/nuevo">
                            <Button type="primary">
                                Agregar Piloto
                            </Button>
                        </Link>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default Home;