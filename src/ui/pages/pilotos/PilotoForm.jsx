import  { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Form, Input, Button, notification, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { PilotoViewModel } from '../../../viewModels/pilotos/PilotoViewModel';
import styles from '../../../styles/components/Form.module.css';

const PilotoForm = observer(() => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams();
    const pilotoViewModel = new PilotoViewModel();

    useEffect(() => {
        if (id) {
            cargarPiloto();
        }
    }, [id]);

    const cargarPiloto = async () => {
        const success = await pilotoViewModel.cargar(id);
        if (success) {
            form.setFieldsValue(pilotoViewModel.piloto);
        } else {
            notification.error({
                message: 'Error',
                description: pilotoViewModel.error || 'Error al cargar el piloto'
            });
            navigate('/pilotos');
        }
    };

    const onFinish = async (values) => {
        const success = await pilotoViewModel.guardar(values);

        if (success) {
            notification.success({
                message: 'Éxito',
                description: `El piloto ha sido ${id ? 'actualizado' : 'creado'} exitosamente.`,
            });
            form.resetFields();
            navigate('/pilotos');
        } else {
            notification.error({
                message: 'Error',
                description: pilotoViewModel.error || `Error al ${id ? 'actualizar' : 'crear'} el piloto.`,
            });
        }
    };

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.formTitle}>{id ? 'Editar' : 'Agregar'} Piloto</h1>
            <div className={styles.formSection}>
                <Spin spinning={pilotoViewModel.loading}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        disabled={pilotoViewModel.loading}
                    >
                        <Form.Item
                            label="Nombre Completo"
                            name="nombre_completo"
                            rules={[{ required: true, message: 'Por favor, ingresa el nombre completo del piloto.' }]}
                            validateStatus={pilotoViewModel.formErrors.nombre_completo ? 'error' : ''}
                            help={pilotoViewModel.formErrors.nombre_completo}
                        >
                            <Input placeholder="Ej: Max Verstappen" />
                        </Form.Item>

                        <Form.Item
                            label="Nacionalidad"
                            name="nacionalidad"
                            rules={[{ required: true, message: 'Por favor, ingresa la nacionalidad del piloto.' }]}
                            validateStatus={pilotoViewModel.formErrors.nacionalidad ? 'error' : ''}
                            help={pilotoViewModel.formErrors.nacionalidad}
                        >
                            <Input placeholder="Ej: Holanda" />
                        </Form.Item>

                        <Form.Item
                            label="Nombre del Equipo"
                            name="nombre_equipo"
                            rules={[{ required: true, message: 'Por favor, ingresa el nombre del equipo.' }]}
                            validateStatus={pilotoViewModel.formErrors.nombre_equipo ? 'error' : ''}
                            help={pilotoViewModel.formErrors.nombre_equipo}
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
                            validateStatus={pilotoViewModel.formErrors.numero_carro ? 'error' : ''}
                            help={pilotoViewModel.formErrors.numero_carro}
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
                            validateStatus={pilotoViewModel.formErrors.edad ? 'error' : ''}
                            help={pilotoViewModel.formErrors.edad}
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
                                loading={pilotoViewModel.loading}
                            >
                                {id ? 'Actualizar' : 'Agregar'} Piloto
                            </Button>
                        </Form.Item>
                    </Form>
                </Spin>
            </div>
        </div>
    );
});

export default PilotoForm;