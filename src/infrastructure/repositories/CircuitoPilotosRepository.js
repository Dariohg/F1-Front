import apiClient from '../api/apiClient';
import ICircuitoPilotosRepository from '../../core/interfaces/ICircuitoPilotosRepository';

class CircuitoPilotosRepository extends ICircuitoPilotosRepository {
    async obtenerPilotosPorCircuito(circuitoId) {
        try {
            const response = await apiClient.get(`/circuitos/${circuitoId}/pilotos`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener pilotos del circuito:', error);
            // Devolvemos un objeto vacío con la estructura correcta en caso de error
            return {
                circuito_id: circuitoId,
                pilotos: []
            };
        }
    }

    async registrarPilotoEnCircuito(circuitoId, pilotoId) {
        try {
            const response = await apiClient.post(`/circuitos/${circuitoId}/pilotos`, {
                conductor_id: pilotoId
            });
            return response.data;
        } catch (error) {
            console.error('Error al registrar piloto en circuito:', error);
            throw new Error(error.response?.data?.message || 'Error al registrar el piloto en el circuito');
        }
    }

    async eliminarPilotoDeCircuito(circuitoId, pilotoId) {
        try {
            await apiClient.delete(`/circuitos/${circuitoId}/pilotos/${pilotoId}`);
        } catch (error) {
            console.error('Error al eliminar piloto del circuito:', error);
            throw new Error(error.response?.data?.message || 'Error al eliminar el piloto del circuito');
        }
    }
}

export default new CircuitoPilotosRepository();