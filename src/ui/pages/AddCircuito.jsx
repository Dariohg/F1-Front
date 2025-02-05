import React, { useState } from 'react';
import { Form, Input, Button, notification, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import crearCircuitoUseCase from '../../core/useCases/crearCircuito';
import circuitoRepository from '../../infrastructure/repositories/CircuitoRepository';
import styles from '../../styles/components/Form.module.css';

function AddCircuito() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            // Convertir explícitamente los valores numéricos
            const circuitoData = {
                ...values,
                longitud: parseFloat(values.longitud),
                numero_vueltas: parseInt(values.numero_vueltas),
                numero_curvas: parseInt(values.numero_curvas)
            };

            const crearCircuito = crearCircuitoUseCase(circuitoRepository);
            await crearCircuito(circuitoData);

            notification.success({
                message: 'Éxito',
                description: 'El circuito ha sido creado exitosamente.',
            });

            form.resetFields();
            navigate('/');
        } catch (error) {
            notification.error({
                message: 'Error',
                description: error.message || 'Hubo un problema al crear el circuito. Por favor, intenta nuevamente.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.formTitle}>Agregar Circuito</h1>
            <div className={styles.formSection}>
                <Spin spinning={loading}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        disabled={loading}
                    >
                        <Form.Item
                            label="Nombre"
                            name="nombre"
                            rules={[{ required: true, message: 'Por favor, ingresa el nombre del circuito.' }]}
                        >
                            <Input placeholder="Ej: Circuito de México" />
                        </Form.Item>

                        <Form.Item
                            label="País"
                            name="pais"
                            rules={[{ required: true, message: 'Por favor, ingresa el país del circuito.' }]}
                        >
                            <Input placeholder="Ej: México" />
                        </Form.Item>

                        <Form.Item
                            label="Longitud (km)"
                            name="longitud"
                            rules={[
                                { required: true, message: 'Por favor, ingresa la longitud del circuito.' },
                                {
                                    validator: async (_, value) => {
                                        if (value && parseFloat(value) <= 0) {
                                            throw new Error('La longitud debe ser un número positivo.');
                                        }
                                    }
                                }
                            ]}
                        >
                            <Input
                                type="number"
                                step="0.001"
                                placeholder="Ej: 4.337"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Número de Vueltas"
                            name="numero_vueltas"
                            rules={[
                                { required: true, message: 'Por favor, ingresa el número de vueltas.' },
                                {
                                    validator: async (_, value) => {
                                        if (value && parseInt(value) <= 0) {
                                            throw new Error('El número de vueltas debe ser mayor a 0.');
                                        }
                                    }
                                }
                            ]}
                        >
                            <Input
                                type="number"
                                min="1"
                                placeholder="Ej: 71"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Número de Curvas"
                            name="numero_curvas"
                            rules={[
                                { required: true, message: 'Por favor, ingresa el número de curvas.' },
                                {
                                    validator: async (_, value) => {
                                        if (value && parseInt(value) <= 0) {
                                            throw new Error('El número de curvas debe ser mayor a 0.');
                                        }
                                    }
                                }
                            ]}
                        >
                            <Input
                                type="number"
                                min="1"
                                placeholder="Ej: 16"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                className={styles.submitButton}
                                loading={loading}
                            >
                                Agregar Circuito
                            </Button>
                        </Form.Item>
                    </Form>
                </Spin>
            </div>
        </div>
    );
}

export default AddCircuito;