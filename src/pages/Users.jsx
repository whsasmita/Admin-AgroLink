import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, Input, Select, Space, Card, Alert, Row, Col, Statistic } from 'antd';
import { UserOutlined, SearchOutlined, TeamOutlined, ToolOutlined, CarOutlined, GlobalOutlined } from '@ant-design/icons';
import { getAllUsers } from '../services/api';

const { Title } = Typography;
const { Option } = Select;

const UsersPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State untuk Filter & Paginasi
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // State untuk statistik
    const [stats, setStats] = useState({
        farmer: 0,
        worker: 0,
        driver: 0,
        general: 0
    });

    const fetchUsers = async (page, pageSize, search, role) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getAllUsers(page, pageSize, search, role);
            const result = response.data.data;

            setData(result.data);
            setPagination({
                current: result.current_page,
                pageSize: pageSize,
                total: result.total_items,
            });

            // Update statistik jika tersedia dari backend
            if (result.stats) {
                setStats(result.stats);
            }
        } catch (err) {
            setError('Gagal memuat data pengguna.');
        } finally {
            setLoading(false);
        }
    };

    // Fungsi untuk fetch statistik (jika endpoint terpisah)
    const fetchStats = async () => {
        try {
            // Jika backend menyediakan endpoint khusus untuk stats
            // const response = await getUserStats();
            // setStats(response.data.data);
            
            // Atau hitung dari semua data (fetch tanpa pagination)
            const response = await getAllUsers(1, 9999, '', ''); // Ambil semua data
            const allUsers = response.data.data.data;
            
            const newStats = {
                farmer: allUsers.filter(u => u.role === 'farmer').length,
                worker: allUsers.filter(u => u.role === 'worker').length,
                driver: allUsers.filter(u => u.role === 'driver').length,
                general: allUsers.filter(u => u.role === 'general').length,
            };
            
            setStats(newStats);
        } catch (err) {
            console.error('Gagal memuat statistik:', err);
        }
    };

    // Effect untuk memuat data saat filter berubah
    useEffect(() => {
        fetchUsers(1, pagination.pageSize, searchText, roleFilter);
    }, [searchText, roleFilter]);

    // Effect untuk memuat statistik saat mount
    useEffect(() => {
        fetchStats();
    }, []);

    // Handler ganti halaman tabel
    const handleTableChange = (newPagination) => {
        fetchUsers(newPagination.current, newPagination.pageSize, searchText, roleFilter);
    };

    const columns = [
        {
            title: 'Nama',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Peran',
            dataIndex: 'role',
            key: 'role',
            render: (role) => {
                let color = 'default';
                if (role === 'farmer') color = 'green';
                if (role === 'worker') color = 'blue';
                if (role === 'driver') color = 'orange';
                return <Tag color={color}>{role ? role.toUpperCase() : '-'}</Tag>;
            },
        },
        {
            title: 'No. Telepon',
            dataIndex: 'phone_number',
            key: 'phone_number',
            render: (phone) => phone || '-',
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive) => (
                <Tag color={isActive ? 'success' : 'error'}>
                    {isActive ? 'AKTIF' : 'NONAKTIF'}
                </Tag>
            ),
        },
        {
            title: 'Terdaftar',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString('id-ID'),
        },
    ];

    return (
        <div>
            {/* Widget Statistik */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Petani"
                            value={stats.farmer}
                            prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Pekerja"
                            value={stats.worker}
                            prefix={<ToolOutlined style={{ color: '#1890ff' }} />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Driver"
                            value={stats.driver}
                            prefix={<CarOutlined style={{ color: '#fa8c16' }} />}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Umum"
                            value={stats.general}
                            prefix={<GlobalOutlined style={{ color: '#8c8c8c' }} />}
                            valueStyle={{ color: '#8c8c8c' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Tabel Pengguna */}
            <Card>
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <Title level={3} style={{ margin: 0 }}>Manajemen Pengguna</Title>

                    <Space>
                        {/* Filter Peran */}
                        <Select
                            placeholder="Filter Peran"
                            style={{ width: 150 }}
                            allowClear
                            onChange={(value) => setRoleFilter(value || '')}
                        >
                            <Option value="farmer">Petani</Option>
                            <Option value="worker">Pekerja</Option>
                            <Option value="driver">Driver</Option>
                            <Option value="general">Umum</Option>
                        </Select>

                        {/* Pencarian */}
                        <Input
                            placeholder="Cari Nama / Email"
                            prefix={<SearchOutlined />}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 250 }}
                        />
                    </Space>
                </div>

                {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}

                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    bordered
                    scroll={{ x: 800 }}
                />
            </Card>
        </div>
    );
};

export default UsersPage;