import React, { createContext, useCallback, useState, useRef, useEffect, useMemo, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import axios from "axios";

export const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
    withCredentials: true,
});

type User = {
    name: string;
    email: string;
    company?: string;
    role: string;
    org_id?: number | null;
};

type DecodedJwt = {
    sub: string;
    email?: string;
    name?: string;
    roles?: string[] | string;
    role?: string;
    org_id?: number;
    company?: string;
    exp: number;
    [k: string]: unknown;
};

type AuthProviderValue = {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    getAccessToken: () => string | null;
    api: AxiosInstance;
};

function isExpired(token: string, skewSeconds = 5): boolean {
    try {
        const decoded = jwtDecode<DecodedJwt>(token);
        const now = Math.floor(Date.now() / 1000);
        return decoded.exp <= now + skewSeconds;
    } catch {
        return true;
    }
}

const AuthContext = createContext<AuthProviderValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<{ user: User | null; loading: boolean }>({ user: null, loading: true });
    const accessTokenRef = useRef<string | null>(null);
    const refreshPromiseRef = useRef<Promise<string> | null>(null);

    const setAccessToken = useCallback((token: string | null) => {
        accessTokenRef.current = token;
        if (token) {
            const decoded: DecodedJwt = jwtDecode(token);
            setState({
                user: {
                    name: decoded.name || "",
                    email: decoded.email || "",
                    company: decoded.company,
                    role: decoded.role || (Array.isArray(decoded.roles) ? decoded.roles[0] : (decoded.roles as string)) || "",
                    org_id: decoded.org_id ?? null,
                },
                loading: false,
            });
        } else {
            setState({ user: null, loading: false });
        }
    }, []);

    const refresh = useCallback(async (): Promise<string> => {
        if (refreshPromiseRef.current) return refreshPromiseRef.current;

        const promise = api.post<{ accessToken: string }>("/auth/refresh", {}, { withCredentials: true })
            .then(res => {
                const token = res.data.accessToken;
                setAccessToken(token);
                return token;
            });

        refreshPromiseRef.current = promise;

        promise.finally(() => {
            refreshPromiseRef.current = null;
        });

        return promise;
    }, [setAccessToken]);

    useEffect(() => {
        const requestId = api.interceptors.request.use(async (config) => {
            if (!config.url) return config;
            if (config.url.includes("/auth/login") || config.url.includes("/auth/refresh")) return config;

            let token = accessTokenRef.current;
            if (!token || isExpired(token)) {
                try {
                    token = await refresh();
                } catch {
                    token = null;
                }
            }

            if (token && config.headers) {
                (config.headers as any).Authorization = `Bearer ${token}`;
            }
            return config;
        });

        const responseId = api.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    try {
                        const newToken = await refresh();
                        if (originalRequest.headers) {
                            (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;
                        }
                        return api(originalRequest);
                    } catch (err) {
                        return Promise.reject(err);
                    }
                }
                return Promise.reject(error);
            }
        );

        refresh().catch(() => setState(s => ({ ...s, loading: false })));

        return () => {
            api.interceptors.request.eject(requestId);
            api.interceptors.response.eject(responseId);
        };
    }, [refresh]);

    const login = useCallback(async (email: string, password: string) => {
        const res = await api.post<{ accessToken: string }>("/auth/login", { email, password });
        setAccessToken(res.data.accessToken);
    }, [setAccessToken]);

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            setAccessToken(null);
        }
    }, [setAccessToken]);

    const value = useMemo(() => ({
        user: state.user,
        loading: state.loading,
        login,
        logout,
        getAccessToken: () => accessTokenRef.current,
        api,
    }), [state.user, state.loading, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}