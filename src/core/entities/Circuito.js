export class Circuito {
    constructor({ nombre, pais, longitud, numero_vueltas, numero_curvas, tiempo_promedio_vuelta }) {
        this.nombre = nombre;
        this.pais = pais;
        this.longitud = longitud;
        this.numero_vueltas = numero_vueltas;
        this.numero_curvas = numero_curvas;
        this.tiempo_promedio_vuelta = tiempo_promedio_vuelta;
    }
}