import apiClient from '../api/apiClient';
import ICircuitoRepository from '../../core/interfaces/ICircuitoRepository';

class CircuitoRepository extends ICircuitoRepository {
    async crearCircuito(circuito) {
        const response = await apiClient.post('/circuitos', circuito);
        return response.data;
    }
}

export default new CircuitoRepository();