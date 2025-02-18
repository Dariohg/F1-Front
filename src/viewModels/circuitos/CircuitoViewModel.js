import { makeAutoObservable } from 'mobx';
import circuitoRepository from '../../infrastructure/repositories/CircuitoRepository';

export class CircuitoViewModel {
    circuito = null;
    loading = false;
    error = null;
    formErrors = {};

    constructor(circuito = null) {
        this.circuito = circuito;
        makeAutoObservable(this);
    }

    // Setters
    setCircuito(circuito) {
        this.circuito = circuito;
    }

    setLoading(status) {
        this.loading = status;
    }

    setError(error) {
        this.error = error;
    }

    setFormErrors(errors) {
        this.formErrors = errors;
    }

    // Getters
    get isValid() {
        return Object.keys(this.formErrors).length === 0;
    }

    // Acciones
    async guardar(data) {
        const errores = this.validar(data);
        if (errores) {
            this.setFormErrors(errores);
            return false;
        }

        this.setLoading(true);
        try {
            const circuitoData = {
                nombre: data.nombre,
                pais: data.pais,
                longitud: parseFloat(data.longitud),
                numero_vueltas: parseInt(data.numero_vueltas),
                numero_curvas: parseInt(data.numero_curvas)
            };

            if (this.circuito?.id) {
                await circuitoRepository.actualizarCircuito(this.circuito.id, circuitoData);
            } else {
                const nuevoCircuito = await circuitoRepository.crearCircuito(circuitoData);
                this.setCircuito(nuevoCircuito);
            }
            return true;
        } catch (error) {
            this.setError(error.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    async cargar(id) {
        this.setLoading(true);
        try {
            const circuito = await circuitoRepository.obtenerCircuito(id);
            this.setCircuito(circuito);
            return true;
        } catch (error) {
            this.setError(error.message);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    // Validaciones
    validar(data) {
        const errores = {};

        if (!data.nombre) {
            errores.nombre = 'El nombre es requerido';
        }

        if (!data.pais) {
            errores.pais = 'El país es requerido';
        }

        if (!data.longitud || parseFloat(data.longitud) <= 0) {
            errores.longitud = 'La longitud debe ser mayor a 0';
        }

        if (!data.numero_vueltas || parseInt(data.numero_vueltas) <= 0) {
            errores.numero_vueltas = 'El número de vueltas debe ser mayor a 0';
        }

        if (!data.numero_curvas || parseInt(data.numero_curvas) <= 0) {
            errores.numero_curvas = 'El número de curvas debe ser mayor a 0';
        }

        return Object.keys(errores).length > 0 ? errores : null;
    }

    // Reset
    reset() {
        this.circuito = null;
        this.error = null;
        this.formErrors = {};
    }
}

export default CircuitoViewModel;