import 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';

const { Header } = Layout;

function HeaderComponent() {
    const location = useLocation();

    const menuItems = [
        { key: '/', label: <Link to="/">Home</Link> },
        { key: '/add-circuito', label: <Link to="/add-circuito">Agregar Circuito</Link> },
        { key: '/add-piloto', label: <Link to="/add-piloto">Agregar Piloto</Link> },
    ];

    return (
        <Header>
            <Menu theme="dark" mode="horizontal" selectedKeys={[location.pathname]} items={menuItems} />
        </Header>
    );
}

export default HeaderComponent;