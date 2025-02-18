import { makeAutoObservable } from 'mobx';
import pilotoRepository from '../../infrastructure/repositories/PilotoRepository';

export class PilotoViewModel {
    piloto = null;
    loading = false;
    error = null;
    formErrors = {};

    constructor(piloto = null) {
        this.piloto = piloto;
        makeAutoObservable(this);
    }

    // Setters
    setPiloto(piloto) {
        this.piloto = piloto;
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

    get id() {
        return this.piloto?.id;
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
            const pilotoData = {
                nombre_completo: data.nombre_completo,
                nacionalidad: data.nacionalidad,
                nombre_equipo: data.nombre_equipo,
                numero_carro: parseInt(data.numero_carro),
                edad: parseInt(data.edad)
            };

            if (this.piloto?.id) {
                // Actualizar
                await pilotoRepository.actualizarPiloto(this.piloto.id, pilotoData);
            } else {
                // Crear nuevo
                const nuevoPiloto = await pilotoRepository.crearPiloto(pilotoData);
                this.setPiloto(nuevoPiloto);
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
            const piloto = await pilotoRepository.obtenerPiloto(id);
            this.setPiloto(piloto);
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

        if (!data.nombre_completo) {
            errores.nombre_completo = 'El nombre completo es requerido';
        }

        if (!data.nacionalidad) {
            errores.nacionalidad = 'La nacionalidad es requerida';
        }

        if (!data.nombre_equipo) {
            errores.nombre_equipo = 'El nombre del equipo es requerido';
        }

        if (!data.numero_carro || parseInt(data.numero_carro) <= 0) {
            errores.numero_carro = 'El número del carro debe ser mayor a 0';
        }

        const edad = parseInt(data.edad);
        if (!data.edad || edad < 18 || edad > 99) {
            errores.edad = 'La edad debe estar entre 18 y 99 años';
        }

        return Object.keys(errores).length > 0 ? errores : null;
    }

    // Reset
    reset() {
        this.piloto = null;
        this.error = null;
        this.formErrors = {};
    }
}

export default PilotoViewModel;