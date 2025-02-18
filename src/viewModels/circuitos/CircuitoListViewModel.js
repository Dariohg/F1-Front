import { makeAutoObservable, runInAction } from 'mobx';
import circuitoRepository from '../../infrastructure/repositories/CircuitoRepository';

class CircuitoListViewModel {
    circuitos = [];
    circuitoSeleccionado = null;
    loading = false;
    error = null;

    constructor() {
        makeAutoObservable(this);
    }

    // Setters
    setCircuitos(circuitos) {
        this.circuitos = circuitos;
    }

    setLoading(status) {
        this.loading = status;
    }

    setError(error) {
        this.error = error;
    }

    setCircuitoSeleccionado(circuito) {
        this.circuitoSeleccionado = circuito;
    }

    // Getters
    get circuitosFiltrados() {
        return this.circuitos;
    }

    // Acciones
    async cargarCircuitos() {
        this.setLoading(true);
        try {
            const response = await circuitoRepository.obtenerCircuitos();
            runInAction(() => {
                this.setCircuitos(response);
            });
            return true;
        } catch (error) {
            runInAction(() => {
                this.setError(error.message);
            });
            return false;
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
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
}

export default new CircuitoListViewModel();