import apiClient from '../api/apiClient';
import IPilotoRepository from '../../core/interfaces/IPilotoRepository';

class PilotoRepository extends IPilotoRepository {
    async crearPiloto(piloto) {
        try {
            const response = await apiClient.post('/conductores', piloto);
            return response.data;
        } catch (error) {
            console.error('Error al crear piloto:', error);
            throw new Error(error.response?.data?.message || 'Error al crear el piloto');
        }
    }

    async obtenerPilotos() {
        try {
            const response = await apiClient.get('/conductores');
            return response.data;
        } catch (error) {
            console.error('Error al obtener pilotos:', error);
            throw new Error(error.response?.data?.message || 'Error al obtener los pilotos');
        }
    }

    async eliminarPiloto(id) {
        try {
            await apiClient.delete(`/conductores/${id}`);
        } catch (error) {
            console.error('Error al eliminar piloto:', error);
            throw new Error(error.response?.data?.message || 'Error al eliminar el piloto');
        }
    }

    async actualizarPiloto(id, piloto) {
        try {
            const response = await apiClient.put(`/conductores/${id}`, piloto);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar piloto:', error);
            throw new Error(error.response?.data?.message || 'Error al actualizar el piloto');
        }
    }
}

export default new PilotoRepository();