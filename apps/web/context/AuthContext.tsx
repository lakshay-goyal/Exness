'use client';

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { backendRequestHeaders, getBackendUrl } from '@/lib/backend-api';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  verifyToken: () => Promise<boolean>;
  loading: boolean;
  balance: number | null;
  balanceLoading: boolean;
  fetchBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
    router.push('/login');
  }, [router]);

  const verifyToken = useCallback(
    async (tokenToVerify?: string): Promise<boolean> => {
      const tokenToCheck = tokenToVerify || token;

      if (!tokenToCheck) {
        return false;
      }

      const config = {
        headers: {
          ...backendRequestHeaders,
          Authorization: `Bearer ${tokenToCheck}`,
        },
      };

      const maxAttempts = 5;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const verifyUserResponse = await axios.post(
            `${getBackendUrl()}/api/v1/auth/verify-user`,
            {},
            config,
          );

          const payload = verifyUserResponse.data?.data ?? verifyUserResponse.data;
          const userExists = payload?.exists === true || verifyUserResponse.status === 200;

          if (verifyUserResponse.status === 200 && userExists) {
            try {
              const base64Url = tokenToCheck.split('.')[1];
              const base64 = base64Url?.replace(/-/g, '+').replace(/_/g, '/');
              if (!base64) {
                console.error('Invalid token format: missing payload');
                return false;
              }
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join(''),
              );
              const decoded = JSON.parse(jsonPayload);

              setUser({
                id: payload?.userId || decoded.userId || decoded.id,
                email: decoded.email || '',
              });

              try {
                await axios.post(`${getBackendUrl()}/api/v1/auth/ensure-user`, {}, config);
              } catch (ensureError) {
                console.error('Error ensuring user:', ensureError);
              }

              return true;
            } catch (decodeError) {
              console.error('Error decoding token:', decodeError);
              return false;
            }
          }
        } catch (error: unknown) {
          if (error instanceof AxiosError && error.response?.status === 404 && attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }

          if (error instanceof AxiosError) {
            if (
              error.response?.status === 401 ||
              error.response?.status === 403 ||
              error.response?.status === 404
            ) {
              localStorage.removeItem('token');
              setToken(null);
              setUser(null);
              setIsAuthenticated(false);
              delete axios.defaults.headers.common['Authorization'];
              return false;
            }
          }

          console.error('Error verifying token:', error);
          return false;
        }
      }

      return false;
    },
    [token],
  );

  const initializeAuth = useCallback(async () => {
    setLoading(true);

    try {
      const url = new URL(window.location.href);
      const tokenFromUrl = url.searchParams.get('token');

      let tokenToUse: string | null = null;

      if (tokenFromUrl) {
        localStorage.setItem('token', tokenFromUrl);
        tokenToUse = tokenFromUrl;

        url.searchParams.delete('token');
        window.history.replaceState({}, '', url.toString());
      } else {
        tokenToUse = localStorage.getItem('token');
      }

      if (tokenToUse) {
        setToken(tokenToUse);
        axios.defaults.headers.common['Authorization'] = `Bearer ${tokenToUse}`;

        const isValid = await verifyToken(tokenToUse);

        if (isValid) {
          setIsAuthenticated(true);

          if (pathname === '/login' || pathname === '/' || tokenFromUrl) {
            router.push('/dashboard');
          }
        } else {
          localStorage.removeItem('token');
          setToken(null);
          setIsAuthenticated(false);
          delete axios.defaults.headers.common['Authorization'];
        }
      } else {
        setIsAuthenticated(false);
        setToken(null);
        delete axios.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setIsAuthenticated(false);
      setToken(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  }, [verifyToken, pathname, router]);

  const login = useCallback(
    async (newToken: string) => {
      try {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        const isValid = await verifyToken(newToken);

        if (isValid) {
          setIsAuthenticated(true);
          router.push('/dashboard');
        } else {
          localStorage.removeItem('token');
          setToken(null);
          delete axios.defaults.headers.common['Authorization'];
          throw new Error('Invalid token');
        }
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    [verifyToken, router],
  );

  const fetchBalance = useCallback(async () => {
    if (!token || !isAuthenticated) {
      return;
    }

    try {
      setBalanceLoading(true);

      const backendUrl = getBackendUrl();
      const response = await axios.get(`${backendUrl}/api/v1/balance`, {
        timeout: 35000, // Increased timeout to 35 seconds to accommodate backend timeout
        headers: {
          ...backendRequestHeaders,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.data?.status === 'success') {
        setBalance(response.data.data.message);
      } else if (response.data?.status === 'success') {
        setBalance(response.data.message);
      } else {
        console.warn('Balance is unavailable:', response.data?.message);
        setBalance(null);
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        console.warn('Balance is unavailable:', message);
        setBalance(null);
      } else {
        console.warn('Balance is unavailable:', error);
        setBalance(null);
      }
    } finally {
      setBalanceLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const interval = setInterval(
      () => {
        verifyToken().then((isValid) => {
          if (!isValid) {
            logout();
          }
        });
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [token, isAuthenticated, verifyToken, logout]);

  // Fetch balance when user is authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]); // fetchBalance is stable and depends on token/isAuthenticated

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        user,
        login,
        logout,
        verifyToken,
        loading,
        balance,
        balanceLoading,
        fetchBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
