// src/ui/components/IncidenteAlert.jsx
import 'react';
import { Alert, Button } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

/**
 * Componente para mostrar alertas de incidentes en la carrera
 * @param {Object} incidente - Datos del incidente
 * @param {Function} onClear - Función para limpiar el incidente
 */
const IncidenteAlert = ({ incidente, onClear }) => {
    if (!incidente) return null;

    // Determinar color y emoji según tipo de incidente
    let color = 'red';
    let icon = '⚠️';

    switch (incidente.tipo_incidente) {
        case 'BANDERA_AMARILLA':
            color = '#faad14';
            icon = '🟡';
            break;
        case 'BANDERA_ROJA':
            color = '#ff4d4f';
            icon = '🔴';
            break;
        case 'DEBRIS':
            color = '#722ed1';
            icon = '🔧';
            break;
        case 'ACCIDENTE':
            color = '#ff4d4f';
            icon = '💥';
            break;
        case 'FALLO_MECANICO':
            color = '#fa8c16';
            icon = '⚙️';
            break;
        default:
            color = '#ff4d4f';
            icon = '⚠️';
    }

    // Formatear el tipo de incidente para mostrar
    const tipoIncidente = incidente.tipo_incidente.replace(/_/g, ' ');

    return (
        <Alert
            message={
                <span style={{ fontSize: '16px' }}>
                    {icon} {tipoIncidente}
                </span>
            }
            description={incidente.descripcion}
            type="error"
            showIcon
            icon={<WarningOutlined />}
            banner
            style={{
                marginBottom: 16,
                backgroundColor: color,
                borderColor: color,
                color: 'white'
            }}
            action={
                <Button
                    size="small"
                    onClick={onClear}
                    style={{ marginLeft: 16, background: 'white', color: color }}
                >
                    Limpiar incidente
                </Button>
            }
        />
    );
};

IncidenteAlert.propTypes = {
    incidente: PropTypes.shape({
        id: PropTypes.number,
        circuito_id: PropTypes.number,
        tipo_incidente: PropTypes.string,
        descripcion: PropTypes.string,
        conductor_id: PropTypes.number,
        estado: PropTypes.string,
        timestamp: PropTypes.string
    }),
    onClear: PropTypes.func.isRequired
};

export default IncidenteAlert;