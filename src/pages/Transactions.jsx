import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Tag,
  Typography,
  Alert,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Space,
  Button,
  Tooltip,
  Badge,
  DatePicker,
  message,
  Modal,
  Descriptions,
  Divider,
  Tabs,
} from "antd";
import {
  DollarCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ClearOutlined,
  ShopOutlined,
  CarOutlined,
  ToolOutlined,
  TeamOutlined,
  RobotOutlined,
  BankOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  CalendarOutlined,
  WalletOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { getAllTransactions, exportTransactions, getDashboardStats } from "../services/api";
import { FaSeedling, FaRocket } from "react-icons/fa6";
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Helper untuk format Rupiah
const formatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

// Konfigurasi Layanan & Komisi
const SERVICE_CONFIG = {
  Pekerja: {
    label: "Pekerja / Tani Link",
    sector: "Pertanian",
    commissionRate: 0.08,
    rateLabel: "8%",
    color: "green",
    icon: <TeamOutlined style={{ color: "#52c41a" }} />,
  },
  Peternak: {
    label: "Pekerja / Ternak Link",
    sector: "Peternakan",
    commissionRate: 0.08,
    rateLabel: "8%",
    color: "orange",
    icon: <TeamOutlined style={{ color: "#fa8c16" }} />,
  },
  Tukang: {
    label: "Pekerja / Tukang Link",
    sector: "Tukang Bangunan",
    commissionRate: 0.08,
    rateLabel: "8%",
    color: "blue",
    icon: <ToolOutlined style={{ color: "#1890ff" }} />,
  },
  Ekspedisi: {
    label: "Ekspedisi",
    sector: "Driver Angkut Panen",
    commissionRate: 0.11,
    rateLabel: "11%",
    color: "volcano",
    icon: <CarOutlined style={{ color: "#fa541c" }} />,
  },
  "E-Commerce": {
    label: "E-Commerce",
    sector: "Jual Beli Hasil Tani",
    commissionRate: 0.1,
    rateLabel: "10%",
    color: "gold",
    icon: <ShopOutlined style={{ color: "#faad14" }} />,
  },
  "Chatbot Premium": {
    label: "Chatbot Premium",
    sector: "Langganan AgroLink AI",
    commissionRate: 1.0,
    rateLabel: "100%",
    color: "purple",
    icon: <RobotOutlined style={{ color: "#722ed1" }} />,
  },
  Kemitraan: {
    label: "Kemitraan",
    sector: "B2B Partnership",
    commissionRate: 0.15,
    rateLabel: "15%",
    color: "cyan",
    icon: <BankOutlined style={{ color: "#13c2c2" }} />,
  },
};

// Konfigurasi visual untuk Metode Pembayaran
const PAYMENT_METHOD_TAGS = {
  bca: { label: "BCA", color: "#00529C", isBank: true },
  bni: { label: "BNI", color: "#F37024", isBank: true },
  mandiri: { label: "MANDIRI", color: "#003366", isBank: true },
  bri: { label: "BRI", color: "#00529C", isBank: true },
  qris: { label: "QRIS", color: "#DE1B22", isBank: false },
  dana: { label: "DANA", color: "#118EEA", isBank: false },
  gopay: { label: "GoPay", color: "#00AED6", isBank: false },
  shopeepay: { label: "ShopeePay", color: "#EE4D2D", isBank: false },
};

const TransactionsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // State Pagination & Filter
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [activePreset, setActivePreset] = useState("all");

  // State Modal Detail Transaksi
  const [selectedTx, setSelectedTx] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Transaksi Terpaginasi dari Backend
  const fetchTransactions = async (
    page = 1,
    pageSize = 10,
    search = "",
    service = "",
    payment = "",
    status = "",
    sektor = "",
    startDate = "",
    endDate = "",
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllTransactions(
        page,
        pageSize,
        search,
        service,
        payment,
        status,
        sektor,
        startDate,
        endDate,
      );
      const result = response.data?.data;
      const items = result?.data || (Array.isArray(result) ? result : []);
      setData(items);
      setPagination({
        current: result?.current_page || page,
        pageSize: pageSize,
        total: result?.total_items ?? items.length,
      });
    } catch (err) {
      console.error("Gagal memuat data transaksi:", err);
      setError("Gagal memuat data transaksi dari server.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Dashboard Stats untuk Ringkasan Finansial & Breakdown
  const fetchStats = async () => {
    try {
      const res = await getDashboardStats();
      setDashboardStats(res.data?.data || null);
    } catch (err) {
      console.error("Gagal memuat statistik:", err);
    }
  };

  // Trigger Fetch saat filter berubah
  useEffect(() => {
    const startStr = dateRange && dateRange[0] ? dayjs(dateRange[0]).format("YYYY-MM-DD") : "";
    const endStr = dateRange && dateRange[1] ? dayjs(dateRange[1]).format("YYYY-MM-DD") : "";
    fetchTransactions(
      pagination.current,
      pagination.pageSize,
      searchText,
      serviceFilter,
      paymentFilter,
      statusFilter,
      sectorFilter,
      startStr,
      endStr,
    );
  }, [
    pagination.current,
    pagination.pageSize,
    searchText,
    serviceFilter,
    sectorFilter,
    paymentFilter,
    statusFilter,
    dateRange,
  ]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Handler Preset Tanggal
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
    } else if (presetKey === "sebelum") {
      // Periode Fase 1: 1 September 2025 s/d 31 Mei 2026
      start = dayjs("2025-09-01");
      end = dayjs("2026-05-31");
    } else if (presetKey === "sesudah") {
      // Periode Fase 2: 1 Juni 2026 s/d 25 September 2026
      start = dayjs("2026-06-01");
      end = dayjs("2026-09-25");
    } else if (presetKey === "all") {
      start = null;
      end = null;
    }

    setDateRange(start && end ? [start, end] : null);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      setActivePreset("custom");
    } else {
      setActivePreset("all");
    }
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Reset Filter
  const handleResetFilters = () => {
    setSearchText("");
    setServiceFilter("");
    setSectorFilter("");
    setPaymentFilter("");
    setStatusFilter("");
    setDateRange(null);
    setActivePreset("all");
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Ekspor Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const startStr = dateRange && dateRange[0] ? dayjs(dateRange[0]).format("YYYY-MM-DD") : "";
      const endStr = dateRange && dateRange[1] ? dayjs(dateRange[1]).format("YYYY-MM-DD") : "";
      const response = await exportTransactions(
        searchText,
        serviceFilter,
        statusFilter,
        sectorFilter,
        startStr,
        endStr,
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const filename = `transaksi_agrolink_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success("Laporan transaksi berhasil diunduh");
    } catch (err) {
      message.error("Gagal mengunduh laporan transaksi");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  // Buka Modal Detail
  const handleOpenDetail = (record) => {
    setSelectedTx(record);
    setIsModalOpen(true);
  };

  // Ringkasan Finansial Aktif dari dashboard stats
  const summaryKPIs = useMemo(() => {
    const fin = dashboardStats?.financial_summary;
    return {
      totalTransactions: fin?.total_transactions ?? 0,
      successfulTransactions: fin?.successful_transactions ?? 0,
      failedTransactions: fin?.failed_transactions ?? 0,
      totalGMV: fin?.total_gmv ?? 0,
      totalGrossProfit: fin?.total_gross_profit ?? 0,
      totalGatewayFee: fin?.total_gateway_fee ?? 0,
      totalNetProfit: fin?.total_net_profit ?? 0,
      totalMitraShare: fin?.total_mitra_share ?? 0,
      phase1NetProfit: fin?.phase1_net_profit ?? 0,
      phase2NetProfit: fin?.phase2_net_profit ?? 0,
    };
  }, [dashboardStats]);

  // Data Tabel Breakdown per Layanan & Sektor
  const breakdownDataSource = useMemo(() => {
    if (!dashboardStats?.status_breakdown) {
      return [];
    }
    return dashboardStats.status_breakdown.map((item, idx) => ({
      key: String(idx + 1),
      layanan: item.layanan,
      sektor: item.sektor || "-",
      sukses: item.sukses,
      gagal: item.gagal,
      total: item.total,
      gross: item.gross_profit,
      net: item.net_profit,
    }));
  }, [dashboardStats]);

  // Definisi Kolom Tabel Utama Transaksi
  const columns = [
    {
      title: "ID Transaksi",
      dataIndex: "transaction_id",
      key: "transaction_id",
      width: 170,
      render: (text, record) => {
        const rawId = text || record.IDTransaksi || "-";
        return (
          <Space orientation="vertical" size={2}>
            <Tooltip title="Klik untuk melihat rincian transaksi lengkap">
              <span
                onClick={() => handleOpenDetail(record)}
                style={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  color: "#1677ff",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {rawId}
              </span>
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: "Tanggal & Waktu",
      dataIndex: "transaction_date",
      key: "transaction_date",
      width: 150,
      render: (date, record) => {
        const d = date ? dayjs(date) : dayjs(record.Tanggal || record.Timestamp);
        return (
          <div>
            <Text strong style={{ fontSize: 13, display: "block" }}>
              {d.format("DD MMM YYYY")}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {d.format("HH:mm [WIB]")}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Layanan & Sektor",
      key: "service_info",
      width: 190,
      render: (_, record) => {
        const layName = record.layanan || record.Layanan || "Pekerja";
        const cfg = SERVICE_CONFIG[layName] || SERVICE_CONFIG["Pekerja"];
        const sektorVal = record.sektor || record.Sektor || cfg.sector;
        return (
          <div>
            <Tag
              color={cfg.color}
              style={{
                borderRadius: 4,
                padding: "2px 8px",
                fontWeight: 600,
                fontSize: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {cfg.icon}
              {layName}
            </Tag>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>
              <span>Sektor: <b>{sektorVal}</b></span>
              <span style={{ marginLeft: 6, color: "#111827", fontWeight: 600 }}>
                ({cfg.rateLabel})
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status_transaksi",
      key: "status_transaksi",
      width: 120,
      render: (status, record) => {
        const st = status || record.StatusTransaksi || (record.status === "failed" ? "Gagal" : "Sukses");
        const isSuccess = String(st).toLowerCase().includes("sukses") || String(st).toLowerCase() === "paid";

        return isSuccess ? (
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontWeight: 600, padding: "2px 8px" }}>
            Sukses
          </Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontWeight: 600, padding: "2px 8px" }}>
            Gagal
          </Tag>
        );
      },
    },
    {
      title: "Keterangan / Komentar",
      key: "keterangan_komentar",
      width: 260,
      render: (_, record) => {
        const st = record.status_transaksi || record.StatusTransaksi || (record.status === "failed" ? "Gagal" : "Sukses");
        const isFailed = String(st).toLowerCase().includes("gagal") || record.status === "failed";
        const komentar = record.komentar_user || record.KomentarUser;
        const keterangan = record.keterangan || record.Keterangan || "-";

        if (isFailed && komentar && komentar !== "-") {
          return (
            <Tooltip title={`Catatan Kegagalan: ${komentar}`}>
              <div
                style={{
                  background: "#fff1f0",
                  border: "1px solid #ffccc7",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#cf1322",
                }}
              >
                <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <ExclamationCircleOutlined /> Kendala Transaksi:
                </div>
                <div style={{ fontStyle: "italic", marginTop: 2 }}>"{komentar}"</div>
              </div>
            </Tooltip>
          );
        }

        return (
          <Text style={{ fontSize: 12, color: "#374151" }} ellipsis={{ tooltip: keterangan }}>
            {keterangan}
          </Text>
        );
      },
    },
    {
      title: "Pembayar / Pihak Terkait",
      key: "payer_info",
      width: 220,
      render: (_, record) => {
        const payerName =
          record.payer_name ||
          record.farmer_name ||
          record.FarmerName ||
          record.buyer_name ||
          record.BuyerName ||
          record.mitra_name ||
          record.MitraName ||
          "Pengguna AgroLink";

        const payerEmail =
          record.farmer_email ||
          record.FarmerEmail ||
          record.buyer_email ||
          record.BuyerEmail ||
          record.pemberi_kerja_email ||
          record.PemberiKerjaEmail ||
          record.user_email ||
          record.UserEmail ||
          "";

        const counterpartName =
          record.worker_name ||
          record.WorkerName ||
          record.driver_name ||
          record.DriverName ||
          "";

        return (
          <div style={{ fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: "#111827" }}>{payerName}</div>
            {payerEmail && (
              <div style={{ color: "#6b7280", fontSize: 11 }}>{payerEmail}</div>
            )}
            {counterpartName && (
              <div style={{ color: "#1677ff", fontSize: 11, marginTop: 2 }}>
                Mitra: <b>{counterpartName}</b>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Metode",
      dataIndex: "payment_method",
      key: "payment_method",
      width: 120,
      render: (method, record) => {
        const m = method || record.MetodePembayaran || "-";
        const key = String(m).toLowerCase().trim();
        const conf = PAYMENT_METHOD_TAGS[key];

        if (conf) {
          return (
            <Tag
              style={{
                backgroundColor: conf.color,
                color: "#ffffff",
                borderRadius: 4,
                fontWeight: 600,
                fontSize: 11,
                padding: "1px 8px",
                border: "none",
              }}
            >
              {conf.label}
            </Tag>
          );
        }

        return (
          <Tag color="geekblue" style={{ borderRadius: 4, fontWeight: 500, fontSize: 11 }}>
            {String(m).toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Nominal (Gross)",
      key: "nominal_transaksi",
      align: "right",
      width: 140,
      render: (_, record) => {
        const nom = record.nominal_transaksi ?? record.NominalTransaksi ?? record.amount_paid ?? 0;
        return (
          <span style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>
            {formatter.format(nom)}
          </span>
        );
      },
    },
    {
      title: "Keuntungan Bersih",
      key: "keuntungan_bersih",
      align: "right",
      width: 150,
      render: (_, record) => {
        const bersih = record.keuntungan_bersih ?? record.KeuntunganBersih ?? 0;
        const st = record.status_transaksi || record.StatusTransaksi || (record.status === "failed" ? "Gagal" : "Sukses");
        const isFailed = String(st).toLowerCase().includes("gagal") || record.status === "failed";

        return (
          <Tooltip title={`Keuntungan Kotor: ${formatter.format(record.keuntungan_kotor ?? record.KeuntunganKotor ?? 0)} - Fee: ${formatter.format(record.biaya_midtrans ?? record.BiayaMidtrans ?? 0)}`}>
            <span style={{ fontWeight: 700, color: isFailed ? "#8c8c8c" : "#389e0d", fontSize: 13 }}>
              +{formatter.format(bersih)}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      align: "center",
      width: 90,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleOpenDetail(record)}
          size="small"
        >
          Detail
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* 1. Header Halaman */}
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
            Daftar & Riwayat Transaksi AgroLink
          </Title>
          <Text type="secondary">
            {summaryKPIs.totalTransactions > 0
              ? `Dataset ${summaryKPIs.totalTransactions} transaksi (${summaryKPIs.successfulTransactions} Sukses, ${summaryKPIs.failedTransactions} Gagal), monitoring komisi layanan, laba bersih kumulatif ${formatter.format(summaryKPIs.totalNetProfit)}.`
              : "Monitoring komisi layanan dan laba bersih transaksi platform."}
          </Text>
        </div>

        <Space wrap>
          <Tooltip title="Muat ulang seluruh data transaksi">
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={() => {
                const startStr = dateRange && dateRange[0] ? dayjs(dateRange[0]).format("YYYY-MM-DD") : "";
                const endStr = dateRange && dateRange[1] ? dayjs(dateRange[1]).format("YYYY-MM-DD") : "";
                fetchTransactions(
                  pagination.current,
                  pagination.pageSize,
                  searchText,
                  serviceFilter,
                  paymentFilter,
                  statusFilter,
                  sectorFilter,
                  startStr,
                  endStr,
                );
                fetchStats();
              }}
              disabled={loading}
            >
              Segarkan
            </Button>
          </Tooltip>

          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
            style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
          >
            Ekspor Excel
          </Button>
        </Space>
      </div>

      {/* 2. Kartu KPI Finansial Transaksi */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="modern-card" style={{ borderLeft: "4px solid #389e0d" }}>
            <Statistic
              title="Total Keuntungan Bersih (Kumulatif)"
              value={formatter.format(summaryKPIs.totalNetProfit)}
              prefix={<DollarCircleOutlined style={{ color: "#389e0d" }} />}
              valueStyle={{ color: "#389e0d", fontWeight: 700, fontSize: 20 }}
            />
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              Fase 1: <b>{formatter.format(summaryKPIs.phase1NetProfit)}</b> | Fase 2: <b>{formatter.format(summaryKPIs.phase2NetProfit)}</b>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="modern-card" style={{ borderLeft: "4px solid #1677ff" }}>
            <Statistic
              title="Keuntungan Kotor Platform"
              value={formatter.format(summaryKPIs.totalGrossProfit)}
              prefix={<DollarCircleOutlined style={{ color: "#1677ff" }} />}
              valueStyle={{ color: "#1677ff", fontWeight: 700, fontSize: 20 }}
            />
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              Biaya Midtrans: <b>{formatter.format(summaryKPIs.totalGatewayFee)}</b>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="modern-card" style={{ borderLeft: "4px solid #faad14" }}>
            <Statistic
              title="Total Volume Transaksi (GMV)"
              value={formatter.format(summaryKPIs.totalGMV)}
              prefix={<DollarCircleOutlined style={{ color: "#faad14" }} />}
              valueStyle={{ color: "#111827", fontWeight: 700, fontSize: 20 }}
            />
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              Disalurkan ke Mitra: <b>{formatter.format(summaryKPIs.totalMitraShare)}</b>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="modern-card" style={{ borderLeft: "4px solid #722ed1" }}>
            <Statistic
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Total Transaksi</span>
                  <Tag color="green" style={{ fontSize: 10, margin: 0 }}>
                    {summaryKPIs.successfulTransactions} Sukses
                  </Tag>
                </div>
              }
              value={`${summaryKPIs.totalTransactions} Transaksi`}
              valueStyle={{ color: "#722ed1", fontWeight: 700, fontSize: 20 }}
            />
            <div style={{ fontSize: 11, color: "#cf1322", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <CloseCircleOutlined /> <b>{summaryKPIs.failedTransactions} Transaksi Gagal</b>{" "}
              ({summaryKPIs.totalTransactions > 0 ? ((summaryKPIs.failedTransactions / summaryKPIs.totalTransactions) * 100).toFixed(1) : 0}%)
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. Filter Periode Cepat */}
      <Card className="modern-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
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
                Semua Waktu {summaryKPIs.totalTransactions > 0 ? `(${summaryKPIs.totalTransactions} Trx)` : ""}
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

          <Space align="center">
            <Text type="secondary" style={{ fontSize: 13 }}>
              Rentang Kustom:
            </Text>
            <RangePicker
              value={dateRange}
              onChange={handleDateChange}
              format="DD/MM/YYYY"
              style={{ width: 240 }}
            />
          </Space>
        </div>
      </Card>

      {/* 4. Widget Breakdown Layanan x Status (Sukses / Gagal) */}
      <Card
        className="modern-card"
        title={
          <Space>
            <InfoCircleOutlined style={{ color: "#1677ff" }} />
            <span style={{ fontWeight: 600 }}>Tabel Matriks Breakdown Layanan & Status Transaksi</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          dataSource={breakdownDataSource}
          pagination={false}
          size="small"
          bordered
          columns={[
            {
              title: "Layanan",
              dataIndex: "layanan",
              key: "layanan",
              render: (name) => {
                const cfg = SERVICE_CONFIG[name] || SERVICE_CONFIG["Pekerja"];
                return (
                  <Tag color={cfg.color} style={{ fontWeight: 600 }}>
                    {cfg.icon} {name}
                  </Tag>
                );
              },
            },
            {
              title: "Sektor Fitur Pekerja",
              dataIndex: "sektor",
              key: "sektor",
              render: (sektor) => (
                <span style={{ fontWeight: sektor !== "-" ? 600 : 400, color: sektor !== "-" ? "#111827" : "#8c8c8c" }}>
                  {sektor}
                </span>
              ),
            },
            {
              title: "Sukses",
              dataIndex: "sukses",
              key: "sukses",
              align: "center",
              render: (val) => <Tag color="success" style={{ fontWeight: 700 }}>{val}</Tag>,
            },
            {
              title: "Gagal",
              dataIndex: "gagal",
              key: "gagal",
              align: "center",
              render: (val) => (
                <Tag color={val > 0 ? "error" : "default"} style={{ fontWeight: 700 }}>
                  {val}
                </Tag>
              ),
            },
            {
              title: "Total Transaksi",
              dataIndex: "total",
              key: "total",
              align: "center",
              render: (val) => <b>{val}</b>,
            },
            {
              title: "Keuntungan Kotor",
              dataIndex: "gross",
              key: "gross",
              align: "right",
              render: (val) => formatter.format(val),
            },
            {
              title: "Keuntungan Bersih",
              dataIndex: "net",
              key: "net",
              align: "right",
              render: (val) => (
                <b style={{ color: "#389e0d" }}>{formatter.format(val)}</b>
              ),
            },
          ]}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ backgroundColor: "#fafafa", fontWeight: 700 }}>
                <Table.Summary.Cell index={0} colSpan={2}>
                  TOTAL KESELURUHAN PLATFORM
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="center">
                  <Tag color="success" style={{ fontWeight: 700 }}>{summaryKPIs.successfulTransactions}</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="center">
                  <Tag color="error" style={{ fontWeight: 700 }}>{summaryKPIs.failedTransactions}</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="center">
                  {summaryKPIs.totalTransactions}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {formatter.format(summaryKPIs.totalGrossProfit)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right" style={{ color: "#389e0d" }}>
                  {formatter.format(summaryKPIs.totalNetProfit)}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {/* 5. Tabel Utama Transaksi dengan Filter Lengkap */}
      <Card
        className="modern-card"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <DollarCircleOutlined style={{ color: "#1677ff", fontSize: 18 }} />
            <span style={{ fontWeight: 600, fontSize: 16 }}>Rincian Transaksi Platform</span>
            {statusFilter && (
              <Tag color={statusFilter === "Sukses" ? "green" : "red"} closable onClose={() => setStatusFilter("")}>
                Status: {statusFilter}
              </Tag>
            )}
            {serviceFilter && (
              <Tag color="blue" closable onClose={() => setServiceFilter("")}>
                Layanan: {serviceFilter}
              </Tag>
            )}
            {sectorFilter && (
              <Tag color="orange" closable onClose={() => setSectorFilter("")}>
                Sektor: {sectorFilter}
              </Tag>
            )}
          </div>
        }
        extra={
          <Space wrap size={10}>
            {/* Filter Status */}
            <Select
              placeholder="Filter Status"
              style={{ width: 140 }}
              allowClear
              value={statusFilter || undefined}
              onChange={(val) => {
                setStatusFilter(val || "");
                setPagination((p) => ({ ...p, current: 1 }));
              }}
            >
              <Option value="Sukses">Sukses {summaryKPIs.successfulTransactions > 0 ? `(${summaryKPIs.successfulTransactions})` : ""}</Option>
              <Option value="Gagal">Gagal {summaryKPIs.failedTransactions > 0 ? `(${summaryKPIs.failedTransactions})` : ""}</Option>
            </Select>

            {/* Filter Layanan */}
            <Select
              placeholder="Filter Layanan"
              style={{ width: 190 }}
              allowClear
              value={serviceFilter || undefined}
              onChange={(val) => {
                setServiceFilter(val || "");
                setPagination((p) => ({ ...p, current: 1 }));
              }}
            >
              <Option value="Pekerja">Pekerja (Pertanian)</Option>
              <Option value="Peternak">Peternak (Peternakan)</Option>
              <Option value="Tukang">Tukang (Bangunan)</Option>
              <Option value="Ekspedisi">Ekspedisi (Driver)</Option>
              <Option value="E-Commerce">E-Commerce</Option>
              <Option value="Chatbot Premium">Chatbot Premium</Option>
              <Option value="Kemitraan">Kemitraan (B2B)</Option>
            </Select>

            {/* Filter Sektor */}
            <Select
              placeholder="Filter Sektor"
              style={{ width: 160 }}
              allowClear
              value={sectorFilter || undefined}
              onChange={(val) => {
                setSectorFilter(val || "");
                setPagination((p) => ({ ...p, current: 1 }));
              }}
            >
              <Option value="Pertanian">Pertanian</Option>
              <Option value="Peternakan">Peternakan</Option>
              <Option value="Tukang Bangunan">Tukang Bangunan</Option>
            </Select>

            {/* Filter Metode Pembayaran */}
            <Select
              placeholder="Metode Pembayaran"
              style={{ width: 160 }}
              allowClear
              value={paymentFilter || undefined}
              onChange={(val) => {
                setPaymentFilter(val || "");
                setPagination((p) => ({ ...p, current: 1 }));
              }}
            >
              <Option value="qris">QRIS</Option>
              <Option value="dana">DANA</Option>
              <Option value="gopay">GoPay</Option>
              <Option value="shopeepay">ShopeePay</Option>
              <Option value="bca">Bank BCA</Option>
              <Option value="bni">Bank BNI</Option>
              <Option value="mandiri">Bank Mandiri</Option>
            </Select>

            {/* Search Input */}
            <Input
              placeholder="Cari ID / Nama / Email..."
              prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              allowClear
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPagination((p) => ({ ...p, current: 1 }));
              }}
              style={{ width: 220 }}
            />

            {(searchText || serviceFilter || sectorFilter || paymentFilter || statusFilter || dateRange) && (
              <Tooltip title="Hapus semua filter">
                <Button icon={<ClearOutlined />} onClick={handleResetFilters}>
                  Reset
                </Button>
              </Tooltip>
            )}
          </Space>
        }
      >
        {error && (
          <Alert
            message="Error Memuat Data"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.transaction_id || record.IDTransaksi || Math.random().toString()}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
            showTotal: (total, range) => (
              <Text type="secondary" style={{ fontSize: 13 }}>
                Menampilkan <b>{range[0]}-{range[1]}</b> dari total <b>{total}</b> transaksi
              </Text>
            ),
          }}
          scroll={{ x: 1200 }}
          style={{ borderRadius: 8 }}
        />
      </Card>

      {/* 6. Modal Detail Transaksi Lengkap */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>
              Detail Transaksi #{selectedTx?.transaction_id || selectedTx?.IDTransaksi}
            </span>
            {selectedTx && (
              (selectedTx.status_transaksi === "Sukses" || selectedTx.StatusTransaksi === "Sukses") ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>Sukses</Tag>
              ) : (
                <Tag color="error" icon={<CloseCircleOutlined />}>Gagal</Tag>
              )
            )}
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsModalOpen(false)}>
            Tutup
          </Button>,
        ]}
        width={720}
      >
        {selectedTx && (
          <div>
            {/* Banner Komentar Jika Transaksi Gagal */}
            {(selectedTx.status_transaksi === "Gagal" || selectedTx.StatusTransaksi === "Gagal") && selectedTx.komentar_user && selectedTx.komentar_user !== "-" && (
              <Alert
                message="Alasan / Kendala Transaksi Gagal"
                description={
                  <div style={{ fontWeight: 600, color: "#a8071a" }}>
                    "{selectedTx.komentar_user || selectedTx.KomentarUser}"
                  </div>
                }
                type="error"
                showIcon
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="ID Transaksi">
                <b>{selectedTx.transaction_id || selectedTx.IDTransaksi}</b>
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal & Waktu">
                {dayjs(selectedTx.transaction_date || selectedTx.Tanggal).format("DD MMMM YYYY, HH:mm [WIB]")}
              </Descriptions.Item>
              <Descriptions.Item label="Layanan">
                <Tag color={SERVICE_CONFIG[selectedTx.layanan || selectedTx.Layanan]?.color || "blue"}>
                  {selectedTx.layanan || selectedTx.Layanan}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Sektor">
                <b>{selectedTx.sektor || selectedTx.Sektor || "-"}</b>
              </Descriptions.Item>
              <Descriptions.Item label="Metode Pembayaran">
                <Tag color="geekblue">{selectedTx.payment_method || selectedTx.MetodePembayaran}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status Transaksi">
                {(selectedTx.status_transaksi === "Sukses" || selectedTx.StatusTransaksi === "Sukses") ? (
                  <Tag color="success">Sukses / Berhasil</Tag>
                ) : (
                  <Tag color="error">Gagal / Dibatalkan</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Keterangan Transaksi" span={2}>
                {selectedTx.keterangan || selectedTx.Keterangan || "-"}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "16px 0" }}>Rincian Keuangan</Divider>

            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Nominal Transaksi (Gross)">
                <b style={{ fontSize: 14 }}>{formatter.format(selectedTx.nominal_transaksi ?? selectedTx.NominalTransaksi ?? 0)}</b>
              </Descriptions.Item>
              <Descriptions.Item label="Persentase Komisi">
                <b>{Math.round((selectedTx.persentase_komisi ?? selectedTx.PersentaseKomisi ?? 0) * 100)}%</b>
              </Descriptions.Item>
              <Descriptions.Item label="Keuntungan Kotor Platform">
                <span style={{ color: "#1677ff", fontWeight: 600 }}>
                  +{formatter.format(selectedTx.keuntungan_kotor ?? selectedTx.KeuntunganKotor ?? 0)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Biaya Midtrans (Gateway)">
                <span style={{ color: "#fa8c16", fontWeight: 600 }}>
                  -{formatter.format(selectedTx.biaya_midtrans ?? selectedTx.BiayaMidtrans ?? 0)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Keuntungan Bersih Platform">
                <span style={{ color: "#389e0d", fontWeight: 700, fontSize: 14 }}>
                  +{formatter.format(selectedTx.keuntungan_bersih ?? selectedTx.KeuntunganBersih ?? 0)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Diterima Mitra / Pekerja">
                <span style={{ color: "#722ed1", fontWeight: 700, fontSize: 14 }}>
                  {formatter.format(selectedTx.total_diterima_mitra ?? selectedTx.TotalDiterimaMitra ?? 0)}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "16px 0" }}>Pihak Terkait & Kontak</Divider>

            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Pembayar / Petani">
                <div>
                  <b>{selectedTx.farmer_name || selectedTx.FarmerName || selectedTx.buyer_name || selectedTx.BuyerName || "Pengguna AgroLink"}</b>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {selectedTx.farmer_email || selectedTx.FarmerEmail || selectedTx.buyer_email || selectedTx.BuyerEmail || selectedTx.user_email || "-"}
                  </div>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Penerima / Mitra / Pekerja">
                <div>
                  <b>{selectedTx.worker_name || selectedTx.WorkerName || selectedTx.driver_name || selectedTx.DriverName || selectedTx.mitra_name || selectedTx.MitraName || "-"}</b>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {selectedTx.worker_email || selectedTx.WorkerEmail || selectedTx.driver_email || selectedTx.DriverEmail || selectedTx.mitra_email || selectedTx.MitraEmail || "-"}
                  </div>
                </div>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionsPage;
