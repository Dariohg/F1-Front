import 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import HeaderComponent from './ui/components/Header.jsx';
import Home from './ui/pages/Home.jsx';
import AddCircuito from './ui/pages/AddCircuito';
import AddPiloto from './ui/pages/AddPiloto';
import styles from './styles/base/_layout.module.css';

const { Content } = Layout;

function App() {
    return (
        <Router>
            <Layout className={styles.mainLayout}>
                <HeaderComponent />
                <Content className={styles.mainContent}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/add-circuito" element={<AddCircuito />} />
                        <Route path="/add-piloto" element={<AddPiloto />} />
                    </Routes>
                </Content>
            </Layout>
        </Router>
    );
}

export default App;