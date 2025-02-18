import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import HeaderComponent from './ui/components/Header';
import Home from './ui/pages/Home';
import CircuitoList from './ui/pages/circuitos/CircuitoList';
import CircuitoForm from './ui/pages/circuitos/CircuitoForm';
import CircuitoDetail from './ui/pages/circuitos/CircuitoDetail';
import PilotoList from './ui/pages/pilotos/PilotoList';
import PilotoForm from './ui/pages/pilotos/PilotoForm';
import PilotoDetail from './ui/pages/pilotos/PilotoDetail';
import styles from './styles/base/_layout.module.css';

const { Content } = Layout;

function App() {
    return (
        <Router>
            <Layout className={styles.mainLayout}>
                <HeaderComponent />
                <Content className={styles.mainContent}>
                    <Routes>
                        {/* Ruta principal */}
                        <Route path="/" element={<Home />} />

                        {/* Rutas de Circuitos */}
                        <Route path="/circuitos" element={<CircuitoList />} />
                        <Route path="/circuitos/nuevo" element={<CircuitoForm />} />
                        <Route path="/circuitos/editar/:id" element={<CircuitoForm />} />
                        <Route path="/circuitos/:id" element={<CircuitoDetail />} />

                        {/* Rutas de Pilotos */}
                        <Route path="/pilotos" element={<PilotoList />} />
                        <Route path="/pilotos/nuevo" element={<PilotoForm />} />
                        <Route path="/pilotos/editar/:id" element={<PilotoForm />} />
                        <Route path="/pilotos/:id" element={<PilotoDetail />} />
                    </Routes>
                </Content>
            </Layout>
        </Router>
    );
}

export default App;