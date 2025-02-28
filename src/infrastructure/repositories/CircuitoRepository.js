import apiClient from '../api/apiClient';
import ICircuitoRepository from '../../core/interfaces/ICircuitoRepository';

class CircuitoRepository extends ICircuitoRepository {
    async crearCircuito(circuito) {
        try {
            const response = await apiClient.post('/circuitos', {
                nombre: circuito.nombre,
                pais: circuito.pais,
                longitud: parseFloat(circuito.longitud),
                numero_vueltas: parseInt(circuito.numero_vueltas),
                numero_curvas: parseInt(circuito.numero_curvas),
                tiempo_promedio_vuelta: parseFloat(circuito.tiempo_promedio_vuelta)
            });
            return response.data;
        } catch (error) {
            console.error('Error al crear circuito:', error);
            throw new Error(error.response?.data?.message || 'Error al crear el circuito');
        }
    }

    async obtenerCircuitos() {
        try {
            const response = await apiClient.get('/circuitos');
            return response.data;
        } catch (error) {
            console.error('Error al obtener circuitos:', error);
            throw new Error(error.response?.data?.message || 'Error al obtener los circuitos');
        }
    }

    async eliminarCircuito(id) {
        try {
            await apiClient.delete(`/circuitos/${id}`);
        } catch (error) {
            console.error('Error al eliminar circuito:', error);
            throw new Error(error.response?.data?.message || 'Error al eliminar el circuito');
        }
    }

    async actualizarCircuito(id, circuito) {
        try {
            const response = await apiClient.put(`/circuitos/${id}`, {
                ...circuito,
                longitud: parseFloat(circuito.longitud),
                numero_vueltas: parseInt(circuito.numero_vueltas),
                numero_curvas: parseInt(circuito.numero_curvas),
                tiempo_promedio_vuelta: parseFloat(circuito.tiempo_promedio_vuelta)
            });
            return response.data;
        } catch (error) {
            console.error('Error al actualizar circuito:', error);
            throw new Error(error.response?.data?.message || 'Error al actualizar el circuito');
        }
    }
}

export default new CircuitoRepository();