import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// [IMPOR BARU]
import AdminLayout from './layouts/AdminLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PayoutsPage from './pages/Payouts.jsx';
import VerificationsPage from './pages/Verifications.jsx';
import TransactionsPage from './pages/Transactions.jsx';
import UsersPage from './pages/Users.jsx';
import RevenuePage from './pages/Revenue.jsx';
import ProfitPage from './pages/Profit.jsx';

// (Nanti kita akan buat halaman ini)
// const VerificationsPage = () => <div>Halaman Verifikasi</div>;

function App() {
  return (
    <Routes>
      {/* Rute Publik: Siapapun bisa akses */}
      <Route path="/login" element={<Login />} />

      {/* [PERBAIKAN] Rute Terproteksi sekarang menggunakan AdminLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Rute-rute ini akan di-render di dalam <Outlet /> AdminLayout */}
        <Route index element={<Dashboard />} />
        <Route path="payouts" element={<PayoutsPage />} />
        <Route path="verifications" element={<VerificationsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="revenue" element={<RevenuePage />} />
        <Route path="profit" element={<ProfitPage />} />
        {/* Tambahkan rute admin lainnya di sini */}

      </Route>

    </Routes>
  );
}

export default App;