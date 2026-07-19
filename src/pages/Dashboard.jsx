import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Alert, List, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import { getDashboardStats } from '../services/api';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

// Helper untuk format Rupiah
const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await getDashboardStats();
                // Set state dengan data dari API (data.data)
                setStats(response.data.data);
            // eslint-disable-next-line no-unused-vars
            } catch (err) {
                setError('Gagal memuat data dashboard.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Penjaga 1: Menampilkan loading spinner saat data diambil
    if (loading) {
        return <Spin size="large" style={{ display: 'block', marginTop: 50 }} />;
    }

    // Penjaga 2: Menampilkan pesan error jika API gagal
    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    // [PERBAIKAN DI SINI]
    // Penjaga 3: Jangan render jika loading selesai TAPI data 'stats' masih null.
    // Ini adalah perbaikan untuk error Anda.
    if (!stats) {
        return <Alert message="Info" description="Data tidak ditemukan." type="info" showIcon />;
    }

    // --- Mulai dari sini, kode aman karena 'stats' dijamin terisi ---

    // Siapkan data untuk antrean "Butuh Tindakan"
    const actionQueueData = [
        { title: 'Payouts Menunggu Transfer', count: stats.action_queue.pending_payouts, link: '/payouts' },
        { title: 'Verifikasi Dokumen Tertunda', count: stats.action_queue.pending_verifications, link: '/verifications' },
        // { title: 'Sengketa Dibuka', count: stats.actionQueue.open_disputes, link: '/disputes' },
    ];

    return (
        <>
            {/* 1. Widget Statistik Utama (KPIs) */}
            <Title level={3} style={{ marginBottom: 24 }}>Dashboard Utama</Title>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="Pendapatan (30 Hari)"
                            value={formatter.format(stats.kpis.total_revenue_monthly)}
                            precision={0}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<ArrowUpOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="Payout Tertunda"
                            value={formatter.format(stats.kpis.pending_payouts_total)}
                            precision={0}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic title="Pengguna Baru (30 Hari)" value={stats.kpis.new_users_monthly} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic title="Proyek Aktif" value={stats.kpis.active_projects} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                {/* 2. Antrean "Butuh Tindakan" */}
                <Col xs={24} md={8}>
                    <Card title="Butuh Tindakan">
                        <List
                            itemLayout="horizontal"
                            dataSource={actionQueueData}
                            renderItem={(item) => (
                                <List.Item
                                    actions={[<Link to={item.link}>Lihat</Link>]}
                                >
                                    <List.Item.Meta
                                        title={<Link to={item.link}>{item.title}</Link>}
                                        description={<Text strong style={{ color: item.count > 0 ? '#cf1322' : 'inherit' }}>{item.count} item</Text>}
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                {/* 3. Grafik Tren Pendapatan */}
                <Col xs={24} md={16}>
                    <Card title="Tren Pendapatan (30 Hari)">
                        <Line
                            data={stats.revenue_trend}
                            xField="date"
                            yField="value"
                            height={250}
                            yAxis={{ title: { text: 'Rupiah (Rp)' } }}
                            xAxis={{ title: { text: 'Tanggal' } }}
                        />
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default Dashboard;