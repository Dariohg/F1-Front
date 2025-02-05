import React from 'react';
import { Modal, Form, Input, notification } from 'antd';
import pilotoRepository from '../../infrastructure/repositories/PilotoRepository';

// eslint-disable-next-line react/prop-types
const EditPilotoModal = ({ visible, piloto, onCancel, onSuccess }) => {
    const [form] = Form.useForm();

    React.useEffect(() => {
        if (visible && piloto) {
            form.setFieldsValue(piloto);
        }
    }, [visible, piloto, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            // eslint-disable-next-line react/prop-types
            await pilotoRepository.actualizarPiloto(piloto.id, {
                ...values,
                numero_carro: parseInt(values.numero_carro),
                edad: parseInt(values.edad)
            });

            notification.success({
                message: 'Éxito',
                description: 'Piloto actualizado correctamente',
            });

            onSuccess();
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            notification.error({
                message: 'Error',
                description: 'Error al actualizar el piloto',
            });
        }
    };

    return (
        <Modal
            title="Editar Piloto"
            open={visible}
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
                    name="nombre_completo"
                    label="Nombre Completo"
                    rules={[{ required: true, message: 'Por favor ingresa el nombre completo' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="nacionalidad"
                    label="Nacionalidad"
                    rules={[{ required: true, message: 'Por favor ingresa la nacionalidad' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="nombre_equipo"
                    label="Nombre del Equipo"
                    rules={[{ required: true, message: 'Por favor ingresa el nombre del equipo' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="numero_carro"
                    label="Número del Carro"
                    rules={[
                        { required: true, message: 'Por favor ingresa el número del carro' },
                        {
                            validator: async (_, value) => {
                                if (value && parseInt(value) <= 0) {
                                    throw new Error('El número del carro debe ser mayor a 0');
                                }
                            }
                        }
                    ]}
                >
                    <Input type="number" />
                </Form.Item>

                <Form.Item
                    name="edad"
                    label="Edad"
                    rules={[
                        { required: true, message: 'Por favor ingresa la edad' },
                        {
                            validator: async (_, value) => {
                                const edad = parseInt(value);
                                if (value && (edad < 18 || edad > 99)) {
                                    throw new Error('La edad debe estar entre 18 y 99 años');
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

export default EditPilotoModal;