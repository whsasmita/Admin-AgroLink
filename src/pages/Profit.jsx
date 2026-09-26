import React, { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Spin,
  Alert,
  DatePicker,
  Space,
  Typography,
  Select,
  Table,
  Button,
  Tag,
  Tooltip,
  Progress,
  Segmented,
  Empty,
} from "antd";
import {
  DollarCircleOutlined,
  CreditCardOutlined,
  LineChartOutlined,
  BarChartOutlined,
  RiseOutlined,
  ReloadOutlined,
  CalendarOutlined,
  ShopOutlined,
  SolutionOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { Column, Area, Line } from "@ant-design/plots";
import { getProfitAnalytics, getAllTransactions, getDashboardStats } from "../services/api";
import { FaSeedling, FaRocket } from "react-icons/fa6";
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Helper format Rupiah
const formatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

const isEcommerceTx = (record) => {
  const type = String(record.layanan || record.transaction_type || record.service_type || "").toLowerCase();
  return type.includes("ecommerce") || type.includes("e-commerce") || type.includes("produk");
};

const ProfitPage = () => {
  const [data, setData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk filter
  const [dateRange, setDateRange] = useState(null);
  const [activePreset, setActivePreset] = useState("all");
  const [sourceType, setSourceType] = useState(""); // '', 'utama', atau 'ecommerce'
  const [chartView, setChartView] = useState("monthly"); // 'monthly' | 'daily' | 'cumulative'

  const fetchProfitData = async (start, end, source) => {
    setLoading(true);
    setError(null);
    try {
      const startStr = start ? dayjs(start).format("YYYY-MM-DD") : "";
      const endStr = end ? dayjs(end).format("YYYY-MM-DD") : "";

      const [profitRes, statsRes, txRes] = await Promise.allSettled([
        getProfitAnalytics(startStr, endStr, source),
        getDashboardStats(),
        getAllTransactions(1, 9999, "", "", "", "", "", startStr, endStr),
      ]);

      if (profitRes.status === "fulfilled") {
        setData(profitRes.value.data?.data || null);
      }
      if (statsRes.status === "fulfilled") {
        setDashboardStats(statsRes.value.data?.data || null);
      }
      if (txRes.status === "fulfilled") {
        const raw = txRes.value.data?.data?.data || txRes.value.data?.data || [];
        setTransactions(Array.isArray(raw) ? raw : []);
      }
    } catch (err) {
      setError("Gagal memuat data profit platform.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitData(null, null, "");
  }, []);

  // Handler saat tanggal berubah
  const handleDateChange = (dates) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      setActivePreset("custom");
      fetchProfitData(dates[0], dates[1], sourceType);
    } else {
      setActivePreset("all");
      fetchProfitData(null, null, sourceType);
    }
  };

  // Handler preset rentang waktu
  const handlePresetSelect = (presetKey) => {
    setActivePreset(presetKey);
    let start = null;
    let end = null;

    if (presetKey === "7d") {
      end = dayjs();
      start = dayjs().subtract(6, "day");
    } else if (presetKey === "30d") {
      end = dayjs();
      start = dayjs().subtract(29, "day");
    } else if (presetKey === "sebelum" || presetKey === "fase1") {
      // Periode Fase 1: 1 September 2025 s/d 31 Mei 2026
      start = dayjs("2025-09-01");
      end = dayjs("2026-05-31");
    } else if (presetKey === "sesudah" || presetKey === "fase2") {
      // Periode Fase 2: 1 Juni 2026 s/d 25 September 2026
      start = dayjs("2026-06-01");
      end = dayjs("2026-09-25");
    } else if (presetKey === "all") {
      start = null;
      end = null;
    }

    setDateRange(start && end ? [start, end] : null);
    fetchProfitData(start, end, sourceType);
  };

  // Handler saat source type berubah
  const handleSourceChange = (value) => {
    setSourceType(value);
    const start = dateRange && dateRange[0] ? dateRange[0] : null;
    const end = dateRange && dateRange[1] ? dateRange[1] : null;
    fetchProfitData(start, end, value);
  };

  // Kalkulasi metrik keuntungan
  const profitMetrics = useMemo(() => {
    let totalGrossVolume = 0;
    let totalGrossProfit = 0;
    let totalGatewayFee = 0;
    let totalNetProfit = 0;
    let serviceGrossProfit = 0;
    let ecomGrossProfit = 0;
    let transactionCount = 0;
    let successCount = 0;
    let failedCount = 0;

    const dailySummaryMap = {};

    transactions.forEach((item) => {
      const gross = item.nominal_transaksi ?? item.NominalTransaksi ?? item.amount_paid ?? 0;
      const kotor = item.keuntungan_kotor ?? item.KeuntunganKotor ?? 0;
      const fee = item.biaya_midtrans ?? item.BiayaMidtrans ?? 0;
      const bersih = item.keuntungan_bersih ?? item.KeuntunganBersih ?? 0;
      const isEcom = isEcommerceTx(item);
      const isSuccess = String(item.status_transaksi || item.StatusTransaksi || item.status).toLowerCase().includes("sukses") || item.status === "paid";

      totalGrossVolume += gross;
      totalGrossProfit += kotor;
      totalGatewayFee += fee;
      totalNetProfit += bersih;
      transactionCount += 1;

      if (isSuccess) {
        successCount += 1;
      } else {
        failedCount += 1;
      }

      if (isEcom) {
        ecomGrossProfit += kotor;
      } else {
        serviceGrossProfit += kotor;
      }

      const dateKey = dayjs(item.transaction_date || item.Tanggal || dayjs()).format("YYYY-MM-DD");
      if (!dailySummaryMap[dateKey]) {
        dailySummaryMap[dateKey] = {
          date: dateKey,
          total_gross_volume: 0,
          total_gross_profit: 0,
          total_gateway_fee: 0,
          total_net_profit: 0,
          source_type: isEcom ? "E-Commerce" : "Jasa Platform",
          count: 0,
        };
      }
      dailySummaryMap[dateKey].total_gross_volume += gross;
      dailySummaryMap[dateKey].total_gross_profit += kotor;
      dailySummaryMap[dateKey].total_gateway_fee += fee;
      dailySummaryMap[dateKey].total_net_profit += bersih;
      dailySummaryMap[dateKey].count += 1;
    });

    const servicePct = totalGrossProfit > 0 ? ((serviceGrossProfit / totalGrossProfit) * 100).toFixed(1) : "0";
    const ecomPct = totalGrossProfit > 0 ? ((ecomGrossProfit / totalGrossProfit) * 100).toFixed(1) : "0";

    const dailySummaryList = Object.values(dailySummaryMap).sort((a, b) => (a.date > b.date ? 1 : -1));

    return {
      totalGrossVolume,
      totalGrossProfit,
      totalGatewayFee,
      totalNetProfit,
      serviceGrossProfit,
      ecomGrossProfit,
      servicePct,
      ecomPct,
      dailySummaryList,
      count: transactionCount,
      successCount,
      failedCount,
    };
  }, [transactions, activePreset]);

  // Data Bulanan dari dashboardStats
  const monthlyTrendData = useMemo(() => {
    const list = dashboardStats?.monthly_profit_trend || [];
    return list.map((item) => ({
      month: item.month,
      monthLabel: item.month_label,
      netProfit: item.net_profit,
      grossProfit: item.gross_profit,
      gatewayFee: item.gateway_fee,
      cumulativeNetProfit: item.cumulative_net_profit,
      totalCount: item.total_count,
      successCount: item.success_count,
      failedCount: item.failed_count,
    }));
  }, [dashboardStats]);

  // Data Harian untuk Chart
  const dailyChartData = useMemo(() => {
    return profitMetrics.dailySummaryList.map((item) => ({
      date: dayjs(item.date).format("DD MMM"),
      fullDate: dayjs(item.date).format("DD MMMM YYYY"),
      grossProfit: item.total_gross_profit,
      gatewayFee: item.total_gateway_fee,
      netProfit: item.total_net_profit,
    }));
  }, [profitMetrics]);

  // Konfigurasi Chart Bulanan
  const monthlyColumnConfig = {
    data: monthlyTrendData,
    xField: "monthLabel",
    yField: "netProfit",
    style: {
      fill: "#10b981",
      radiusTopLeft: 4,
      radiusTopRight: 4,
    },
    scale: {
      y: { min: 0, nice: true },
    },
    axis: {
      x: { title: { text: "Bulan Transaksi (Sep 2025 – Sep 2026)" }, labelAutoRotate: false },
      y: {
        title: { text: "Keuntungan Bersih (Rp)" },
        labelFormatter: (val) => `Rp ${(val / 1000).toLocaleString("id-ID")}k`,
      },
    },
    tooltip: {
      items: [
        {
          name: "Laba Bersih",
          channel: "y",
          valueFormatter: (v) => formatter.format(v),
        },
      ],
    },
    height: 320,
  };

  // Konfigurasi Chart Kumulatif
  const cumulativeAreaConfig = {
    data: monthlyTrendData,
    xField: "monthLabel",
    yField: "cumulativeNetProfit",
    shapeField: "smooth",
    style: {
      fill: "linear-gradient(-90deg, rgba(16, 185, 129, 0.45) 0%, rgba(16, 185, 129, 0.05) 100%)",
    },
    line: { style: { stroke: "#059669", lineWidth: 3 } },
    point: { shapeField: "circle", sizeField: 4.5 },
    scale: {
      y: { min: 0, nice: true },
    },
    axis: {
      x: { title: { text: "Bulan" } },
      y: {
        title: { text: "Keuntungan Bersih Kumulatif (Rp)" },
        labelFormatter: (val) => `Rp ${(val / 1000000).toFixed(2)}jt`,
      },
    },
    tooltip: {
      items: [
        {
          name: "Total Kumulatif",
          channel: "y",
          valueFormatter: (v) => formatter.format(v),
        },
      ],
    },
    height: 320,
  };

  // Konfigurasi Chart Harian
  const dailyColumnConfig = {
    data: dailyChartData,
    xField: "date",
    yField: "netProfit",
    style: {
      fill: "#3b82f6",
      radiusTopLeft: 4,
      radiusTopRight: 4,
    },
    scale: {
      y: { min: 0, nice: true },
    },
    axis: {
      x: { title: { text: "Tanggal" }, labelAutoHide: true },
      y: {
        title: { text: "Keuntungan Bersih (Rp)" },
        labelFormatter: (val) => `Rp ${(val / 1000).toLocaleString("id-ID")}k`,
      },
    },
    tooltip: {
      items: [
        {
          name: "Net Profit Harian",
          channel: "y",
          valueFormatter: (v) => formatter.format(v),
        },
      ],
    },
    height: 320,
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* 1. Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
          background: "#fff",
          padding: "20px 24px",
          borderRadius: 12,
          border: "1px solid #f0f0f0",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Laporan Keuntungan Platform AgroLink
          </Title>
          <Text type="secondary">
            {profitMetrics.count > 0 || dashboardStats?.financial_summary
              ? `Evaluasi keuntungan bersih (Net Profit ${formatter.format(dashboardStats?.financial_summary?.total_net_profit ?? profitMetrics.totalNetProfit)}), margin komisi, dan beban gateway fee Midtrans per bulan.`
              : "Evaluasi keuntungan bersih platform, margin komisi, dan beban gateway fee Midtrans."}
          </Text>
        </div>

        <Space wrap>
          <Tooltip title="Muat ulang analitik profit">
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={() => {
                const start = dateRange && dateRange[0] ? dateRange[0] : null;
                const end = dateRange && dateRange[1] ? dateRange[1] : null;
                fetchProfitData(start, end, sourceType);
              }}
              disabled={loading}
            >
              Segarkan
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* 2. Filter Periode Cepat */}
      <Card className="modern-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <CalendarOutlined style={{ color: "#1677ff", fontSize: 16 }} />
            <Text strong style={{ color: "#374151" }}>
              Filter Periode:
            </Text>
            <Space wrap size={8}>
              <Button
                type={activePreset === "all" ? "primary" : "default"}
                onClick={() => handlePresetSelect("all")}
                size="middle"
              >
                Semua Waktu {profitMetrics.count > 0 ? `(${profitMetrics.count} Trx)` : ""}
              </Button>
              <Button
                type={activePreset === "sebelum" ? "primary" : "default"}
                onClick={() => handlePresetSelect("sebelum")}
                size="middle"
                icon={<FaSeedling style={{ color: activePreset === "sebelum" ? "#fff" : "#10b981" }} />}
              >
                Fase 1 (1 Sep 2025 – 31 Mei 2026)
              </Button>
              <Button
                type={activePreset === "sesudah" ? "primary" : "default"}
                onClick={() => handlePresetSelect("sesudah")}
                size="middle"
                icon={<FaRocket style={{ color: activePreset === "sesudah" ? "#fff" : "#8b5cf6" }} />}
              >
                Fase 2 (1 Jun 2026 – 25 Sep 2026)
              </Button>
              <Button
                type={activePreset === "30d" ? "primary" : "default"}
                onClick={() => handlePresetSelect("30d")}
                size="middle"
              >
                30 Hari Terakhir
              </Button>
              <Button
                type={activePreset === "7d" ? "primary" : "default"}
                onClick={() => handlePresetSelect("7d")}
                size="middle"
              >
                7 Hari Terakhir
              </Button>
            </Space>
          </div>

          <Space wrap align="center">
            <span style={{ color: "#666" }}>Tipe Sumber:</span>
            <Select
              value={sourceType}
              onChange={handleSourceChange}
              style={{ width: 160 }}
            >
              <Option value="">Semua Sumber</Option>
              <Option value="utama">Jasa (Utama)</Option>
              <Option value="ecommerce">E-Commerce</Option>
            </Select>

            <span style={{ color: "#666", marginLeft: 8 }}>Rentang Kustom:</span>
            <RangePicker
              value={dateRange}
              onChange={handleDateChange}
              format="DD/MM/YYYY"
              style={{ width: 250 }}
            />
          </Space>
        </div>
      </Card>

      {error && (
        <Alert
          message="Error Memuat Data"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 3. Kartu Statistik Total Keuntungan Platform */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card className="modern-card" style={{ background: "#f6ffed", border: "1px solid #b7eb8f", height: "100%" }}>
            <Statistic
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#237804", fontWeight: 700 }}>Total Keuntungan Bersih (Kumulatif)</span>
                  <Tag color="green" style={{ fontSize: 11, margin: 0 }}>
                    {profitMetrics.count} Transaksi
                  </Tag>
                </div>
              }
              value={formatter.format(profitMetrics.totalNetProfit)}
              prefix={<DollarCircleOutlined style={{ color: "#389e0d" }} />}
              valueStyle={{ color: "#237804", fontWeight: 700, fontSize: 24 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#52c41a" }}>
              Fase 1: <b>{formatter.format(dashboardStats?.financial_summary?.phase1_net_profit ?? 0)}</b> | Fase 2: <b>{formatter.format(dashboardStats?.financial_summary?.phase2_net_profit ?? 0)}</b>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="modern-card" style={{ borderLeft: "4px solid #1677ff", height: "100%" }}>
            <Statistic
              title="Komisi Kotor Platform (Gross Profit)"
              value={formatter.format(profitMetrics.totalGrossProfit)}
              prefix={<LineChartOutlined style={{ color: "#1677ff" }} />}
              valueStyle={{ color: "#1677ff", fontWeight: 700, fontSize: 22 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
              Total omset GMV: <b>{formatter.format(profitMetrics.totalGrossVolume)}</b>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="modern-card" style={{ borderLeft: "4px solid #fa8c16", height: "100%" }}>
            <Statistic
              title="Total Biaya Gateway (Midtrans)"
              value={formatter.format(profitMetrics.totalGatewayFee)}
              prefix={<CreditCardOutlined style={{ color: "#fa8c16" }} />}
              valueStyle={{ color: "#fa8c16", fontWeight: 700, fontSize: 22 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
              Biaya pemrosesan pembayaran & QRIS/E-Wallet/Bank
            </div>
          </Card>
        </Col>
      </Row>

      {/* 4. Perbandingan Profit Jasa vs E-Commerce */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card className="modern-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Statistic
                title="Profit Dari Layanan Jasa Platform"
                value={formatter.format(profitMetrics.serviceGrossProfit)}
                prefix={<SolutionOutlined style={{ color: "#1677ff" }} />}
                valueStyle={{ color: "#1677ff", fontWeight: 700 }}
              />
              <Tag color="blue" style={{ fontSize: 13, fontWeight: 700 }}>
                {profitMetrics.servicePct}%
              </Tag>
            </div>
            <Progress percent={parseFloat(profitMetrics.servicePct)} strokeColor="#1677ff" size="small" style={{ marginTop: 8 }} />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
              Pekerja (8%), Ekspedisi (11%), Chatbot (100%), Kemitraan (15%)
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card className="modern-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Statistic
                title="Profit Dari E-Commerce"
                value={formatter.format(profitMetrics.ecomGrossProfit)}
                prefix={<ShopOutlined style={{ color: "#faad14" }} />}
                valueStyle={{ color: "#d48806", fontWeight: 700 }}
              />
              <Tag color="gold" style={{ fontSize: 13, fontWeight: 700 }}>
                {profitMetrics.ecomPct}%
              </Tag>
            </div>
            <Progress percent={parseFloat(profitMetrics.ecomPct)} strokeColor="#faad14" size="small" style={{ marginTop: 8 }} />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
              Komisi 10% dari transaksi jual beli komoditas hasil tani
            </Text>
          </Card>
        </Col>
      </Row>

      {/* 5. Grafik Tren Profit Platform (Bulanan & Kumulatif Sep 2025 – Sep 2026) */}
      <Card
        className="modern-card"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LineChartOutlined style={{ color: "#1677ff", fontSize: 18 }} />
            <div>
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                Grafik Keuntungan Bersih Platform (September 2025 – September 2026)
              </span>
              <span style={{ display: "block", fontSize: 12, color: "#6b7280" }}>
                Perjalanan keuntungan bersih bulanan dan pertumbuhan kumulatif platform
              </span>
            </div>
          </div>
        }
        extra={
          <Segmented
            value={chartView}
            onChange={setChartView}
            options={[
              { label: "Bulanan", value: "monthly", icon: <BarChartOutlined /> },
              { label: "Laba Kumulatif", value: "cumulative", icon: <RiseOutlined /> },
              { label: "Harian", value: "daily", icon: <LineChartOutlined /> },
            ]}
          />
        }
        style={{ marginBottom: 24 }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 12, color: "#6b7280" }}>Memuat tren keuntungan...</div>
          </div>
        ) : chartView === "monthly" ? (
          <div style={{ width: "100%", height: 320 }}>
            <Column {...monthlyColumnConfig} />
          </div>
        ) : chartView === "cumulative" ? (
          <div style={{ width: "100%", height: 320 }}>
            <Area {...cumulativeAreaConfig} />
          </div>
        ) : dailyChartData.length > 0 ? (
          <div style={{ width: "100%", height: 320 }}>
            <Column {...dailyColumnConfig} />
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Tidak ada data profit untuk periode yang dipilih."
            style={{ margin: "40px 0" }}
          />
        )}
      </Card>

      {/* 6. Tabel Rincian Laba Bulanan Sep 2025 – Sep 2026 */}
      <Card
        className="modern-card"
        title="Tabel Rekapitulasi Keuntungan Bersih Bulanan (Sep 2025 – Sep 2026)"
      >
        <Table
          dataSource={monthlyTrendData}
          rowKey="month"
          pagination={false}
          bordered
          size="small"
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "Periode Bulan",
              dataIndex: "monthLabel",
              key: "monthLabel",
              render: (label, record) => (
                <div>
                  <Text strong>{label}</Text>
                  <Text type="secondary" style={{ display: "block", fontSize: 11 }}>
                    {record.month}
                  </Text>
                </div>
              ),
            },
            {
              title: "Sukses",
              dataIndex: "successCount",
              key: "successCount",
              align: "center",
              render: (val) => <Tag color="success">{val} trx</Tag>,
            },
            {
              title: "Gagal",
              dataIndex: "failedCount",
              key: "failedCount",
              align: "center",
              render: (val) => <Tag color={val > 0 ? "error" : "default"}>{val} trx</Tag>,
            },
            {
              title: "Total Transaksi",
              dataIndex: "totalCount",
              key: "totalCount",
              align: "center",
              render: (val) => <b>{val}</b>,
            },
            {
              title: "Keuntungan Kotor",
              dataIndex: "grossProfit",
              key: "grossProfit",
              align: "right",
              render: (val) => formatter.format(val),
            },
            {
              title: "Biaya Midtrans",
              dataIndex: "gatewayFee",
              key: "gatewayFee",
              align: "right",
              render: (val) => (
                <span style={{ color: "#fa8c16" }}>-{formatter.format(val)}</span>
              ),
            },
            {
              title: "Keuntungan Bersih (Net)",
              dataIndex: "netProfit",
              key: "netProfit",
              align: "right",
              render: (val) => (
                <span style={{ fontWeight: 700, color: "#389e0d" }}>
                  +{formatter.format(val)}
                </span>
              ),
            },
            {
              title: "Laba Bersih Kumulatif",
              dataIndex: "cumulativeNetProfit",
              key: "cumulativeNetProfit",
              align: "right",
              render: (val) => (
                <b style={{ color: "#1677ff", fontSize: 13 }}>
                  {formatter.format(val)}
                </b>
              ),
            },
          ]}
          summary={() => {
            const totalSuccess = monthlyTrendData.reduce((acc, curr) => acc + (curr.successCount || 0), 0);
            const totalFailed = monthlyTrendData.reduce((acc, curr) => acc + (curr.failedCount || 0), 0);
            const totalTrx = monthlyTrendData.reduce((acc, curr) => acc + (curr.totalCount || 0), 0);
            const totalGross = monthlyTrendData.reduce((acc, curr) => acc + (curr.grossProfit || 0), 0);
            const totalFee = monthlyTrendData.reduce((acc, curr) => acc + (curr.gatewayFee || 0), 0);
            const totalNet = monthlyTrendData.reduce((acc, curr) => acc + (curr.netProfit || 0), 0);

            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ backgroundColor: "#fafafa", fontWeight: 700 }}>
                  <Table.Summary.Cell index={0}>TOTAL ({monthlyTrendData.length} BULAN)</Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    <Tag color="success" style={{ fontWeight: 700 }}>{totalSuccess}</Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="center">
                    <Tag color="error" style={{ fontWeight: 700 }}>{totalFailed}</Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="center">{totalTrx}</Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    {formatter.format(totalGross)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right" style={{ color: "#fa8c16" }}>
                    -{formatter.format(totalFee)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right" style={{ color: "#389e0d" }}>
                    +{formatter.format(totalNet)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right" style={{ color: "#1677ff", fontSize: 14 }}>
                    {formatter.format(totalNet)}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default ProfitPage;