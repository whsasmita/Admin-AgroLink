import axios from "axios";

// Buat instance Axios
const api = axios.create({
  baseURL: "http://localhost:8080/api/v1", // Sesuaikan dengan URL API Go Anda
});

// const api = axios.create({
//   baseURL: "https://api.goagrolink.com/api/v1", // Sesuaikan dengan URL API Go Anda
// });


// [PENTING] Interceptor untuk Menambahkan Token ke Setiap Request
// Ini adalah "penjaga" yang akan menyuntikkan token Anda secara otomatis
api.interceptors.request.use(
  (config) => {
    // Ambil token dari Local Storage
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Fungsi spesifik untuk login
export const loginAdmin = (email, password) => {
  // Panggil endpoint login publik
  return api.post("/public/auth/login", { email, password });
};

export const getDashboardStats = () => {
  return api.get("/admin/dashboard-stats");
};

export const getPendingPayouts = () => {
  return api.get("/admin/payouts/pending");
};

// [TAMBAHKAN FUNGSI INI]
// Mengirim FormData untuk menyelesaikan payout
export const markPayoutAsCompleted = (payoutId, formData) => {
  return api.post(`/admin/payouts/${payoutId}/complete`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getPendingVerifications = () => {
  return api.get("/admin/verifications/pending");
};

// [TAMBAHKAN FUNGSI INI]
// Mengirim payload JSON untuk meninjau verifikasi
export const reviewVerification = (verificationId, payload) => {
  // payload = { status: "approved" | "rejected", notes: "..." }
  return api.post(`/admin/verifications/${verificationId}/review`, payload);
};

export const getAllTransactions = (page = 1, limit = 10) => {
  return api.get(`/admin/transactions?page=${page}&limit=${limit}`);
};

export const getAllUsers = (page = 1, limit = 10, search = "", role = "") => {
  // Buat query string secara dinamis
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (search) params.append("search", search);
  if (role) params.append("role", role);

  return api.get(`/admin/users?${params.toString()}`);
};

export const getRevenueAnalytics = (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);

  return api.get(`/admin/revenue/analytics?${params.toString()}`);
};

export const exportTransactions = () => {
  return api.get("/admin/transactions/export", {
    responseType: "blob", // PENTING!
  });
};

export const getProfitAnalytics = (startDate, endDate, sourceType = "") => {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  if (sourceType) params.append("source_type", sourceType);
  
  return api.get(`/admin/reports/profit?${params.toString()}`);
};

// Ekspor instance default
export default api;
