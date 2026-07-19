import React from 'react';
import { Form, Input, Button, Alert, Card, Layout, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';

const { Content } = Layout;
const { Title } = Typography;

const Login = () => {
    const { token, login, loading, error } = useAuth();
    const navigate = useNavigate();

    // Jika sudah login, lempar ke dashboard
    if (token) {
        return <Navigate to="/" replace />;
    }

    const onFinish = async (values) => {
        // Panggil fungsi login dari AuthContext
        const success = await login(values.email, values.password);
        if (success) {
            // Jika berhasil, arahkan ke halaman utama admin
            navigate('/');
        }
    };

    return (
        <Layout style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f0f2f5' }}>
            <Content>
                <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <Title level={3}>AgroLink Admin Panel</Title>
                    </div>

                    <Form
                        name="admin_login"
                        onFinish={onFinish}
                        autoComplete="off"
                    >
                        {/* Tampilkan error jika ada */}
                        {error && (
                            <Form.Item>
                                <Alert message={error} type="error" showIcon />
                            </Form.Item>
                        )}

                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Silakan masukkan email Anda!' },
                                { type: 'email', message: 'Format email tidak valid!' }
                            ]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Email" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Silakan masukkan password Anda!' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading} // Tombol akan loading saat API dipanggil
                                style={{ width: '100%' }}
                            >
                                Login
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Content>
        </Layout>
    );
};

export default Login;