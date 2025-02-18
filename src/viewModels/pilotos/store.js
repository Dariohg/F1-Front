import { makeAutoObservable } from 'mobx';
import pilotoRepository from '../../infrastructure/repositories/PilotoRepository';

class PilotoStore {
    pilotos = [];
    pilotoActual = null;
    loading = false;
    error = null;

    constructor() {
        makeAutoObservable(this);
    }

    setLoading(status) {
        this.loading = status;
    }

    setError(error) {
        this.error = error;
    }

    setPilotos(pilotos) {
        this.pilotos = pilotos;
    }

    setPilotoActual(piloto) {
        this.pilotoActual = piloto;
    }

    // Acciones
    async cargarPilotos() {
        this.setLoading(true);
        try {
            const response = await pilotoRepository.obtenerPilotos();
            this.setPilotos(response);
        } catch (error) {
            this.setError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async crearPiloto(pilotoData) {
        this.setLoading(true);
        try {
            const dataProcesada = {
                ...pilotoData,
                numero_carro: parseInt(pilotoData.numero_carro),
                edad: parseInt(pilotoData.edad)
            };

            await pilotoRepository.crearPiloto(dataProcesada);
            await this.cargarPilotos();
            return true;
        } catch (error) {
            this.setError(error.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    async actualizarPiloto(id, pilotoData) {
        this.setLoading(true);
        try {
            const dataProcesada = {
                ...pilotoData,
                numero_carro: parseInt(pilotoData.numero_carro),
                edad: parseInt(pilotoData.edad)
            };

            await pilotoRepository.actualizarPiloto(id, dataProcesada);
            await this.cargarPilotos();
            return true;
        } catch (error) {
            this.setError(error.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    async eliminarPiloto(id) {
        this.setLoading(true);
        try {
            await pilotoRepository.eliminarPiloto(id);
            await this.cargarPilotos();
            return true;
        } catch (error) {
            this.setError(error.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    // Validaciones
    validarPiloto(data) {
        const errores = {};

        if (!data.nombre_completo) errores.nombre_completo = 'El nombre completo es requerido';
        if (!data.nacionalidad) errores.nacionalidad = 'La nacionalidad es requerida';
        if (!data.nombre_equipo) errores.nombre_equipo = 'El nombre del equipo es requerido';

        if (!data.numero_carro || parseInt(data.numero_carro) <= 0) {
            errores.numero_carro = 'El número del carro debe ser mayor a 0';
        }

        const edad = parseInt(data.edad);
        if (!data.edad || edad < 18 || edad > 99) {
            errores.edad = 'La edad debe estar entre 18 y 99 años';
        }

        return Object.keys(errores).length === 0 ? null : errores;
    }
}

export default new PilotoStore();