import { makeAutoObservable, runInAction } from 'mobx';
import pilotoRepository from '../../infrastructure/repositories/PilotoRepository';

class PilotoListViewModel {
    pilotos = [];
    loading = false;
    error = null;

    constructor() {
        makeAutoObservable(this);
    }

    setPilotos(pilotos) {
        this.pilotos = pilotos;
    }

    setLoading(status) {
        this.loading = status;
    }

    setError(error) {
        this.error = error;
    }

    async cargarPilotos() {
        this.setLoading(true);
        try {
            const response = await pilotoRepository.obtenerPilotos();
            runInAction(() => {
                this.setPilotos(response);
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
}

export default new PilotoListViewModel();