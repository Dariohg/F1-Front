import { makeAutoObservable } from 'mobx';
import circuitoRepository from '../../infrastructure/repositories/CircuitoRepository';

class CircuitoStore {
    circuitos = [];
    circuitoActual = null;
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

    setCircuitos(circuitos) {
        this.circuitos = circuitos;
    }

    setCircuitoActual(circuito) {
        this.circuitoActual = circuito;
    }

    // Acciones
    async cargarCircuitos() {
        this.setLoading(true);
        try {
            const response = await circuitoRepository.obtenerCircuitos();
            this.setCircuitos(response);
        } catch (error) {
            this.setError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async crearCircuito(circuitoData) {
        this.setLoading(true);
        try {
            await circuitoRepository.crearCircuito(circuitoData);
            await this.cargarCircuitos();
            return true;
        } catch (error) {
            this.setError(error.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    async actualizarCircuito(id, circuitoData) {
        this.setLoading(true);
        try {
            await circuitoRepository.actualizarCircuito(id, circuitoData);
            await this.cargarCircuitos();
            return true;
        } catch (error) {
            this.setError(error.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    async eliminarCircuito(id) {
        this.setLoading(true);
        try {
            await circuitoRepository.eliminarCircuito(id);
            await this.cargarCircuitos();
            return true;
        } catch (error) {
            this.setError(error.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    // Validaciones
    validarCircuito(data) {
        const errores = {};

        if (!data.nombre) errores.nombre = 'El nombre es requerido';
        if (!data.pais) errores.pais = 'El país es requerido';
        if (!data.longitud || data.longitud <= 0) errores.longitud = 'La longitud debe ser mayor a 0';
        if (!data.numero_vueltas || data.numero_vueltas <= 0) errores.numero_vueltas = 'El número de vueltas debe ser mayor a 0';
        if (!data.numero_curvas || data.numero_curvas <= 0) errores.numero_curvas = 'El número de curvas debe ser mayor a 0';

        return Object.keys(errores).length === 0 ? null : errores;
    }
}

export default new CircuitoStore();