import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Tag,
  Typography,
  Input,
  Select,
  Space,
  Card,
  Alert,
  Spin,
  Progress,
  Button,
  DatePicker,
  Segmented,
  Tooltip,
  Avatar,
  Badge,
  Empty,
  Modal,
  message,
} from "antd";
import {
  SearchOutlined,
  TeamOutlined,
  ToolOutlined,
  CarOutlined,
  GlobalOutlined,
  ShopOutlined,
  ReloadOutlined,
  LineChartOutlined,
  PhoneOutlined,
  CalendarOutlined,
  DownloadOutlined,
  ClearOutlined,
  ApartmentOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { Line } from "@ant-design/plots";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/id";
import { getAllUsers } from "../services/api";

dayjs.extend(relativeTime);
dayjs.locale("id");

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Definisi konfigurasi role & warna
const ROLE_CONFIG = {
  farmer: {
    key: "farmer",
    label: "Pemberi Kerja",
    color: "#10b981", // Emerald Green
    lightBg: "#ecfdf5",
    border: "#a7f3d0",
    icon: <TeamOutlined style={{ fontSize: 22, color: "#10b981" }} />,
    tagColor: "green",
    hasTypes: true,
  },
  worker: {
    key: "worker",
    label: "Pekerja",
    color: "#3b82f6", // Blue
    lightBg: "#eff6ff",
    border: "#bfdbfe",
    icon: <ToolOutlined style={{ fontSize: 22, color: "#3b82f6" }} />,
    tagColor: "blue",
    hasTypes: true,
  },
  driver: {
    key: "driver",
    label: "Driver",
    color: "#f59e0b", // Amber/Orange
    lightBg: "#fffbeb",
    border: "#fde68a",
    icon: <CarOutlined style={{ fontSize: 22, color: "#f59e0b" }} />,
    tagColor: "orange",
    hasTypes: false,
  },
  general: {
    key: "general",
    label: "Umum",
    color: "#06b6d4", // Cyan
    lightBg: "#ecfeff",
    border: "#a5f3fc",
    icon: <GlobalOutlined style={{ fontSize: 22, color: "#06b6d4" }} />,
    tagColor: "cyan",
    hasTypes: false,
  },
  mitra: {
    key: "mitra",
    label: "Mitra",
    color: "#8b5cf6", // Purple / Violet
    lightBg: "#f5f3ff",
    border: "#ddd6fe",
    icon: <ShopOutlined style={{ fontSize: 22, color: "#8b5cf6" }} />,
    tagColor: "purple",
    hasTypes: false,
  },
};

const normalizeRole = (role) => {
  if (!role) return "general";
  const r = role.toLowerCase().trim();
  if (r === "farmer" || r === "petani" || r === "pemberi kerja" || r === "pemberikerja") return "farmer";
  if (r === "worker" || r === "pekerja") return "worker";
  if (r === "driver" || r === "supir" || r === "pengemudi") return "driver";
  if (r === "mitra" || r === "partner") return "mitra";
  if (r === "general" || r === "umum") return "general";
  return "general";
};

// Helper untuk memetakan Tipe dari skills (worker) atau type (farmer)
const getUserTypeDetails = (record) => {
  if (!record) return null;
  const role = normalizeRole(record.role);

  // Jika worker (Pekerja) -> ambil dari `skills`
  if (role === "worker") {
    const skills = record.skills;
    if (!skills || (Array.isArray(skills) && skills.length === 0)) return null;

    const skillList = Array.isArray(skills) ? skills : [skills];
    return skillList.map((skill) => {
      const s = String(skill).toLowerCase().trim();
      if (s === "peternakan" || s === "peternak") return { label: "Peternak", color: "orange" };
      if (s === "pertanian" || s === "buruh tani" || s === "buruh_tani") return { label: "Buruh Tani", color: "green" };
      if (s === "pertukangan" || s === "tukang" || s === "tukang bangunan" || s === "tukang_bangunan") return { label: "Tukang Bangunan", color: "blue" };
      return { label: String(skill), color: "cyan" };
    });
  }

  // Jika farmer (Pemberi Kerja) -> ambil dari `type`
  if (role === "farmer") {
    const type = record.type;
    if (!type) return null;

    const t = String(type).toLowerCase().trim();
    if (t === "agriculture" || t === "pertanian" || t === "petani") {
      return [{ label: "Petani", color: "green" }];
    }
    if (t === "livestock" || t === "peternakan" || t === "peternak") {
      return [{ label: "Peternak", color: "orange" }];
    }
    if (t === "construction" || t === "pertukangan" || t === "pemilik proyek" || t === "pemilik_proyek") {
      return [{ label: "Pemilik Proyek", color: "purple" }];
    }
    return [{ label: String(type), color: "geekblue" }];
  }

  // Role lainnya (driver, general, mitra) kosong
  return null;
};

const UsersPage = () => {
  // State untuk data tabel terpaginasi
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State untuk semua pengguna (digunakan untuk statistik & grafik analytics)
  const [allUsersList, setAllUsersList] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // State untuk Filter & Paginasi Tabel
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // Filter khusus sub-tipe (Pemberi Kerja / Pekerja)
  const [statusFilter, setStatusFilter] = useState("");

  // State untuk Pop-up Breakdown Tipe (Modal)
  const [breakdownModal, setBreakdownModal] = useState({
    open: false,
    role: null, // 'farmer' | 'worker'
  });

  // State untuk API stats resmi jika disediakan backend
  const [apiStats, setApiStats] = useState(null);

  // State untuk Pengaturan Grafik
  const [chartMode, setChartMode] = useState("cumulative"); // 'cumulative' | 'daily'
  const [timeRange, setTimeRange] = useState("30d"); // '7d' | '30d' | '90d' | 'all' | 'custom'
  const [customRange, setCustomRange] = useState(null);

  // Fetch data tabel pengguna terpaginasi
  const fetchUsers = async (page, pageSize, search, role) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllUsers(page, pageSize, search, role);
      const result = response.data.data;

      const userItems = result.data || result || [];
      setData(userItems);
      setPagination({
        current: result.current_page || page,
        pageSize: pageSize,
        total: result.total_items ?? userItems.length,
      });

      if (result.stats) {
        setApiStats(result.stats);
      }
    } catch (err) {
      console.error("Gagal memuat data pengguna:", err);
      setError("Gagal memuat data pengguna dari server.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch semua pengguna untuk menghitung 5 widget statistik & timeline grafik
  const fetchAllUsersForAnalytics = async () => {
    setStatsLoading(true);
    try {
      const response = await getAllUsers(1, 9999, "", "");
      const result = response.data?.data;
      const users = result?.data || result || [];
      setAllUsersList(Array.isArray(users) ? users : []);

      if (result?.stats) {
        setApiStats(result.stats);
      }
    } catch (err) {
      console.error("Gagal memuat data analitik pengguna:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Handler reload menyeluruh
  const handleRefreshAll = () => {
    fetchUsers(1, pagination.pageSize, searchText, roleFilter);
    fetchAllUsersForAnalytics();
    message.success("Data berhasil diperbarui");
  };

  // Handler export data pengguna ke CSV
  const handleExportCSV = () => {
    if (allUsersList.length === 0) {
      message.warning("Tidak ada data untuk diekspor");
      return;
    }

    const headers = ["ID", "Nama", "Email", "Peran", "Tipe", "No. Telepon", "Status", "Tanggal Terdaftar"];
    const rows = allUsersList.map((u) => {
      const typeItems = getUserTypeDetails(u);
      const typeText = typeItems ? typeItems.map((t) => t.label).join(", ") : "-";

      return [
        `"${u.id || ""}"`,
        `"${(u.name || "").replace(/"/g, '""')}"`,
        `"${u.email || ""}"`,
        `"${ROLE_CONFIG[normalizeRole(u.role)]?.label || u.role || ""}"`,
        `"${typeText}"`,
        `"${u.phone_number || ""}"`,
        `"${u.is_active ? "Aktif" : "Nonaktif"}"`,
        `"${u.created_at ? dayjs(u.created_at).format("YYYY-MM-DD HH:mm:ss") : ""}"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `agrolink_pengguna_${dayjs().format("YYYYMMDD_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success("Data pengguna berhasil diekspor");
  };

  // Reset filter tabel
  const handleResetFilters = () => {
    setSearchText("");
    setRoleFilter("");
    setTypeFilter("");
    setStatusFilter("");
  };

  // Load awal & filter
  useEffect(() => {
    fetchUsers(1, pagination.pageSize, searchText, roleFilter);
  }, [searchText, roleFilter, pagination.pageSize]);

  useEffect(() => {
    fetchAllUsersForAnalytics();
  }, []);

  // Filter data tabel di sisi klien untuk status aktif/nonaktif dan sub-tipe
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Filter status
      if (statusFilter) {
        const isAct = statusFilter === "active";
        if (item.is_active !== isAct) return false;
      }

      // Filter tipe jika dipilih
      if (typeFilter) {
        const typeItems = getUserTypeDetails(item);
        if (!typeItems || typeItems.length === 0) return false;
        const matches = typeItems.some(
          (t) => t.label.toLowerCase() === typeFilter.toLowerCase()
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [data, statusFilter, typeFilter]);

  // Perhitungan 5 Statistik Widget (Memprioritaskan stats resmi dari backend jika ada)
  const stats = useMemo(() => {
    let fCount = apiStats?.total_farmer ?? 0;
    let wCount = apiStats?.total_worker ?? 0;
    let gCount = apiStats?.total_general ?? 0;
    let dCount = 0;
    let mCount = 0;
    let actCount = 0;
    let inactCount = 0;
    let totalUsers = apiStats?.total_users ?? 0;

    if (allUsersList && allUsersList.length > 0) {
      let calcFarmer = 0;
      let calcWorker = 0;
      let calcDriver = 0;
      let calcGeneral = 0;
      let calcMitra = 0;

      allUsersList.forEach((u) => {
        const roleKey = normalizeRole(u.role);
        if (roleKey === "farmer") calcFarmer++;
        else if (roleKey === "worker") calcWorker++;
        else if (roleKey === "driver") calcDriver++;
        else if (roleKey === "general") calcGeneral++;
        else if (roleKey === "mitra") calcMitra++;

        if (u.is_active) actCount++;
        else inactCount++;
      });

      fCount = apiStats?.total_farmer ?? calcFarmer;
      wCount = apiStats?.total_worker ?? calcWorker;
      gCount = apiStats?.total_general ?? calcGeneral;
      dCount = calcDriver;
      mCount = calcMitra;
      totalUsers = apiStats?.total_users ?? allUsersList.length;
    }

    return {
      farmer: fCount,
      worker: wCount,
      driver: dCount,
      general: gCount,
      mitra: mCount,
      active: actCount,
      inactive: inactCount,
      total: totalUsers,
    };
  }, [allUsersList, apiStats]);

  // Perhitungan Rincian Tipe untuk Pop-up (Pemberi Kerja & Pekerja)
  const typeBreakdown = useMemo(() => {
    const farmerTypes = {
      petani: { label: "Petani", count: 0, color: "#10b981", tagColor: "green", bg: "#ecfdf5", border: "#a7f3d0", rawKey: "agriculture", desc: "Sektor Pertanian & Agraria" },
      peternak: { label: "Peternak", count: 0, color: "#f59e0b", tagColor: "orange", bg: "#fffbeb", border: "#fde68a", rawKey: "livestock", desc: "Sektor Peternakan & Ternak" },
      pemilik_proyek: { label: "Pemilik Proyek", count: 0, color: "#8b5cf6", tagColor: "purple", bg: "#f5f3ff", border: "#ddd6fe", rawKey: "construction", desc: "Proyek Konstruksi & Infrastruktur" },
      other: { label: "Lainnya / Tidak Ditentukan", count: 0, color: "#6b7280", tagColor: "default", bg: "#f3f4f6", border: "#e5e7eb", rawKey: "other", desc: "Tipe belum dipilih" },
      total: 0,
    };

    const workerTypes = {
      peternak: { label: "Peternak", count: 0, color: "#f59e0b", tagColor: "orange", bg: "#fffbeb", border: "#fde68a", rawKey: "peternakan", desc: "Keahlian Perawatan & Pengelolaan Ternak" },
      buruh_tani: { label: "Buruh Tani", count: 0, color: "#10b981", tagColor: "green", bg: "#ecfdf5", border: "#a7f3d0", rawKey: "pertanian", desc: "Keahlian Tanam, Rawat, & Panen Pertanian" },
      tukang: { label: "Tukang Bangunan", count: 0, color: "#3b82f6", tagColor: "blue", bg: "#eff6ff", border: "#bfdbfe", rawKey: "pertukangan", desc: "Keahlian Konstruksi, Kayu, & Pertukangan" },
      other: { label: "Lainnya / Tanpa Keahlian", count: 0, color: "#6b7280", tagColor: "default", bg: "#f3f4f6", border: "#e5e7eb", rawKey: "other", desc: "Keahlian belum ditentukan" },
      total: 0,
    };

    allUsersList.forEach((u) => {
      const role = normalizeRole(u.role);
      if (role === "farmer") {
        farmerTypes.total += 1;
        const t = String(u.type || "").toLowerCase().trim();
        if (t === "agriculture" || t === "pertanian" || t === "petani") {
          farmerTypes.petani.count += 1;
        } else if (t === "livestock" || t === "peternakan" || t === "peternak") {
          farmerTypes.peternak.count += 1;
        } else if (t === "construction" || t === "pertukangan" || t === "pemilik proyek" || t === "pemilik_proyek") {
          farmerTypes.pemilik_proyek.count += 1;
        } else {
          farmerTypes.other.count += 1;
        }
      } else if (role === "worker") {
        workerTypes.total += 1;
        const skills = u.skills;
        if (!skills || (Array.isArray(skills) && skills.length === 0)) {
          workerTypes.other.count += 1;
        } else {
          const list = Array.isArray(skills) ? skills : [skills];
          let matched = false;
          list.forEach((sk) => {
            const s = String(sk).toLowerCase().trim();
            if (s === "peternakan" || s === "peternak") {
              workerTypes.peternak.count += 1;
              matched = true;
            } else if (s === "pertanian" || s === "buruh tani" || s === "buruh_tani") {
              workerTypes.buruh_tani.count += 1;
              matched = true;
            } else if (s === "pertukangan" || s === "tukang" || s === "tukang bangunan" || s === "tukang_bangunan") {
              workerTypes.tukang.count += 1;
              matched = true;
            }
          });
          if (!matched) {
            workerTypes.other.count += 1;
          }
        }
      }
    });

    return { farmer: farmerTypes, worker: workerTypes };
  }, [allUsersList]);

  // Handler klik pada widget statistik
  const handleStatCardClick = (rKey) => {
    if (rKey === "farmer" || rKey === "worker") {
      // Buka Pop-up Breakdown Tipe dengan latar belakang blur
      setBreakdownModal({ open: true, role: rKey });
    } else {
      // Role tanpa tipe (Driver, Umum, Mitra): toggle filter role langsung
      const isSelected = roleFilter === rKey && !typeFilter;
      setRoleFilter(isSelected ? "" : rKey);
      setTypeFilter("");
    }
  };

  // Perhitungan Data Grafik Garis (Berdasarkan Tanggal & Dibedakan Warna tiap Role)
  const chartData = useMemo(() => {
    if (!allUsersList || allUsersList.length === 0) return [];

    let start = dayjs().subtract(29, "day").startOf("day");
    let end = dayjs().endOf("day");

    if (timeRange === "7d") {
      start = dayjs().subtract(6, "day").startOf("day");
    } else if (timeRange === "30d") {
      start = dayjs().subtract(29, "day").startOf("day");
    } else if (timeRange === "90d") {
      start = dayjs().subtract(89, "day").startOf("day");
    } else if (timeRange === "custom" && customRange && customRange[0] && customRange[1]) {
      start = dayjs(customRange[0]).startOf("day");
      end = dayjs(customRange[1]).endOf("day");
    } else if (timeRange === "all") {
      const sorted = [...allUsersList]
        .filter((u) => u.created_at)
        .sort((a, b) => dayjs(a.created_at).diff(dayjs(b.created_at)));
      if (sorted.length > 0) {
        start = dayjs(sorted[0].created_at).startOf("day");
      }
    }

    const totalDays = Math.max(1, end.diff(start, "day") + 1);

    // Hitung pendaftaran per tanggal & peran
    const dailyCounts = {};
    const priorCounts = { farmer: 0, worker: 0, driver: 0, general: 0, mitra: 0 };

    allUsersList.forEach((user) => {
      if (!user.created_at) return;
      const userDate = dayjs(user.created_at);
      const roleKey = normalizeRole(user.role);

      if (userDate.isBefore(start)) {
        priorCounts[roleKey] = (priorCounts[roleKey] || 0) + 1;
      } else if (!userDate.isAfter(end)) {
        const dateKey = userDate.format("YYYY-MM-DD");
        if (!dailyCounts[dateKey]) {
          dailyCounts[dateKey] = { farmer: 0, worker: 0, driver: 0, general: 0, mitra: 0 };
        }
        dailyCounts[dateKey][roleKey] = (dailyCounts[dateKey][roleKey] || 0) + 1;
      }
    });

    const roleKeys = ["farmer", "worker", "driver", "general", "mitra"];
    const runningCumulative = { ...priorCounts };
    const points = [];

    let curr = start;
    while (!curr.isAfter(end)) {
      const dateKey = curr.format("YYYY-MM-DD");
      const displayDate = totalDays <= 35 ? curr.format("DD MMM") : curr.format("DD/MM/YY");
      const dayData = dailyCounts[dateKey] || {
        farmer: 0,
        worker: 0,
        driver: 0,
        general: 0,
        mitra: 0,
      };

      roleKeys.forEach((rKey) => {
        const newCount = dayData[rKey] || 0;
        runningCumulative[rKey] = (runningCumulative[rKey] || 0) + newCount;

        points.push({
          date: displayDate,
          fullDate: curr.format("DD MMMM YYYY"),
          role: ROLE_CONFIG[rKey].label,
          roleKey: rKey,
          value: chartMode === "cumulative" ? runningCumulative[rKey] : newCount,
        });
      });

      curr = curr.add(1, "day");
    }

    return points;
  }, [allUsersList, timeRange, customRange, chartMode]);

  // Metrik ringkasan untuk grafik periode terpilih
  const chartSummary = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { totalNew: 0, topRole: "-", avgDaily: "0" };
    }

    if (chartMode === "daily") {
      const totalNew = chartData.reduce((acc, curr) => acc + curr.value, 0);
      const roleTotals = {};
      chartData.forEach((d) => {
        roleTotals[d.role] = (roleTotals[d.role] || 0) + d.value;
      });

      let topRole = "-";
      let maxVal = -1;
      Object.entries(roleTotals).forEach(([r, val]) => {
        if (val > maxVal) {
          maxVal = val;
          topRole = `${r} (${val})`;
        }
      });

      const uniqueDates = new Set(chartData.map((d) => d.date)).size || 1;
      const avgDaily = (totalNew / uniqueDates).toFixed(1);

      return { totalNew, topRole, avgDaily };
    } else {
      const uniqueDates = Array.from(new Set(chartData.map((d) => d.date)));
      const firstDate = uniqueDates[0];
      const lastDate = uniqueDates[uniqueDates.length - 1];

      const initialTotal = chartData
        .filter((d) => d.date === firstDate)
        .reduce((acc, c) => acc + c.value, 0);
      const finalTotal = chartData
        .filter((d) => d.date === lastDate)
        .reduce((acc, c) => acc + c.value, 0);

      const netGrowth = Math.max(0, finalTotal - initialTotal);
      const avgDaily = (netGrowth / Math.max(1, uniqueDates.length)).toFixed(1);

      return {
        totalNew: netGrowth,
        topRole: `Total ${finalTotal} Pengguna`,
        avgDaily,
      };
    }
  }, [chartData, chartMode]);

  // Konfigurasi @ant-design/plots Line
  const lineChartConfig = {
    data: chartData,
    xField: "date",
    yField: "value",
    colorField: "role",
    shapeField: "smooth",
    scale: {
      color: {
        domain: ["Pemberi Kerja", "Pekerja", "Driver", "Umum", "Mitra"],
        range: ["#10b981", "#3b82f6", "#f59e0b", "#06b6d4", "#8b5cf6"],
      },
      y: {
        nice: true,
        min: 0,
      },
    },
    axis: {
      x: {
        title: { text: "Tanggal Pendaftaran" },
        labelAutoHide: true,
        labelAutoRotate: false,
      },
      y: {
        title: {
          text: chartMode === "cumulative" ? "Jumlah Pengguna (Akumulasi)" : "Pendaftaran Baru (Harian)",
        },
      },
    },
    point: {
      shapeField: "circle",
      sizeField: 3.5,
    },
    interaction: {
      tooltip: {
        marker: true,
      },
    },
    legend: {
      color: {
        position: "top",
        layout: { justifyContent: "center" },
      },
    },
    animate: { enter: { type: "fadeIn", duration: 500 } },
    height: 320,
  };

  // Handler ganti halaman tabel
  const handleTableChange = (newPagination) => {
    fetchUsers(newPagination.current, newPagination.pageSize, searchText, roleFilter);
  };

  // Kolom Tabel Pengguna dengan Desain Modern
  const columns = [
    {
      title: "Pengguna",
      dataIndex: "name",
      key: "name",
      render: (name, record) => {
        const roleKey = normalizeRole(record.role);
        const config = ROLE_CONFIG[roleKey];
        const initials = (name || "U")
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        return (
          <Space orientation="horizontal" size={12}>
            <Avatar
              style={{
                backgroundColor: config.lightBg,
                color: config.color,
                border: `1.5px solid ${config.border}`,
                fontWeight: 600,
              }}
            >
              {initials}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: 14, display: "block" }}>
                {name || "Tanpa Nama"}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.email || "-"}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Peran (Role)",
      dataIndex: "role",
      key: "role",
      render: (role) => {
        const roleKey = normalizeRole(role);
        const config = ROLE_CONFIG[roleKey];
        return (
          <Tag
            color={config.tagColor}
            style={{
              borderRadius: 6,
              padding: "2px 10px",
              fontWeight: 500,
              fontSize: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 12 }}>{React.cloneElement(config.icon, { style: { fontSize: 13 } })}</span>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Tipe",
      key: "user_type",
      render: (_, record) => {
        const typeItems = getUserTypeDetails(record);
        if (!typeItems || typeItems.length === 0) {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Space wrap size={4}>
            {typeItems.map((item, idx) => (
              <Tag
                key={idx}
                color={item.color}
                style={{
                  borderRadius: 4,
                  margin: 0,
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                {item.label}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "No. Telepon",
      dataIndex: "phone_number",
      key: "phone_number",
      render: (phone) =>
        phone ? (
          <Space size={6}>
            <PhoneOutlined style={{ color: "#8c8c8c" }} />
            <Text>{phone}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Status Akun",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive) => (
        <Badge
          status={isActive ? "success" : "error"}
          text={
            <span style={{ fontWeight: 500, color: isActive ? "#389e0d" : "#cf1322" }}>
              {isActive ? "Aktif" : "Nonaktif"}
            </span>
          }
        />
      ),
    },
    {
      title: "Terdaftar Pada",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => {
        if (!date) return "-";
        const d = dayjs(date);
        return (
          <Tooltip title={`Registrasi: ${d.format("DD MMMM YYYY, HH:mm [WIB]")} (${d.fromNow()})`}>
            <Space size={6}>
              <CalendarOutlined style={{ color: "#8c8c8c" }} />
              <Text>{d.format("DD MMM YYYY")}</Text>
            </Space>
          </Tooltip>
        );
      },
    },
  ];

  // List 5 Role Keys untuk Widget Sejajar
  const roleKeys = ["farmer", "worker", "driver", "general", "mitra"];

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* 1. Header Bar Dashboard Manajemen Pengguna */}
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
          <Space align="center" size={10}>
            <Title level={3} style={{ margin: 0 }}>
              Manajemen Pengguna
            </Title>
            <Tag color="blue" style={{ borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {stats.total} Akun Terdaftar
            </Tag>
          </Space>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">
              Pantau distribusi peran, pantau tren kenaikan pendaftaran pengguna, dan kelola akun secara efisien.
            </Text>
          </div>
        </div>

        <Space wrap>
          <Tooltip title="Muat ulang seluruh data pengguna dan analitik">
            <Button
              icon={<ReloadOutlined spin={statsLoading || loading} />}
              onClick={handleRefreshAll}
              disabled={loading || statsLoading}
            >
              Segarkan
            </Button>
          </Tooltip>

          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportCSV}
            style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
          >
            Ekspor CSV
          </Button>
        </Space>
      </div>

      {/* 2. 5 Widget Statistik Sejajar (5 Kolom di Desktop) */}
      <Spin spinning={statsLoading} tip="Memuat statistik...">
        <div className="stat-grid-5">
          {roleKeys.map((rKey) => {
            const config = ROLE_CONFIG[rKey];
            const count = stats[rKey] || 0;
            const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0;
            const isSelected = roleFilter === rKey;
            const isTypeFiltered = isSelected && Boolean(typeFilter);

            return (
              <div
                key={rKey}
                className={`stat-card-custom ${isSelected ? "is-active" : ""}`}
                onClick={() => handleStatCardClick(rKey)}
                title={
                  config.hasTypes
                    ? `Klik untuk melihat rincian tipe & filter ${config.label}`
                    : `Klik untuk filter peran ${config.label}`
                }
                style={{
                  borderTop: `4px solid ${config.color}`,
                  padding: "16px 20px",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Text strong style={{ fontSize: 15, color: "#374151" }}>
                      {config.label}
                    </Text>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: config.lightBg,
                        border: `1px solid ${config.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {config.icon}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: "#111827",
                        lineHeight: 1.1,
                      }}
                    >
                      {count.toLocaleString("id-ID")}
                    </span>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      akun
                    </Text>
                  </div>
                </div>

                <div>
                  <Progress
                    percent={parseFloat(percentage)}
                    strokeColor={config.color}
                    size="small"
                    showInfo={false}
                    style={{ marginBottom: 4 }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 12,
                    }}
                  >
                    <Text type="secondary">{percentage}% dari total</Text>

                    {config.hasTypes ? (
                      <Tag
                        color={isTypeFiltered ? "purple" : isSelected ? "blue" : "cyan"}
                        style={{ fontSize: 11, margin: 0, padding: "0 6px", borderRadius: 4 }}
                      >
                        {isTypeFiltered ? `Tipe: ${typeFilter}` : isSelected ? "Difilter ↗" : "Rincian Tipe ↗"}
                      </Tag>
                    ) : (
                      isSelected && (
                        <Tag color="blue" style={{ fontSize: 11, margin: 0, padding: "0 6px" }}>
                          Difilter
                        </Tag>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Spin>

      {/* 3. Grafik Kenaikan Berdasarkan Tanggal yang Dibedakan Warna tiap Garis Berdasarkan Role */}
      <Card
        className="modern-card"
        style={{ marginBottom: 24 }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <LineChartOutlined style={{ color: "#1677ff", fontSize: 18 }} />
            <div>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Grafik Kenaikan Pendaftaran Pengguna</span>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 400,
                  color: "#6b7280",
                  marginTop: 2,
                }}
              >
                Garis berwarna membedakan tren kenaikan masing-masing peran pengguna dari waktu ke waktu
              </span>
            </div>
          </div>
        }
        extra={
          <Space wrap size={12}>
            {/* Mode: Kumulatif vs Harian */}
            <Segmented
              value={chartMode}
              onChange={setChartMode}
              options={[
                { label: "📈 Kenaikan Kumulatif", value: "cumulative" },
                { label: "📊 Pendaftaran Harian", value: "daily" },
              ]}
            />

            {/* Filter Rentang Waktu */}
            <Select
              value={timeRange}
              onChange={(val) => {
                setTimeRange(val);
                if (val !== "custom") setCustomRange(null);
              }}
              style={{ width: 150 }}
            >
              <Option value="7d">7 Hari Terakhir</Option>
              <Option value="30d">30 Hari Terakhir</Option>
              <Option value="90d">90 Hari Terakhir</Option>
              <Option value="all">Semua Waktu</Option>
              <Option value="custom">Rentang Kustom</Option>
            </Select>

            {timeRange === "custom" && (
              <RangePicker
                value={customRange}
                onChange={setCustomRange}
                format="DD/MM/YYYY"
                style={{ width: 230 }}
              />
            )}
          </Space>
        }
      >
        {/* Ringkasan Legend Interaktif di Atas Grafik */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
            padding: "10px 16px",
            background: "#f9fafb",
            borderRadius: 8,
            border: "1px solid #f3f4f6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              Warna Garis Peran:
            </Text>
            {roleKeys.map((rKey) => {
              const cfg = ROLE_CONFIG[rKey];
              return (
                <div key={rKey} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: cfg.color,
                      display: "inline-block",
                      boxShadow: `0 0 0 2px ${cfg.lightBg}`,
                    }}
                  />
                  <span style={{ fontWeight: 500, color: "#374151" }}>{cfg.label}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ fontSize: 13 }}>
              <Text type="secondary">
                {chartMode === "cumulative" ? "Pertumbuhan Periode Ini:" : "Total Pendaftar Baru:"}
              </Text>{" "}
              <Text strong style={{ color: "#1677ff" }}>
                +{chartSummary.totalNew.toLocaleString("id-ID")}
              </Text>
            </div>
            <div style={{ fontSize: 13 }}>
              <Text type="secondary">Rata-rata/Hari:</Text>{" "}
              <Text strong>{chartSummary.avgDaily} pendaftar</Text>
            </div>
          </div>
        </div>

        {/* Visualisasi Line Chart @ant-design/plots */}
        {statsLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 12, color: "#6b7280" }}>Mempersiapkan grafik kenaikan pengguna...</div>
          </div>
        ) : chartData.length > 0 ? (
          <div style={{ width: "100%", height: 320 }}>
            <Line {...lineChartConfig} />
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Tidak ada data pendaftaran untuk rentang tanggal yang dipilih."
            style={{ margin: "40px 0" }}
          />
        )}
      </Card>

      {/* 4. Tabel Manajemen Pengguna */}
      <Card
        className="modern-card user-table"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <TeamOutlined style={{ color: "#1677ff", fontSize: 18 }} />
            <span style={{ fontWeight: 600, fontSize: 16 }}>Daftar Pengguna Platform</span>

            {roleFilter && (
              <Tag
                color={ROLE_CONFIG[roleFilter]?.tagColor}
                closable
                onClose={() => {
                  setRoleFilter("");
                  setTypeFilter("");
                }}
              >
                Peran: {ROLE_CONFIG[roleFilter]?.label}
              </Tag>
            )}

            {typeFilter && (
              <Tag color="cyan" closable onClose={() => setTypeFilter("")}>
                Tipe: {typeFilter}
              </Tag>
            )}
          </div>
        }
        extra={
          <Space wrap size={10}>
            {/* Filter Peran */}
            <Select
              placeholder="Filter Peran"
              style={{ width: 160 }}
              allowClear
              value={roleFilter || undefined}
              onChange={(value) => {
                setRoleFilter(value || "");
                setTypeFilter(""); // Reset filter sub-tipe saat peran berganti
              }}
            >
              <Option value="farmer">🟢 Pemberi Kerja</Option>
              <Option value="worker">🔵 Pekerja</Option>
              <Option value="driver">🟠 Driver</Option>
              <Option value="general">🌐 Umum</Option>
              <Option value="mitra">🟣 Mitra</Option>
            </Select>

            {/* Filter Sub-Tipe (Hanya aktif untuk Pemberi Kerja / Pekerja) */}
            {roleFilter === "farmer" && (
              <Select
                placeholder="Filter Tipe"
                style={{ width: 150 }}
                allowClear
                value={typeFilter || undefined}
                onChange={(value) => setTypeFilter(value || "")}
              >
                <Option value="Petani">🟢 Petani</Option>
                <Option value="Peternak">🟠 Peternak</Option>
                <Option value="Pemilik Proyek">🟣 Pemilik Proyek</Option>
              </Select>
            )}

            {roleFilter === "worker" && (
              <Select
                placeholder="Filter Tipe"
                style={{ width: 150 }}
                allowClear
                value={typeFilter || undefined}
                onChange={(value) => setTypeFilter(value || "")}
              >
                <Option value="Peternak">🟠 Peternak</Option>
                <Option value="Buruh Tani">🟢 Buruh Tani</Option>
                <Option value="Tukang Bangunan">🔵 Tukang Bangunan</Option>
              </Select>
            )}

            {/* Filter Status Akun */}
            <Select
              placeholder="Filter Status"
              style={{ width: 140 }}
              allowClear
              value={statusFilter || undefined}
              onChange={(value) => setStatusFilter(value || "")}
            >
              <Option value="active">🟢 Aktif</Option>
              <Option value="inactive">🔴 Nonaktif</Option>
            </Select>

            {/* Input Pencarian Nama/Email */}
            <Input
              placeholder="Cari Nama / Email / Telepon..."
              prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />

            {(searchText || roleFilter || typeFilter || statusFilter) && (
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
          dataSource={filteredData}
          rowKey={(record) => record.id || record.email || Math.random().toString()}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) => (
              <Text type="secondary" style={{ fontSize: 13 }}>
                Menampilkan <b>{range[0]}-{range[1]}</b> dari total <b>{total}</b> pengguna
              </Text>
            ),
          }}
          onChange={handleTableChange}
          scroll={{ x: 850 }}
          style={{ borderRadius: 8 }}
        />
      </Card>

      {/* 5. Pop-up Rincian Tipe (Pemberi Kerja & Pekerja) dengan Blur Background */}
      <Modal
        open={breakdownModal.open}
        onCancel={() => setBreakdownModal({ open: false, role: null })}
        centered
        width={580}
        footer={null}
        maskClosable={true}
        styles={{
          mask: {
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            backgroundColor: "rgba(15, 23, 42, 0.55)",
          },
          content: {
            borderRadius: 16,
            padding: "24px 28px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
        }}
      >
        {breakdownModal.role && (
          <div>
            {/* Header Modal */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: ROLE_CONFIG[breakdownModal.role].lightBg,
                  border: `1.5px solid ${ROLE_CONFIG[breakdownModal.role].border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {ROLE_CONFIG[breakdownModal.role].icon}
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: "#111827" }}>
                  Rincian Tipe: {ROLE_CONFIG[breakdownModal.role].label}
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Pilih tipe di bawah untuk memfilter daftar pengguna pada tabel
                </Text>
              </div>
            </div>

            {/* Total Akun Header Info */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f9fafb",
                padding: "12px 18px",
                borderRadius: 10,
                border: "1px solid #f3f4f6",
                marginBottom: 20,
              }}
            >
              <Space size={6}>
                <ApartmentOutlined style={{ color: "#6b7280" }} />
                <Text strong style={{ color: "#374151" }}>
                  Total {ROLE_CONFIG[breakdownModal.role].label} Terdaftar:
                </Text>
              </Space>
              <Tag
                color={ROLE_CONFIG[breakdownModal.role].tagColor}
                style={{ fontSize: 14, fontWeight: 700, padding: "2px 12px", borderRadius: 12 }}
              >
                {(typeBreakdown[breakdownModal.role]?.total || 0).toLocaleString("id-ID")} akun
              </Tag>
            </div>

            {/* List Tipe Sub-kategori */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(typeBreakdown[breakdownModal.role] || {})
                .filter(([k, val]) => k !== "total" && (val.count > 0 || k !== "other"))
                .map(([k, item]) => {
                  const roleTotal = typeBreakdown[breakdownModal.role]?.total || 1;
                  const pct = ((item.count / roleTotal) * 100).toFixed(1);
                  const isCurrentType = typeFilter === item.label && roleFilter === breakdownModal.role;

                  return (
                    <div
                      key={k}
                      onClick={() => {
                        setRoleFilter(breakdownModal.role);
                        setTypeFilter(item.label);
                        setBreakdownModal({ open: false, role: null });
                        message.info(`Memfilter tabel ke: ${ROLE_CONFIG[breakdownModal.role].label} - ${item.label}`);
                      }}
                      style={{
                        padding: "16px 20px",
                        borderRadius: 12,
                        border: isCurrentType ? `2px solid ${item.color}` : "1px solid #e5e7eb",
                        backgroundColor: isCurrentType ? item.bg : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <Space size={8}>
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                backgroundColor: item.color,
                                display: "inline-block",
                              }}
                            />
                            <Text strong style={{ fontSize: 15, color: "#111827" }}>
                              {item.label}
                            </Text>
                            {isCurrentType && (
                              <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                                Sedang Aktif
                              </Tag>
                            )}
                          </Space>
                          {item.desc && (
                            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, paddingLeft: 18 }}>
                              {item.desc}
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                              {item.count.toLocaleString("id-ID")}
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {pct}%
                            </Text>
                          </div>
                          <ArrowRightOutlined style={{ color: "#9ca3af", fontSize: 12 }} />
                        </div>
                      </div>

                      <Progress
                        percent={parseFloat(pct)}
                        strokeColor={item.color}
                        size="small"
                        showInfo={false}
                      />
                    </div>
                  );
                })}
            </div>

            {/* Footer Modal Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginTop: 24,
                paddingTop: 16,
                borderTop: "1px solid #f3f4f6",
              }}
            >
              <Button
                onClick={() => {
                  setRoleFilter(breakdownModal.role);
                  setTypeFilter("");
                  setBreakdownModal({ open: false, role: null });
                  message.info(`Memfilter tabel ke semua ${ROLE_CONFIG[breakdownModal.role].label}`);
                }}
              >
                Tampilkan Semua {ROLE_CONFIG[breakdownModal.role].label}
              </Button>

              <Button
                type="primary"
                onClick={() => setBreakdownModal({ open: false, role: null })}
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UsersPage;
