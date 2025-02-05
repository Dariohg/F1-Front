import apiClient from '../api/apiClient';
import IPilotoRepository from '../../core/interfaces/IPilotoRepository';

class PilotoRepository extends IPilotoRepository {
    async crearPiloto(piloto) {
        const response = await apiClient.post('/pilotos', piloto);
        return response.data;
    }
}

export default new PilotoRepository();