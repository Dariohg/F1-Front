import { Circuito } from '../entities/Circuito';

export default function crearCircuitoUseCase(circuitoRepository) {
    return async (circuitoData) => {
        try {
            const circuito = new Circuito(circuitoData);
            return await circuitoRepository.crearCircuito(circuito);
        } catch (error) {
            console.error('Error al crear circuito:', error);
            throw error;
        }
    };
}