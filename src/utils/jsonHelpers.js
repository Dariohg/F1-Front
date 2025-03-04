// src/utils/jsonHelpers.js

/**
 * Extrae todos los objetos JSON válidos de una cadena que contiene múltiples objetos JSON concatenados
 * @param {string|Object} input - Cadena o objeto que contiene uno o más objetos JSON
 * @returns {Array} Array de objetos JSON extraídos
 */
export function extractAllJsonObjects(input) {
    // Si no es una cadena, manejarlo adecuadamente
    if (typeof input !== 'string') {
        return Array.isArray(input) ? input : [input];
    }

    const objects = [];
    let startIdx = 0;
    let openBrackets = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        // Manejar strings y escapes dentro del JSON
        if (char === '"' && !escapeNext) {
            inString = !inString;
        } else if (char === '\\' && inString) {
            escapeNext = true;
            continue;
        }

        if (!inString) {
            if (char === '{') {
                if (openBrackets === 0) startIdx = i;
                openBrackets++;
            } else if (char === '}') {
                openBrackets--;
                if (openBrackets === 0) {
                    try {
                        const jsonStr = input.substring(startIdx, i + 1);
                        const obj = JSON.parse(jsonStr);
                        objects.push(obj);
                    } catch (e) {
                        console.error('Error parsing JSON object:', e);
                    }
                }
            }
        }

        escapeNext = false;
    }

    return objects;
}

/**
 * Extrae el primer objeto JSON válido de una cadena que puede contener múltiples objetos JSON concatenados
 * @param {string|Object} input - Cadena o objeto que puede contener uno o más objetos JSON
 * @returns {Object|null} El primer objeto JSON extraído o null si hay un error
 */
export function extractFirstJsonObject(input) {
    const objects = extractAllJsonObjects(input);
    return objects.length > 0 ? objects[0] : null;
}

/**
 * Convierte una respuesta de la API que puede contener múltiples objetos JSON a un objeto
 * utilizable, extrayendo el objeto más reciente según el poll_number o timestamp
 * @param {string|Object} response - Respuesta de la API
 * @returns {Object|null} El objeto JSON más reciente o null en caso de error
 */
export function parseApiResponse(response) {
    // Extraer todos los objetos JSON de la respuesta
    const objects = extractAllJsonObjects(response);

    if (objects.length === 0) {
        return null;
    }

    // Si solo hay un objeto, devolverlo
    if (objects.length === 1) {
        return objects[0];
    }

    // Si hay múltiples objetos, usar una estrategia para seleccionar el más "reciente"

    // 1. Intentar con poll_number (si existe en los objetos)
    if (Object.prototype.hasOwnProperty.call(objects[0], 'poll_number')) {
        return objects.reduce((latest, current) => {
            if (!latest || (current.poll_number > latest.poll_number)) {
                return current;
            }
            return latest;
        }, null);
    }

    // 2. Intentar con timestamp (si existe en los objetos)
    if (Object.prototype.hasOwnProperty.call(objects[0], 'timestamp')) {
        return objects.reduce((latest, current) => {
            if (!latest || new Date(current.timestamp) > new Date(latest.timestamp)) {
                return current;
            }
            return latest;
        }, null);
    }

    // 3. Si no hay criterio claro, devolver el último objeto (más reciente en la respuesta)
    return objects[objects.length - 1];
}