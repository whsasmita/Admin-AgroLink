import React, { createContext, useState, useContext } from 'react';
import { loginAdmin } from '../services/api'; // Impor fungsi login

// 1. Buat Konteks
const AuthContext = createContext();

// 2. Buat Provider (komponen yang "menyediakan" state)
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('adminToken'));
    const [user, setUser] = useState(null); // (Opsional) Simpan data user
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fungsi untuk login
    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await loginAdmin(email, password);

            // [PENTING] Hanya izinkan login jika perannya 'admin'
            if (response.data.data.role !== 'admin') {
                throw new Error('Akses ditolak. Hanya untuk admin.');
            }

            const { token, user } = response.data.data;

            // Simpan di state dan localStorage
            setToken(token);
            setUser(user);
            localStorage.setItem('adminToken', token);

            return true;
        } catch (err) {
            const message = err.response?.data?.message || err.message;
            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Fungsi untuk logout
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('adminToken');
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. Buat Hook (cara mudah untuk "menggunakan" state)
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    return useContext(AuthContext);
};