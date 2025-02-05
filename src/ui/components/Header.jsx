import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../styles/components/Header.module.css';

const { Header } = Layout;

function HeaderComponent() {
    const location = useLocation();

    const menuItems = [
        { key: '/', label: <Link to="/">Home</Link> },
        { key: '/add-circuito', label: <Link to="/add-circuito">Agregar Circuito</Link> },
        { key: '/add-piloto', label: <Link to="/add-piloto">Agregar Piloto</Link> },
    ];

    return (
        <Header className={styles.header}>
            <Menu
                theme="dark"
                mode="horizontal"
                selectedKeys={[location.pathname]}
                items={menuItems}
                className={styles.menu}
            />
        </Header>
    );
}

export default HeaderComponent;