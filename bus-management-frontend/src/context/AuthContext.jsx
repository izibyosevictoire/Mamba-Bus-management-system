import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for token and load user profile if exists
        const token = localStorage.getItem('token');
        if (token) {
            checkAuth();
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async () => {
        try {
            const response = await api.get('/Auth/profile');
            // Ensure we extract the 'data' property from the ApiResponse wrapper
            const userData = response.data.data || response.data;
            setUser(userData);
        } catch (error) {
            console.error("Auth check failed", error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/Auth/login', { email, password });
            const result = response.data.data || response.data;
            const { token, user: userProfile } = result;
            
            if (token) {
                localStorage.setItem('token', token);
                // Immediately set the user profile to speed up redirection
                setUser(userProfile);
                setLoading(false);
            } else {
                throw new Error("No token received");
            }
        } catch (error) {
            localStorage.removeItem('token');
            setUser(null);
            throw error;
        }
    };

    const register = async (data) => {
        await api.post('/Auth/register', data);
        // Auto login after register or just redirect?
        // For now, let's assume we redirect to login or auto-login.
        // Let's implement auto-login if token is returned, otherwise just return.
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, token: localStorage.getItem('token') }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
