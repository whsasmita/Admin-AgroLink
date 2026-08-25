import axios from "axios";

// 1. Konfigurasi Base URL Dinamis (Environment-Aware)
// Mengambil dari variabel environment VITE_API_BASE_URL jika tersedia,
// atau otomatis fallback ke production / local environment.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? "https://api.goagrolink.com/api/v1"
    : "http://localhost:8090/api/v1");

// 2. Inisialisasi Instance Axios dengan Pengamanan Dasar
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Timeout 30 detik untuk mencegah hanging request
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// 3. Request Interceptor: Injeksi Token Otomatis & Sanitasi
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token && typeof token === "string") {
      const cleanToken = token.trim();
      if (cleanToken) {
        config.headers["Authorization"] = `Bearer ${cleanToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 4. Response Interceptor: Penanganan Otomatis Sesi Kedaluwarsa (401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Jika sesi kedaluwarsa atau token tidak valid
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("adminToken");
      // Redirect ke login jika bukan di halaman login untuk mencegah looping
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ==========================================
// DAFTAR ENDPOINT SERVICE AGROLINK
// ==========================================

// 1. Otentikasi Admin
export const loginAdmin = (email, password) => {
  return api.post("/public/auth/login", { email, password });
};

// 2. Statistik Dashboard Utama
export const getDashboardStats = () => {
  return api.get("/admin/dashboard-stats");
};

// 3. Manajemen Payouts
export const getPendingPayouts = () => {
  return api.get("/admin/payouts/pending");
};

export const markPayoutAsCompleted = (payoutId, formData) => {
  return api.post(`/admin/payouts/${payoutId}/complete`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// 4. Verifikasi Dokumen Mitra / Pengguna
export const getPendingVerifications = () => {
  return api.get("/admin/verifications/pending");
};

export const reviewVerification = (verificationId, payload) => {
  return api.post(`/admin/verifications/${verificationId}/review`, payload);
};

// 5. Riwayat & Daftar Transaksi (Mendukung Filter Lengkap & Paginasi)
export const getAllTransactions = (
  page = 1,
  limit = 10,
  search = "",
  serviceType = "",
  paymentMethod = ""
) => {
  const params = new URLSearchParams();
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);
  if (search && search.trim()) params.append("search", search.trim());
  if (serviceType && serviceType.trim()) params.append("service_type", serviceType.trim());
  if (paymentMethod && paymentMethod.trim()) params.append("payment_method", paymentMethod.trim());

  const queryString = params.toString();
  return api.get(`/admin/transactions${queryString ? `?${queryString}` : ""}`);
};

// 6. Manajemen Pengguna (User Management)
export const getAllUsers = (page = 1, limit = 10, search = "", role = "") => {
  const params = new URLSearchParams();
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);
  if (search && search.trim()) params.append("search", search.trim());
  if (role && role.trim()) params.append("role", role.trim());

  const queryString = params.toString();
  return api.get(`/admin/users${queryString ? `?${queryString}` : ""}`);
};

// 7. Analitik Pendapatan Platform
export const getRevenueAnalytics = (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);

  const queryString = params.toString();
  return api.get(`/admin/revenue/analytics${queryString ? `?${queryString}` : ""}`);
};

// 8. Ekspor Laporan Excel
export const exportTransactions = () => {
  return api.get("/admin/transactions/export", {
    responseType: "blob",
  });
};

// 9. Laporan Keuntungan & Margin Bersih (Profit Analytics)
export const getProfitAnalytics = (startDate, endDate, sourceType = "") => {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  if (sourceType && sourceType.trim()) params.append("source_type", sourceType.trim());

  const queryString = params.toString();
  return api.get(`/admin/reports/profit${queryString ? `?${queryString}` : ""}`);
};

// Ekspor instance axios terkonfigurasi
export default api;
