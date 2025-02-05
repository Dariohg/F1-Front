import { Piloto } from '../entities/Piloto';

export default function crearPilotoUseCase(pilotoRepository) {
    return async (pilotoData) => {
        try {
            const piloto = new Piloto(pilotoData);
            return await pilotoRepository.crearPiloto(piloto);
        } catch (error) {
            console.error('Error al crear piloto:', error);
            throw error;
        }
    };
}