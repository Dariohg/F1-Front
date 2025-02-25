// src/utils/jsonHelpers.js

/**
 * Extrae el primer objeto JSON válido de una cadena que puede contener múltiples objetos JSON concatenados
 * @param {string} jsonString - Cadena que puede contener uno o más objetos JSON
 * @returns {Object|null} El primer objeto JSON extraído o null si hay un error
 */
export function extractFirstJsonObject(jsonString) {
    if (typeof jsonString !== 'string') {
        return jsonString; // Si no es una cadena, devolver tal cual
    }

    try {
        // Prueba simple: si ya es un JSON válido, devuélvelo
        return JSON.parse(jsonString);
    } catch (error) {
        // Si falla, intenta extraer el primer objeto JSON válido
        try {
            // Busca el final del primer objeto JSON (primer corchete cerrado)
            const firstObjectEndIndex = jsonString.indexOf('}') + 1;
            if (firstObjectEndIndex > 0) {
                const firstObject = jsonString.substring(0, firstObjectEndIndex);
                return JSON.parse(firstObject);
            }
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
        }
    }

    return null;
}

/**
 * Extrae todos los objetos JSON válidos de una cadena que contiene múltiples objetos JSON concatenados
 * @param {string} jsonString - Cadena que contiene uno o más objetos JSON concatenados
 * @returns {Array} Array de objetos JSON extraídos
 */
export function extractAllJsonObjects(jsonString) {
    if (typeof jsonString !== 'string') {
        return Array.isArray(jsonString) ? jsonString : [jsonString];
    }

    const result = [];
    let remaining = jsonString;

    // Mientras quede texto para procesar
    while (remaining.length > 0) {
        try {
            // Intentar parsear todo el texto restante
            const parsedObject = JSON.parse(remaining);
            result.push(parsedObject);
            break; // Si se pudo parsear todo, terminar
        } catch (error) {
            // Buscar el primer corchete cerrado
            const closeBraceIndex = remaining.indexOf('}');

            if (closeBraceIndex === -1) {
                // No hay más objetos JSON, salir
                break;
            }

            try {
                // Extraer el primer objeto y añadirlo al resultado
                const objStr = remaining.substring(0, closeBraceIndex + 1);
                const parsedObj = JSON.parse(objStr);
                result.push(parsedObj);

                // Continuar con el resto del texto
                remaining = remaining.substring(closeBraceIndex + 1);
            } catch (parseError) {
                // Si no se puede parsear, avanzar un carácter y seguir intentando
                remaining = remaining.substring(1);
            }
        }
    }

    return result;
}

/**
 * Convierte una respuesta de la API que puede contener múltiples objetos JSON a un objeto
 * utilizable, extrayendo el objeto más reciente según el poll_number
 * @param {string|Object} response - Respuesta de la API
 * @returns {Object|null} El objeto JSON más reciente o null en caso de error
 */
export function parseApiResponse(response) {
    // Si ya es un objeto, devolverlo
    if (response && typeof response === 'object' && !Array.isArray(response)) {
        return response;
    }

    // Extraer todos los objetos JSON de la respuesta
    const objects = extractAllJsonObjects(response);

    if (objects.length === 0) {
        return null;
    }

    // Si solo hay un objeto, devolverlo
    if (objects.length === 1) {
        return objects[0];
    }

    // Si hay múltiples objetos, devolver el que tenga el poll_number más alto
    return objects.reduce((latest, current) => {
        if (!latest || (current.poll_number > latest.poll_number)) {
            return current;
        }
        return latest;
    }, null);
}