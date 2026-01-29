import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { authSchemas } from '@rialo-builder/shared';

interface User {
    id: string;
    email: string;
}

export function useAuth() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            try {
                setUser(JSON.parse(userStr));
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (data: authSchemas.LoginInput) => {
        const response = await apiClient.post('/auth/login', data);
        const { accessToken, refreshToken, user } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        setUser(user);
        router.push('/dashboard');
    };

    const register = async (data: authSchemas.RegisterInput) => {
        const response = await apiClient.post('/auth/register', data);
        const { accessToken, refreshToken, user } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        setUser(user);
        router.push('/dashboard');
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');

        try {
            await apiClient.post('/auth/logout', { refreshToken });
        } catch (e) {
            // Ignore errors on logout
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        setUser(null);
        router.push('/login');
    };

    return {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
    };
}
