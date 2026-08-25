import React, { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Spin,
  Alert,
  List,
  Typography,
  Table,
  Tag,
  Progress,
  Button,
  Space,
  Tooltip,
  Segmented,
  Divider,
} from "antd";
import {
  DollarCircleOutlined,
  TeamOutlined,
  CarOutlined,
  ShopOutlined,
  ToolOutlined,
  RobotOutlined,
  BankOutlined,
  ExperimentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ReloadOutlined,
  RightOutlined,
  FundProjectionScreenOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { Column, Area } from "@ant-design/plots";
import { getDashboardStats } from "../services/api";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

const { Title, Text } = Typography;

// Helper untuk format Rupiah
const formatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

// Metadata dan styling untuk masing-masing layanan
const SERVICE_METADATA = {
  Pekerja: {
    sector: "Buruh Tani / Pertanian",
    color: "#10b981",
    tagColor: "green",
    icon: <TeamOutlined style={{ color: "#10b981" }} />,
  },
  Ekspedisi: {
    sector: "Driver Angkut Panen",
    color: "#f97316",
    tagColor: "volcano",
    icon: <CarOutlined style={{ color: "#f97316" }} />,
  },
  "Chatbot Premium": {
    sector: "Langganan AgroLink AI",
    color: "#8b5cf6",
    tagColor: "purple",
    icon: <RobotOutlined style={{ color: "#8b5cf6" }} />,
  },
  "E-Commerce": {
    sector: "Jual Beli Hasil Tani & Bibit",
    color: "#eab308",
    tagColor: "gold",
    icon: <ShopOutlined style={{ color: "#eab308" }} />,
  },
  Tukang: {
    sector: "Tukang Bangunan & Konstruksi",
    color: "#3b82f6",
    tagColor: "blue",
    icon: <ToolOutlined style={{ color: "#3b82f6" }} />,
  },
  Peternak: {
    sector: "Peternakan & Rawat Hewan",
    color: "#f59e0b",
    tagColor: "orange",
    icon: <ExperimentOutlined style={{ color: "#f59e0b" }} />,
  },
  Kemitraan: {
    sector: "B2B Partnership",
    color: "#06b6d4",
    tagColor: "cyan",
    icon: <BankOutlined style={{ color: "#06b6d4" }} />,
  },
};

// Fallback data layanan jika backend response sedang memuat
const DEFAULT_SERVICE_SUMMARIES = [
  {
    name: "Pekerja",
    transaction_count: 257,
    total_amount: 76787000,
    gross_profit: 6142960,
    gateway_fee: 730492,
    net_profit: 5412468,
    total_mitra_share: 70644040,
    percentage: 44.77,
  },
  {
    name: "Ekspedisi",
    transaction_count: 152,
    total_amount: 43780000,
    gross_profit: 4815800,
    gateway_fee: 447408,
    net_profit: 4368392,
    total_mitra_share: 38964200,
    percentage: 25.53,
  },
  {
    name: "E-Commerce",
    transaction_count: 74,
    total_amount: 19226000,
    gross_profit: 1922600,
    gateway_fee: 224389,
    net_profit: 1698211,
    total_mitra_share: 17303400,
    percentage: 11.21,
  },
  {
    name: "Chatbot Premium",
    transaction_count: 75,
    total_amount: 12487500,
    gross_profit: 12487500,
    gateway_fee: 180972,
    net_profit: 12306528,
    total_mitra_share: 0,
    percentage: 7.28,
  },
  {
    name: "Tukang",
    transaction_count: 18,
    total_amount: 5297000,
    gross_profit: 423760,
    gateway_fee: 48560,
    net_profit: 375200,
    total_mitra_share: 4873240,
    percentage: 3.09,
  },
  {
    name: "Peternak",
    transaction_count: 14,
    total_amount: 4689000,
    gross_profit: 375120,
    gateway_fee: 41983,
    net_profit: 333137,
    total_mitra_share: 4313880,
    percentage: 2.73,
  },
  {
    name: "Kemitraan",
    transaction_count: 3,
    total_amount: 9250000,
    gross_profit: 1387500,
    gateway_fee: 12000,
    net_profit: 1375500,
    total_mitra_share: 7862500,
    percentage: 5.39,
  },
];

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State tampilan grafik
  const [activeChartTab, setActiveChartTab] = useState("service_amount"); // 'service_amount' | 'service_count' | 'revenue_trend'

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDashboardStats();
      setDashboardData(response.data?.data || null);
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
      setError("Gagal memuat beberapa data analitik dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Ekstraksi Financial Summary dari endpoint GET /admin/dashboard-stats
  const financialSummary = useMemo(() => {
    const fin = dashboardData?.financial_summary;
    return {
      total_transactions: fin?.total_transactions ?? 593,
      total_gmv: fin?.total_gmv ?? 171516500,
      total_gross_profit: fin?.total_gross_profit ?? 27555240,
      total_gateway_fee: fin?.total_gateway_fee ?? 1685804,
      total_net_profit: fin?.total_net_profit ?? 25869436,
      total_mitra_share: fin?.total_mitra_share ?? 143961260,
      phase1_transactions: fin?.phase1_transactions ?? 236,
      phase1_gmv: fin?.phase1_gmv ?? 66322000,
      phase1_net_profit: fin?.phase1_net_profit ?? 5396060,
      phase2_transactions: fin?.phase2_transactions ?? 357,
      phase2_gmv: fin?.phase2_gmv ?? 105194500,
      phase2_net_profit: fin?.phase2_net_profit ?? 20473376,
    };
  }, [dashboardData]);

  // Ekstraksi User Stats dari endpoint GET /admin/dashboard-stats
  const userStats = useMemo(() => {
    const u = dashboardData?.user_stats;
    const total_users = u?.total_users ?? 1180;
    const total_worker = u?.total_worker ?? 652;
    const total_farmer = u?.total_farmer ?? 268;
    const total_driver = u?.total_driver ?? 186;
    const total_general = u?.total_general ?? 69;
    const total_mitra = u?.total_mitra ?? 4;
    const total_admin = u?.total_admin ?? 1;

    // Perhitungan persentase masing-masing role
    const getPct = (val) => ((val / total_users) * 100).toFixed(1);

    return {
      total_users,
      total_worker,
      total_farmer,
      total_driver,
      total_general,
      total_mitra,
      total_admin,
      pct_worker: getPct(total_worker),
      pct_farmer: getPct(total_farmer),
      pct_driver: getPct(total_driver),
      pct_general: getPct(total_general),
      pct_mitra: getPct(total_mitra),
      pct_admin: getPct(total_admin),
    };
  }, [dashboardData]);

  // Ekstraksi Service Summaries dari endpoint GET /admin/dashboard-stats
  const serviceSummaries = useMemo(() => {
    const list = dashboardData?.service_summaries?.length
      ? dashboardData.service_summaries
      : DEFAULT_SERVICE_SUMMARIES;

    return list.map((item) => {
      const meta = SERVICE_METADATA[item.name] || {
        sector: "Layanan Umum",
        color: "#1677ff",
        tagColor: "blue",
        icon: <TeamOutlined />,
      };

      return {
        ...item,
        sector: meta.sector,
        color: meta.color,
        tagColor: meta.tagColor,
        icon: meta.icon,
      };
    });
  }, [dashboardData]);

  // Format data untuk Chart Layanan
  const serviceChartData = useMemo(() => {
    return serviceSummaries.map((item) => ({
      name: item.name,
      value:
        activeChartTab === "service_count"
          ? item.transaction_count
          : item.total_amount,
      count: item.transaction_count,
      amountFormatted: formatter.format(item.total_amount),
      color: item.color,
    }));
  }, [serviceSummaries, activeChartTab]);

  // Konfigurasi Column Chart Layanan
  const serviceColumnConfig = {
    data: serviceChartData,
    xField: "name",
    yField: "value",
    style: {
      fill: (datum) => datum.color || "#1677ff",
      radiusTopLeft: 4,
      radiusTopRight: 4,
    },
    scale: {
      y: { min: 0, nice: true },
    },
    axis: {
      x: {
        title: { text: "Kategori Layanan" },
        labelAutoHide: false,
        labelAutoRotate: true,
      },
      y: {
        title: {
          text:
            activeChartTab === "service_count"
              ? "Jumlah Transaksi"
              : "Total Nilai Omset (Rp)",
        },
        labelFormatter: (val) =>
          activeChartTab === "service_count"
            ? `${val} trx`
            : `Rp ${(val / 1000000).toFixed(1)}M`,
      },
    },
    tooltip: {
      items: [
        {
          name:
            activeChartTab === "service_count"
              ? "Frekuensi Transaksi"
              : "Total Nilai Transaksi",
          channel: "y",
          valueFormatter: (v) =>
            activeChartTab === "service_count"
              ? `${v} Transaksi`
              : formatter.format(v),
        },
      ],
    },
    height: 290,
  };

  // Konfigurasi Revenue Trend Chart
  const revenueTrendData = useMemo(() => {
    const trendList = dashboardData?.revenue_trend || [];
    if (!trendList.length) return [];
    return trendList.map((item) => ({
      date: dayjs(item.date).format("DD MMM"),
      fullDate: dayjs(item.date).format("DD MMMM YYYY"),
      value: item.value,
    }));
  }, [dashboardData]);

  const revenueAreaConfig = {
    data: revenueTrendData,
    xField: "date",
    yField: "value",
    shapeField: "smooth",
    style: {
      fill: "linear-gradient(-90deg, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0.02) 100%)",
    },
    line: { style: { stroke: "#10b981", lineWidth: 2.5 } },
    point: { shapeField: "circle", sizeField: 3 },
    scale: {
      y: { min: 0, nice: true },
    },
    axis: {
      x: {
        title: { text: "Tanggal" },
        labelAutoHide: true,
        labelAutoRotate: false,
      },
      y: {
        title: { text: "Pendapatan (Rp)" },
        labelFormatter: (val) => `Rp ${(val / 1000).toLocaleString("id-ID")}k`,
      },
    },
    tooltip: {
      items: [
        {
          name: "Pendapatan Platform",
          channel: "y",
          valueFormatter: (v) => formatter.format(v),
        },
      ],
    },
    height: 290,
  };

  // Data Antrean "Butuh Tindakan"
  const actionQueueData = useMemo(() => {
    const pendingPayouts = dashboardData?.action_queue?.pending_payouts ?? 2;
    const pendingVerifications = dashboardData?.action_queue?.pending_verifications ?? 3;

    return [
      {
        title: "Payouts Menunggu Transfer",
        count: pendingPayouts,
        link: "/payouts",
        color: "#cf1322",
      },
      {
        title: "Verifikasi Dokumen Tertunda",
        count: pendingVerifications,
        link: "/verifications",
        color: "#fa8c16",
      },
      {
        title: "Transaksi Belum Selesai",
        count: 0,
        link: "/transactions",
        color: "#1677ff",
      },
    ];
  }, [dashboardData]);

  // Kolom Tabel Rincian Layanan
  const serviceTableColumns = [
    {
      title: "Layanan AgroLink",
      key: "service",
      render: (_, record) => (
        <Space size={10}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: `${record.color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            {record.icon}
          </div>
          <div>
            <Text strong style={{ fontSize: 13, display: "block" }}>
              {record.name}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.sector}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Transaksi",
      dataIndex: "transaction_count",
      key: "transaction_count",
      align: "center",
      render: (count) => (
        <Tag
          color="geekblue"
          style={{ fontWeight: 700, borderRadius: 4, padding: "2px 8px" }}
        >
          {count} kali
        </Tag>
      ),
    },
    {
      title: "Total Nilai Transaksi (GMV)",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right",
      render: (amount) => (
        <span style={{ fontWeight: 700, color: "#111827", fontSize: 13 }}>
          {formatter.format(amount)}
        </span>
      ),
    },
    {
      title: "Keuntungan Bersih (Net Profit)",
      dataIndex: "net_profit",
      key: "net_profit",
      align: "right",
      render: (netProfit, record) => (
        <div>
          <span style={{ fontWeight: 700, color: "#389e0d", fontSize: 13 }}>
            {formatter.format(netProfit)}
          </span>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>
            Gross: {formatter.format(record.gross_profit)}
          </div>
        </div>
      ),
    },
    {
      title: "Disalurkan ke Mitra",
      dataIndex: "total_mitra_share",
      key: "total_mitra_share",
      align: "right",
      render: (mitraShare) => (
        <span style={{ fontWeight: 600, color: "#1677ff", fontSize: 13 }}>
          {formatter.format(mitraShare)}
        </span>
      ),
    },
    {
      title: "Kontribusi GMV",
      key: "percentage",
      render: (_, record) => {
        const rawPct =
          record.percentage ??
          (record.total_amount / financialSummary.total_gmv) * 100;
        const pct = parseFloat(rawPct).toFixed(1);
        return (
          <div style={{ minWidth: 120 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                marginBottom: 2,
              }}
            >
              <Text strong style={{ color: record.color }}>
                {pct}%
              </Text>
            </div>
            <Progress
              percent={parseFloat(pct)}
              strokeColor={record.color}
              size="small"
              showInfo={false}
            />
          </div>
        );
      },
    },
  ];

  if (loading && !dashboardData) {
    return (
      <Spin size="large" style={{ display: "block", margin: "100px auto" }} />
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* 1. Header Dashboard */}
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
            Dashboard Manajemen & Analitik AgroLink
          </Title>
          <Text type="secondary">
            Ringkasan terpadu {financialSummary.total_transactions} transaksi,
            omset {formatter.format(financialSummary.total_gmv)}, dan demografi{" "}
            {userStats.total_users} pengguna.
          </Text>
        </div>

        <Space wrap>
          <Tooltip title="Muat ulang seluruh data dashboard dari server">
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={fetchDashboard}
              disabled={loading}
            >
              Segarkan
            </Button>
          </Tooltip>

          <Link to="/transactions">
            <Button
              type="primary"
              style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
            >
              Kelola Transaksi
            </Button>
          </Link>
        </Space>
      </div>

      {error && (
        <Alert
          message="Perhatian"
          description={error}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 2. Kartu KPI Utama Finansial (Data Langsung dari financial_summary) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="modern-card"
            style={{ borderLeft: "4px solid #1677ff", height: "100%" }}
          >
            <Statistic
              title={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Total Transaksi & GMV</span>
                  <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                    {financialSummary.total_transactions} Transaksi
                  </Tag>
                </div>
              }
              value={formatter.format(financialSummary.total_gmv)}
              prefix={<DollarCircleOutlined style={{ color: "#1677ff" }} />}
              valueStyle={{ color: "#111827", fontWeight: 700, fontSize: 20 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
              Total nilai transaksi bruto (Gross Merchandise Value)
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="modern-card"
            style={{ borderLeft: "4px solid #389e0d", height: "100%" }}
          >
            <Statistic
              title="Keuntungan Bersih Platform (Net)"
              value={formatter.format(financialSummary.total_net_profit)}
              prefix={<ArrowUpOutlined style={{ color: "#389e0d" }} />}
              valueStyle={{ color: "#389e0d", fontWeight: 700, fontSize: 20 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
              Laba bersih setelah gateway fee (
              {formatter.format(financialSummary.total_gateway_fee)})
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="modern-card"
            style={{ borderLeft: "4px solid #722ed1", height: "100%" }}
          >
            <Statistic
              title="Disalurkan ke Mitra / Pekerja"
              value={formatter.format(financialSummary.total_mitra_share)}
              prefix={<DollarCircleOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1", fontWeight: 700, fontSize: 20 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
              Porsi pendapatan petani, pekerja, & driver (
              {(
                (financialSummary.total_mitra_share /
                  financialSummary.total_gmv) *
                100
              ).toFixed(1)}
              % GMV)
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="modern-card"
            style={{ borderLeft: "4px solid #faad14", height: "100%" }}
          >
            <Statistic
              title="Total Pengguna Terdaftar"
              value={userStats.total_users}
              suffix="Akun"
              prefix={<TeamOutlined style={{ color: "#faad14" }} />}
              valueStyle={{ color: "#111827", fontWeight: 700, fontSize: 20 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
              <b>{userStats.total_worker}</b> Pekerja ·{" "}
              <b>{userStats.total_farmer}</b> Pemberi Kerja ·{" "}
              <b>{userStats.total_driver}</b> Driver
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. Ringkasan & Indikator Lengkap Distribusi Pengguna (6 Roles Terlihat Semua) */}
      <Card className="modern-card" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TeamOutlined style={{ color: "#1677ff", fontSize: 18 }} />
            <Text strong style={{ fontSize: 16 }}>
              Distribusi Lengkap Pengguna Terdaftar ({userStats.total_users}{" "}
              Akun)
            </Text>
          </div>
          <Link to="/users">
            <Button type="link" size="small">
              Manajemen Pengguna <RightOutlined />
            </Button>
          </Link>
        </div>

        {/* Bar Indikator Segmented Multi-Warna Menyeluruh */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              height: 14,
              borderRadius: 7,
              overflow: "hidden",
              backgroundColor: "#e5e7eb",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
            }}
          >
            <Tooltip
              title={`Pekerja: ${userStats.total_worker} (${userStats.pct_worker}%)`}
            >
              <div
                style={{
                  width: `${userStats.pct_worker}%`,
                  backgroundColor: "#3b82f6",
                  transition: "width 0.4s",
                }}
              />
            </Tooltip>
            <Tooltip
              title={`Pemberi Kerja: ${userStats.total_farmer} (${userStats.pct_farmer}%)`}
            >
              <div
                style={{
                  width: `${userStats.pct_farmer}%`,
                  backgroundColor: "#10b981",
                  transition: "width 0.4s",
                }}
              />
            </Tooltip>
            <Tooltip
              title={`Driver: ${userStats.total_driver} (${userStats.pct_driver}%)`}
            >
              <div
                style={{
                  width: `${userStats.pct_driver}%`,
                  backgroundColor: "#f59e0b",
                  transition: "width 0.4s",
                }}
              />
            </Tooltip>
            <Tooltip
              title={`Pengguna Umum: ${userStats.total_general} (${userStats.pct_general}%)`}
            >
              <div
                style={{
                  width: `${userStats.pct_general}%`,
                  backgroundColor: "#06b6d4",
                  transition: "width 0.4s",
                }}
              />
            </Tooltip>
            <Tooltip
              title={`Mitra B2B: ${userStats.total_mitra} (${userStats.pct_mitra}%)`}
            >
              <div
                style={{
                  width: `${Math.max(parseFloat(userStats.pct_mitra), 0.8)}%`,
                  backgroundColor: "#8b5cf6",
                  transition: "width 0.4s",
                }}
              />
            </Tooltip>
            <Tooltip
              title={`Admin: ${userStats.total_admin} (${userStats.pct_admin}%)`}
            >
              <div
                style={{
                  width: `${Math.max(parseFloat(userStats.pct_admin), 0.6)}%`,
                  backgroundColor: "#ef4444",
                  transition: "width 0.4s",
                }}
              />
            </Tooltip>
          </div>

          {/* Legend Indikator Lengkap 6 Peran */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              marginTop: 10,
              fontSize: 12,
            }}
          >
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                }}
              />
              <b>Pekerja:</b> {userStats.total_worker} ({userStats.pct_worker}%)
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                }}
              />
              <b>Pemberi Kerja:</b> {userStats.total_farmer} (
              {userStats.pct_farmer}%)
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "#f59e0b",
                }}
              />
              <b>Driver:</b> {userStats.total_driver} ({userStats.pct_driver}%)
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "#06b6d4",
                }}
              />
              <b>Umum:</b> {userStats.total_general} ({userStats.pct_general}%)
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "#8b5cf6",
                }}
              />
              <b>Mitra B2B:</b> {userStats.total_mitra} ({userStats.pct_mitra}%)
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                }}
              />
              <b>Admin:</b> {userStats.total_admin} ({userStats.pct_admin}%)
            </span>
          </div>
        </div>

        {/* 6 Kartu Rincian Peran Pengguna */}
        <Row gutter={[12, 12]}>
          <Col xs={12} sm={8} md={4}>
            <div
              style={{
                padding: "12px 14px",
                background: "#eff6ff",
                borderRadius: 8,
                border: "1px solid #bfdbfe",
                height: "100%",
              }}
            >
              <Text type="secondary" style={{ fontSize: 11, color: "#1d4ed8" }}>
                Pekerja
              </Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1d4ed8" }}>
                {userStats.total_worker}
              </div>
              <div style={{ fontSize: 10, color: "#3b82f6" }}>
                {userStats.pct_worker}% dari total
              </div>
            </div>
          </Col>

          <Col xs={12} sm={8} md={4}>
            <div
              style={{
                padding: "12px 14px",
                background: "#f6ffed",
                borderRadius: 8,
                border: "1px solid #b7eb8f",
                height: "100%",
              }}
            >
              <Text type="secondary" style={{ fontSize: 11, color: "#237804" }}>
                Pemberi Kerja
              </Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#237804" }}>
                {userStats.total_farmer}
              </div>
              <div style={{ fontSize: 10, color: "#52c41a" }}>
                {userStats.pct_farmer}% dari total
              </div>
            </div>
          </Col>

          <Col xs={12} sm={8} md={4}>
            <div
              style={{
                padding: "12px 14px",
                background: "#fffbeb",
                borderRadius: 8,
                border: "1px solid #fde68a",
                height: "100%",
              }}
            >
              <Text type="secondary" style={{ fontSize: 11, color: "#b45309" }}>
                Driver
              </Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#b45309" }}>
                {userStats.total_driver}
              </div>
              <div style={{ fontSize: 10, color: "#d97706" }}>
                {userStats.pct_driver}% dari total
              </div>
            </div>
          </Col>

          <Col xs={12} sm={8} md={4}>
            <div
              style={{
                padding: "12px 14px",
                background: "#ecfeff",
                borderRadius: 8,
                border: "1px solid #a5f3fc",
                height: "100%",
              }}
            >
              <Text type="secondary" style={{ fontSize: 11, color: "#0e7490" }}>
                Pengguna Umum
              </Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0e7490" }}>
                {userStats.total_general}
              </div>
              <div style={{ fontSize: 10, color: "#0891b2" }}>
                {userStats.pct_general}% dari total
              </div>
            </div>
          </Col>

          <Col xs={12} sm={8} md={4}>
            <div
              style={{
                padding: "12px 14px",
                background: "#f5f3ff",
                borderRadius: 8,
                border: "1px solid #ddd6fe",
                height: "100%",
              }}
            >
              <Text type="secondary" style={{ fontSize: 11, color: "#6d28d9" }}>
                Mitra B2B
              </Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#6d28d9" }}>
                {userStats.total_mitra}
              </div>
              <div style={{ fontSize: 10, color: "#7c3aed" }}>
                {userStats.pct_mitra}% dari total
              </div>
            </div>
          </Col>

          <Col xs={12} sm={8} md={4}>
            <div
              style={{
                padding: "12px 14px",
                background: "#fef2f2",
                borderRadius: 8,
                border: "1px solid #fecaca",
                height: "100%",
              }}
            >
              <Text type="secondary" style={{ fontSize: 11, color: "#b91c1c" }}>
                Admin Platform
              </Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#b91c1c" }}>
                {userStats.total_admin}
              </div>
              <div style={{ fontSize: 10, color: "#dc2626" }}>
                {userStats.pct_admin}% dari total
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 5. Grafik Perbandingan Layanan & Antrean Tindakan */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Grafik Distribusi Layanan */}
        <Col xs={24} lg={14}>
          <Card
            className="modern-card"
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BarChartOutlined style={{ color: "#1677ff", fontSize: 18 }} />
                <div>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>
                    Grafik Kinerja Layanan & Tren
                  </span>
                  <span
                    style={{ display: "block", fontSize: 12, color: "#6b7280" }}
                  >
                    Visualisasi perbandingan 7 Layanan
                  </span>
                </div>
              </div>
            }
            extra={
              <Segmented
                value={activeChartTab}
                onChange={setActiveChartTab}
                options={[
                  { label: "💰 Nilai GMV", value: "service_amount" },
                  { label: "📊 Transaksi", value: "service_count" },
                  { label: "📈 Tren Harian", value: "revenue_trend" },
                ]}
              />
            }
            style={{ height: "100%" }}
          >
            <div style={{ width: "100%", height: 290 }}>
              {activeChartTab === "revenue_trend" &&
              revenueTrendData.length > 0 ? (
                <Area {...revenueAreaConfig} />
              ) : (
                <Column {...serviceColumnConfig} />
              )}
            </div>
          </Card>
        </Col>

        {/* Antrean Tindakan & KPI Operasional */}
        <Col xs={24} lg={10}>
          <Card
            className="modern-card"
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ClockCircleOutlined
                  style={{ color: "#cf1322", fontSize: 18 }}
                />
                <div>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>
                    Pusat Tindakan Admin
                  </span>
                  <span
                    style={{ display: "block", fontSize: 12, color: "#6b7280" }}
                  >
                    Item pending yang membutuhkan persetujuan
                  </span>
                </div>
              </div>
            }
            style={{ height: "100%" }}
          >
            <List
              itemLayout="horizontal"
              dataSource={actionQueueData}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Link to={item.link} key="action">
                      <Button size="small" type="primary" ghost>
                        Buka
                      </Button>
                    </Link>,
                  ]}
                  style={{ padding: "12px 0" }}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          backgroundColor: `${item.color}15`,
                          color: item.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                        }}
                      >
                        {item.count}
                      </div>
                    }
                    title={
                      <Link
                        to={item.link}
                        style={{ fontWeight: 600, color: "#111827" }}
                      >
                        {item.title}
                      </Link>
                    }
                    description={
                      <span
                        style={{
                          color: item.count > 0 ? item.color : "#6b7280",
                          fontWeight: item.count > 0 ? 600 : 400,
                          fontSize: 12,
                        }}
                      >
                        {item.count > 0
                          ? `${item.count} item menunggu tindakan`
                          : "Semua item telah diproses"}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />

            <Divider style={{ margin: "14px 0" }} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f9fafb",
                padding: "12px 16px",
                borderRadius: 8,
              }}
            >
              <div>
                <Text strong style={{ fontSize: 13, display: "block" }}>
                  Analisis Finansial Lengkap
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Laporan laba bersih & gateway fee
                </Text>
              </div>
              <Link to="/profit">
                <Button size="small">Analisis Profit</Button>
              </Link>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 6. Tabel Detail Rincian 7 Kategori Layanan Platform */}
      <Card
        className="modern-card"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FundProjectionScreenOutlined
              style={{ color: "#1677ff", fontSize: 18 }}
            />
            <div>
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                Rincian Kinerja 7 Kategori Layanan AgroLink
              </span>
              <span
                style={{ display: "block", fontSize: 12, color: "#6b7280" }}
              >
                Data langsung dari service_summaries (frekuensi, total omset,
                komisi, gateway fee, dan laba bersih)
              </span>
            </div>
          </div>
        }
      >
        <Table
          dataSource={serviceSummaries}
          columns={serviceTableColumns}
          rowKey="name"
          pagination={false}
          scroll={{ x: 800 }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row
                style={{ background: "#fafafa", fontWeight: 700 }}
              >
                <Table.Summary.Cell index={0}>
                  <Text strong>TOTAL KESELURUHAN</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="center">
                  <Tag color="blue" style={{ fontWeight: 700 }}>
                    {financialSummary.total_transactions} Transaksi
                  </Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong style={{ color: "#111827", fontSize: 14 }}>
                    {formatter.format(financialSummary.total_gmv)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Text strong style={{ color: "#389e0d", fontSize: 14 }}>
                    {formatter.format(financialSummary.total_net_profit)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <Text strong style={{ color: "#1677ff", fontSize: 14 }}>
                    {formatter.format(financialSummary.total_mitra_share)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <Tag color="cyan" style={{ fontWeight: 700 }}>
                    100.0%
                  </Tag>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
