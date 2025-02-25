import { TiempoVuelta } from '../entities/TiempoVuelta';

export default function registrarTiempoVueltaUseCase(tiempoVueltaRepository) {
    return async (circuitoId, tiempoVueltaData) => {
        try {
            const tiempoVuelta = new TiempoVuelta(tiempoVueltaData);
            return await tiempoVueltaRepository.registrarTiempo(circuitoId, tiempoVuelta);
        } catch (error) {
            console.error('Error al registrar tiempo de vuelta:', error);
            throw error;
        }
    };
}