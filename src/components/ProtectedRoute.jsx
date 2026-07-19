import React from 'react';
// import { useAuth } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();
    const location = useLocation();

    if (!token) {
        // Jika tidak ada token, arahkan ke halaman login
        // 'replace' akan mengganti riwayat navigasi
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Jika ada token, tampilkan halaman yang diminta
    return children;
};

export default ProtectedRoute;