import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Alert, DatePicker, Space, Typography, Select, Table } from 'antd';
import { DollarCircleOutlined, CreditCardOutlined, LineChartOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import { getProfitAnalytics } from '../services/api';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Helper format Rupiah
const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

const ProfitPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State untuk filter
    const [dateRange, setDateRange] = useState(null);
    const [sourceType, setSourceType] = useState(''); // '', 'utama', atau 'ecommerce'

    const fetchProfit = async (start, end, source) => {
        setLoading(true);
        setError(null);
        try {
            const startStr = start ? start.format('YYYY-MM-DD') : '';
            const endStr = end ? end.format('YYYY-MM-DD') : '';

            const response = await getProfitAnalytics(startStr, endStr, source);
            setData(response.data.data);
        } catch (err) {
            setError('Gagal memuat data profit.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Muat data awal (default filter)
        fetchProfit(null, null, '');
    }, []);

    // Handler saat tanggal berubah
    const handleDateChange = (dates) => {
        setDateRange(dates);
        if (dates) {
            fetchProfit(dates[0], dates[1], sourceType);
        } else {
            fetchProfit(null, null, sourceType);
        }
    };

    // Handler saat source type berubah
    const handleSourceChange = (value) => {
        setSourceType(value);
        if (dateRange) {
            fetchProfit(dateRange[0], dateRange[1], value);
        } else {
            fetchProfit(null, null, value);
        }
    };

    // Konfigurasi untuk Kolom Tabel Daily Summary
    const columns = [
        {
            title: 'Tanggal',
            dataIndex: 'date',
            key: 'date',
            render: (text) => new Date(text).toLocaleDateString('id-ID'),
        },
        {
            title: 'Tipe Sumber',
            dataIndex: 'source_type',
            key: 'source_type',
            render: (text) => text === 'utama' ? 'Jasa' : 'E-commerce',
        },
        {
            title: 'Gross Profit',
            dataIndex: 'total_gross_profit',
            key: 'total_gross_profit',
            render: (value) => formatter.format(value),
            align: 'right',
        },
        {
            title: 'Gateway Fee',
            dataIndex: 'total_gateway_fee',
            key: 'total_gateway_fee',
            render: (value) => formatter.format(value),
            align: 'right',
        },
        {
            title: 'Net Profit',
            dataIndex: 'total_net_profit',
            key: 'total_net_profit',
            render: (value) => formatter.format(value),
            align: 'right',
        },
    ];

    // Konfigurasi Grafik Gateway Fee
    const chartConfig = {
        data: data?.daily_summary?.map(item => ({
            date: new Date(item.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
            value: item.total_gateway_fee,
            type: item.source_type === 'utama' ? 'Jasa' : 'E-commerce',
        })) ?? [],
        xField: 'date',
        yField: 'value',
        seriesField: 'type',
        isStack: true,
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
            value: { alias: 'Gateway Fee (IDR)' },
        },
        color: ['#3f8600', '#faad14'],
    };

    if (loading && !data) {
        return <Spin size="large" style={{ display: 'block', marginTop: 50 }} />;
    }

    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    return (
        <>
            {/* Header dengan Filter */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <Title level={3} style={{ margin: 0 }}>Analisis Profit Platform</Title>
                
                <Space wrap>
                    <span style={{ color: '#666' }}>Tipe Sumber:</span>
                    <Select
                        value={sourceType}
                        onChange={handleSourceChange}
                        style={{ width: 150 }}
                    >
                        <Option value="">Semua</Option>
                        <Option value="utama">Jasa</Option>
                        <Option value="ecommerce">E-commerce</Option>
                    </Select>

                    <span style={{ color: '#666', marginLeft: 8 }}>Periode:</span>
                    <RangePicker
                        onChange={handleDateChange}
                        value={dateRange}
                        style={{ width: 250 }}
                    />
                </Space>
            </div>

            {/* Kartu Statistik Total */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card bordered={false} style={{ background: '#f0f5ff', borderColor: '#adc6ff' }}>
                        <Statistic
                            title="Total Gross Profit"
                            value={data ? formatter.format(data.total_summary.total_gross_profit) : 0}
                            prefix={<LineChartOutlined />}
                            valueStyle={{ color: '#1677ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card bordered={false} style={{ background: '#fff7e6', borderColor: '#ffd591' }}>
                        <Statistic
                            title="Total Gateway Fee"
                            value={data ? formatter.format(data.total_summary.total_gateway_fee) : 0}
                            prefix={<CreditCardOutlined />}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card bordered={false} style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
                        <Statistic
                            title="Total Net Profit"
                            value={data ? formatter.format(data.total_summary.total_net_profit) : 0}
                            prefix={<DollarCircleOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Grafik Gateway Fee Harian */}
            {/* <Card title="Tren Gateway Fee Harian" style={{ marginTop: 24 }}>
                {data?.daily_summary?.length > 0 ? (
                    <Column {...chartConfig} height={300} />
                ) : (
                    <Alert message="Tidak ada data untuk periode ini." type="info" showIcon />
                )}
            </Card> */}

            {/* Tabel Detail Harian */}
            <Card title="Detail Profit Harian" style={{ marginTop: 24 }}>
                <Table
                    dataSource={data?.daily_summary ?? []}
                    columns={columns}
                    rowKey={(record) => `${record.date}-${record.source_type}`}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} entries`,
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>
        </>
    );
};

export default ProfitPage;