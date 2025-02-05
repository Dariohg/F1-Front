import React from 'react';
import { Modal, Form, Input, notification } from 'antd';
import circuitoRepository from '../../infrastructure/repositories/CircuitoRepository';

// eslint-disable-next-line react/prop-types
const EditCircuitoModal = ({ visible, circuito, onCancel, onSuccess }) => {
    const [form] = Form.useForm();

    React.useEffect(() => {
        if (visible && circuito) {
            form.setFieldsValue(circuito);
        }
    }, [visible, circuito, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            // eslint-disable-next-line react/prop-types
            await circuitoRepository.actualizarCircuito(circuito.id, {
                ...values,
                longitud: parseFloat(values.longitud),
                numero_vueltas: parseInt(values.numero_vueltas),
                numero_curvas: parseInt(values.numero_curvas)
            });

            notification.success({
                message: 'Éxito',
                description: 'Circuito actualizado correctamente',
            });

            onSuccess();
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            notification.error({
                message: 'Error',
                description: 'Error al actualizar el circuito',
            });
        }
    };

    return (
        <Modal
            title="Editar Circuito"
            visible={visible}
            onOk={handleOk}
            onCancel={onCancel}
            okText="Actualizar"
            cancelText="Cancelar"
        >
            <Form
                form={form}
                layout="vertical"
            >
                <Form.Item
                    name="nombre"
                    label="Nombre"
                    rules={[{ required: true, message: 'Por favor ingresa el nombre' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="pais"
                    label="País"
                    rules={[{ required: true, message: 'Por favor ingresa el país' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="longitud"
                    label="Longitud (km)"
                    rules={[
                        { required: true, message: 'Por favor ingresa la longitud' },
                        {
                            validator: async (_, value) => {
                                if (value && parseFloat(value) <= 0) {
                                    throw new Error('La longitud debe ser mayor a 0');
                                }
                            }
                        }
                    ]}
                >
                    <Input type="number" step="0.001" />
                </Form.Item>

                <Form.Item
                    name="numero_vueltas"
                    label="Número de Vueltas"
                    rules={[
                        { required: true, message: 'Por favor ingresa el número de vueltas' },
                        {
                            validator: async (_, value) => {
                                if (value && parseInt(value) <= 0) {
                                    throw new Error('El número de vueltas debe ser mayor a 0');
                                }
                            }
                        }
                    ]}
                >
                    <Input type="number" />
                </Form.Item>

                <Form.Item
                    name="numero_curvas"
                    label="Número de Curvas"
                    rules={[
                        { required: true, message: 'Por favor ingresa el número de curvas' },
                        {
                            validator: async (_, value) => {
                                if (value && parseInt(value) <= 0) {
                                    throw new Error('El número de curvas debe ser mayor a 0');
                                }
                            }
                        }
                    ]}
                >
                    <Input type="number" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditCircuitoModal;