import React, { useState } from 'react';
import { Form, Input, Button, notification } from 'antd';
import crearPilotoUseCase from '../../core/useCases/crearPiloto';
import pilotoRepository from '../../infrastructure/repositories/PilotoRepository';

function AddPiloto() {
    const [form] = Form.useForm();

    const onFinish = async (values) => {
        try {
            // Llama al caso de uso para crear un piloto
            const crearPiloto = crearPilotoUseCase(pilotoRepository);
            await crearPiloto(values);

            // Muestra una notificación de éxito
            notification.success({
                message: 'Éxito',
                description: 'El piloto ha sido creado exitosamente.',
            });

            // Reinicia el formulario
            form.resetFields();
        } catch (error) {
            // Muestra una notificación de error
            notification.error({
                message: 'Error',
                description: 'Hubo un problema al crear el piloto. Por favor, intenta nuevamente.',
            });
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Agregar Piloto</h1>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                {/* Campo para el nombre completo */}
                <Form.Item
                    label="Nombre Completo"
                    name="nombre_completo"
                    rules={[{ required: true, message: 'Por favor, ingresa el nombre completo del piloto.' }]}
                >
                    <Input placeholder="Nombre completo del piloto" />
                </Form.Item>

                {/* Campo para la nacionalidad */}
                <Form.Item
                    label="Nacionalidad"
                    name="nacionalidad"
                    rules={[{ required: true, message: 'Por favor, ingresa la nacionalidad del piloto.' }]}
                >
                    <Input placeholder="Nacionalidad del piloto" />
                </Form.Item>

                {/* Campo para el nombre del equipo */}
                <Form.Item
                    label="Nombre del Equipo"
                    name="nombre_equipo"
                    rules={[{ required: true, message: 'Por favor, ingresa el nombre del equipo.' }]}
                >
                    <Input placeholder="Nombre del equipo" />
                </Form.Item>

                {/* Campo para el número del carro */}
                <Form.Item
                    label="Número del Carro"
                    name="numero_carro"
                    rules={[
                        { required: true, message: 'Por favor, ingresa el número del carro.' },
                        { type: 'number', min: 1, message: 'El número del carro debe ser mayor a 0.' },
                    ]}
                >
                    <Input type="number" placeholder="Número del carro" />
                </Form.Item>

                {/* Campo para la edad */}
                <Form.Item
                    label="Edad"
                    name="edad"
                    rules={[
                        { required: true, message: 'Por favor, ingresa la edad del piloto.' },
                        { type: 'number', min: 18, max: 99, message: 'La edad debe estar entre 18 y 99 años.' },
                    ]}
                >
                    <Input type="number" placeholder="Edad del piloto" />
                </Form.Item>

                {/* Botón de envío */}
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Agregar Piloto
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}

export default AddPiloto;