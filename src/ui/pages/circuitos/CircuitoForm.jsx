import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Form, Input, Button, notification, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { CircuitoViewModel } from '../../../viewModels/circuitos/CircuitoViewModel';
import styles from '../../../styles/components/Form.module.css';

const CircuitoForm = observer(() => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams();
    const circuitoViewModel = new CircuitoViewModel();

    useEffect(() => {
        if (id) {
            cargarCircuito();
        }
    }, [id]);

    const cargarCircuito = async () => {
        const success = await circuitoViewModel.cargar(id);
        if (success) {
            form.setFieldsValue(circuitoViewModel.circuito);
        } else {
            notification.error({
                message: 'Error',
                description: circuitoViewModel.error || 'Error al cargar el circuito'
            });
            navigate('/circuitos');
        }
    };

    const onFinish = async (values) => {
        const success = await circuitoViewModel.guardar(values);

        if (success) {
            notification.success({
                message: 'Éxito',
                description: `El circuito ha sido ${id ? 'actualizado' : 'creado'} exitosamente.`,
            });
            form.resetFields();
            navigate('/circuitos');
        } else {
            notification.error({
                message: 'Error',
                description: circuitoViewModel.error || `Error al ${id ? 'actualizar' : 'crear'} el circuito.`,
            });
        }
    };

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.formTitle}>{id ? 'Editar' : 'Agregar'} Circuito</h1>
            <div className={styles.formSection}>
                <Spin spinning={circuitoViewModel.loading}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        disabled={circuitoViewModel.loading}
                    >
                        <Form.Item
                            label="Nombre"
                            name="nombre"
                            rules={[{ required: true, message: 'Por favor, ingresa el nombre del circuito.' }]}
                            validateStatus={circuitoViewModel.formErrors.nombre ? 'error' : ''}
                            help={circuitoViewModel.formErrors.nombre}
                        >
                            <Input placeholder="Ej: Circuito de Mónaco" />
                        </Form.Item>

                        <Form.Item
                            label="País"
                            name="pais"
                            rules={[{ required: true, message: 'Por favor, ingresa el país del circuito.' }]}
                            validateStatus={circuitoViewModel.formErrors.pais ? 'error' : ''}
                            help={circuitoViewModel.formErrors.pais}
                        >
                            <Input placeholder="Ej: Mónaco" />
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
                            validateStatus={circuitoViewModel.formErrors.longitud ? 'error' : ''}
                            help={circuitoViewModel.formErrors.longitud}
                        >
                            <Input
                                type="number"
                                step="0.001"
                                placeholder="Ej: 3.337"
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
                            validateStatus={circuitoViewModel.formErrors.numero_vueltas ? 'error' : ''}
                            help={circuitoViewModel.formErrors.numero_vueltas}
                        >
                            <Input
                                type="number"
                                min="1"
                                placeholder="Ej: 78"
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
                            validateStatus={circuitoViewModel.formErrors.numero_curvas ? 'error' : ''}
                            help={circuitoViewModel.formErrors.numero_curvas}
                        >
                            <Input
                                type="number"
                                min="1"
                                placeholder="Ej: 19"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                className={styles.submitButton}
                                loading={circuitoViewModel.loading}
                            >
                                {id ? 'Actualizar' : 'Agregar'} Circuito
                            </Button>
                        </Form.Item>
                    </Form>
                </Spin>
            </div>
        </div>
    );
});

export default CircuitoForm;