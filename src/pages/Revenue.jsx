import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Alert, DatePicker, Space, Typography, Button, message } from 'antd';
import { DollarCircleOutlined, ShopOutlined, SolutionOutlined, DownloadOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots'; // Menggunakan grafik batang (Column)
import { getRevenueAnalytics, exportTransactions } from '../services/api';
// import dayjs from 'dayjs'; // Pastikan install dayjs jika belum: npm install dayjs

const { Title } = Typography;
const { RangePicker } = DatePicker;

// Helper format Rupiah
const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

const RevenuePage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    // State untuk filter tanggal (default: null = 30 hari terakhir di backend)
    const [dateRange, setDateRange] = useState(null);

    const fetchRevenue = async (start, end) => {
        setLoading(true);
        setError(null);
        try {
            // Format tanggal ke YYYY-MM-DD jika ada
            const startStr = start ? start.format('YYYY-MM-DD') : '';
            const endStr = end ? end.format('YYYY-MM-DD') : '';

            const response = await getRevenueAnalytics(startStr, endStr);
            // Pastikan kita mendapatkan data.data
            setData(response.data.data);
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setError('Gagal memuat data pendapatan.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await exportTransactions();

            // Buat URL objek dari blob
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // Buat elemen <a> sementara untuk trigger download
            const link = document.createElement('a');
            link.href = url;

            // Ambil nama file dari header (jika ada) atau set default
            const filename = `transaksi_agrolink_${ new Date().toISOString().slice(0, 10) }.xlsx`;
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();

            // Bersihkan
            link.remove();
            window.URL.revokeObjectURL(url);
            message.success('Laporan berhasil diunduh');
        } catch (err) {
            message.error('Gagal mengunduh laporan');
            console.error(err);
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        // Muat data awal (30 hari terakhir)
        fetchRevenue();
    }, []);

    // Handler saat tanggal berubah
    const handleDateChange = (dates) => {
        setDateRange(dates);
        if (dates) {
            fetchRevenue(dates[0], dates[1]);
        } else {
            fetchRevenue(); // Reset ke default
        }
    };

    // Konfigurasi Grafik
    const chartConfig = {
        // [PERBAIKAN] Gunakan optional chaining di sini juga
        data: data?.daily_trend ?? [],
        xField: 'date',
        yField: 'value',
        label: {
            position: 'middle',
            style: { fill: '#FFFFFF', opacity: 0.6 },
        },
        xAxis: {
            label: {
                autoHide: true,
                autoRotate: false,
            },
        },
        meta: {
            date: { alias: 'Tanggal' },
            value: { alias: 'Pendapatan' },
        },
        color: '#3f8600',
    };

    if (loading && !data) {
        return <Spin size="large" style={{ display: 'block', marginTop: 50 }} />;
    }

    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    return (
        <>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <Space>
                    <span style={{ color: '#666' }}>Filter Tanggal:</span>
                    <RangePicker
                        onChange={handleDateChange}
                        value={dateRange}
                        style={{ width: 250 }}
                    />
                </Space>

                <Title level={3} style={{ margin: 0 }}>Analisis Transaksi</Title>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExport}
                    loading={exporting}
                    style={{ background: '#52c41a', borderColor: '#52c41a' }} // Warna hijau Excel
                >
                    Export Excel
                </Button>
            </div>

            {/* 1. Kartu Statistik */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card bordered={false} style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
                        <Statistic
                            title="Total Pendapatan"
                            value={data ? formatter.format(data.total_revenue) : 0}
                            prefix={<DollarCircleOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="Dari Jasa (Proyek/Delivery)"
                            value={data ? formatter.format(data.revenue_by_service) : 0}
                            prefix={<SolutionOutlined />}
                            valueStyle={{ color: '#1677ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="Dari Produk (E-commerce)"
                            value={data ? formatter.format(data.revenue_by_product) : 0}
                            prefix={<ShopOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 2. Grafik Tren */}
            <Card title="Tren Pendapatan Harian" style={{ marginTop: 24 }}>
                {/* [PERBAIKAN UTAMA] Gunakan optional chaining untuk memeriksa length */}
                {data?.daily_trend?.length > 0 ? (
                    <Column {...chartConfig} height={300} />
                ) : (
                    <Alert message="Tidak ada data untuk periode ini." type="info" showIcon />
                )}
            </Card>
        </>
    );
};

export default RevenuePage;