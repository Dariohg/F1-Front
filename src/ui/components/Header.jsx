import 'react';
import { Layout, Menu, Button } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import styles from '../../styles/components/Header.module.css';

const { Header } = Layout;

function HeaderComponent() {
    const location = useLocation();
    const navigate = useNavigate();

    const isCircuitosRoute = location.pathname.includes('/circuitos');
    const isPilotosRoute = location.pathname.includes('/pilotos');

    const menuItems = [
        { key: '/', label: <Link to="/">Home</Link> },
        { key: '/circuitos', label: <Link to="/circuitos">Circuitos</Link> },
        { key: '/pilotos', label: <Link to="/pilotos">Pilotos</Link> },
    ];

    const handleAdd = () => {
        if (isCircuitosRoute) {
            navigate('/circuitos/nuevo');
        } else if (isPilotosRoute) {
            navigate('/pilotos/nuevo');
        }
    };

    const currentPath = location.pathname === '/' ? '/' :
        isCircuitosRoute ? '/circuitos' :
            isPilotosRoute ? '/pilotos' : '';

    return (
        <Header className={styles.header}>
            <div className={styles.headerContent}>
                <Menu
                    theme="dark"
                    mode="horizontal"
                    selectedKeys={[currentPath]}
                    items={menuItems}
                    className={styles.menu}
                />

                {(isCircuitosRoute || isPilotosRoute) && !location.pathname.includes('nuevo') && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                        className={styles.addButton}
                    >
                        Agregar {isCircuitosRoute ? 'Circuito' : 'Piloto'}
                    </Button>
                )}
            </div>
        </Header>
    );
}

export default HeaderComponent;