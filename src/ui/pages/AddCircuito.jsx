import React, { useState } from 'react';
import { Form, Input, Button, notification } from 'antd';
import crearCircuitoUseCase from '../../core/useCases/crearCircuito';
import circuitoRepository from '../../infrastructure/repositories/CircuitoRepository';

function AddCircuito() {
    const [form] = Form.useForm();

    const onFinish = async (values) => {
        try {
            // Llama al caso de uso para crear un circuito
            const crearCircuito = crearCircuitoUseCase(circuitoRepository);
            await crearCircuito(values);

            // Muestra una notificación de éxito
            notification.success({
                message: 'Éxito',
                description: 'El circuito ha sido creado exitosamente.',
            });

            // Reinicia el formulario
            form.resetFields();
        } catch (error) {
            // Muestra una notificación de error
            notification.error({
                message: 'Error',
                description: 'Hubo un problema al crear el circuito. Por favor, intenta nuevamente.',
            });
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Agregar Circuito</h1>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                {/* Campo para el nombre */}
                <Form.Item
                    label="Nombre"
                    name="nombre"
                    rules={[{ required: true, message: 'Por favor, ingresa el nombre del circuito.' }]}
                >
                    <Input placeholder="Nombre del circuito" />
                </Form.Item>

                {/* Campo para el país */}
                <Form.Item
                    label="País"
                    name="pais"
                    rules={[{ required: true, message: 'Por favor, ingresa el país del circuito.' }]}
                >
                    <Input placeholder="País del circuito" />
                </Form.Item>

                {/* Campo para la longitud */}
                <Form.Item
                    label="Longitud (km)"
                    name="longitud"
                    rules={[
                        { required: true, message: 'Por favor, ingresa la longitud del circuito.' },
                        { type: 'number', min: 0, message: 'La longitud debe ser un número positivo.' },
                    ]}
                >
                    <Input type="number" placeholder="Longitud en kilómetros" />
                </Form.Item>

                {/* Campo para el número de vueltas */}
                <Form.Item
                    label="Número de Vueltas"
                    name="numero_vueltas"
                    rules={[
                        { required: true, message: 'Por favor, ingresa el número de vueltas.' },
                        { type: 'number', min: 1, message: 'El número de vueltas debe ser mayor a 0.' },
                    ]}
                >
                    <Input type="number" placeholder="Número de vueltas" />
                </Form.Item>

                {/* Campo para el número de curvas */}
                <Form.Item
                    label="Número de Curvas"
                    name="numero_curvas"
                    rules={[
                        { required: true, message: 'Por favor, ingresa el número de curvas.' },
                        { type: 'number', min: 1, message: 'El número de curvas debe ser mayor a 0.' },
                    ]}
                >
                    <Input type="number" placeholder="Número de curvas" />
                </Form.Item>

                {/* Botón de envío */}
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Agregar Circuito
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}

export default AddCircuito;