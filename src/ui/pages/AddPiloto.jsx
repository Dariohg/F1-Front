import React, { useState } from 'react';
import { Form, Input, Button, notification, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import crearPilotoUseCase from '../../core/useCases/crearPiloto';
import pilotoRepository from '../../infrastructure/repositories/PilotoRepository';
import styles from '../../styles/components/Form.module.css';

function AddPiloto() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            // Convertir explícitamente los valores numéricos
            const pilotoData = {
                ...values,
                numero_carro: parseInt(values.numero_carro),
                edad: parseInt(values.edad)
            };

            const crearPiloto = crearPilotoUseCase(pilotoRepository);
            await crearPiloto(pilotoData);

            notification.success({
                message: 'Éxito',
                description: 'El piloto ha sido creado exitosamente.',
            });

            form.resetFields();
            navigate('/');
        } catch (error) {
            notification.error({
                message: 'Error',
                description: error.message || 'Hubo un problema al crear el piloto. Por favor, intenta nuevamente.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.formTitle}>Agregar Piloto</h1>
            <div className={styles.formSection}>
                <Spin spinning={loading}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        disabled={loading}
                    >
                        <Form.Item
                            label="Nombre Completo"
                            name="nombre_completo"
                            rules={[{ required: true, message: 'Por favor, ingresa el nombre completo del piloto.' }]}
                        >
                            <Input placeholder="Ej: Max Verstappen" />
                        </Form.Item>

                        <Form.Item
                            label="Nacionalidad"
                            name="nacionalidad"
                            rules={[{ required: true, message: 'Por favor, ingresa la nacionalidad del piloto.' }]}
                        >
                            <Input placeholder="Ej: Holanda" />
                        </Form.Item>

                        <Form.Item
                            label="Nombre del Equipo"
                            name="nombre_equipo"
                            rules={[{ required: true, message: 'Por favor, ingresa el nombre del equipo.' }]}
                        >
                            <Input placeholder="Ej: Red Bull Racing" />
                        </Form.Item>

                        <Form.Item
                            label="Número del Carro"
                            name="numero_carro"
                            rules={[
                                { required: true, message: 'Por favor, ingresa el número del carro.' },
                                {
                                    validator: async (_, value) => {
                                        if (value && parseInt(value) <= 0) {
                                            throw new Error('El número del carro debe ser mayor a 0.');
                                        }
                                    }
                                }
                            ]}
                        >
                            <Input
                                type="number"
                                min="1"
                                placeholder="Ej: 1"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Edad"
                            name="edad"
                            rules={[
                                { required: true, message: 'Por favor, ingresa la edad del piloto.' },
                                {
                                    validator: async (_, value) => {
                                        const edad = parseInt(value);
                                        if (value && (edad < 18 || edad > 99)) {
                                            throw new Error('La edad debe estar entre 18 y 99 años.');
                                        }
                                    }
                                }
                            ]}
                        >
                            <Input
                                type="number"
                                min="18"
                                max="99"
                                placeholder="Ej: 26"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                className={styles.submitButton}
                                loading={loading}
                            >
                                Agregar Piloto
                            </Button>
                        </Form.Item>
                    </Form>
                </Spin>
            </div>
        </div>
    );
}

export default AddPiloto;