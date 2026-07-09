import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setUnauthorizedHandler } from '../api/client';
import { authApi } from '../api/services';

const AuthContext = createContext(null);
const tokenKey = 'lvm_seller_token';
const userKey = 'lvm_seller_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));

    const restoreSession = async () => {
      const storedUser = await AsyncStorage.getItem(userKey);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      try {
        const token = await AsyncStorage.getItem(tokenKey);
        if (token) {
          const { data } = await authApi.me();
          setUser(data);
          await AsyncStorage.setItem(userKey, JSON.stringify(data));
        }
      } catch {
        await AsyncStorage.multiRemove([tokenKey, userKey]);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    return () => setUnauthorizedHandler(null);
  }, []);

  const persistSession = async ({ token, user: nextUser }) => {
    await AsyncStorage.setItem(tokenKey, token);
    await AsyncStorage.setItem(userKey, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = async (payload) => {
    const { data } = await authApi.login(payload);
    if (data.user.role !== 'seller') {
      throw new Error('Please use a seller account.');
    }
    await persistSession(data);
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    await persistSession(data);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([tokenKey, userKey]);
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout, isAuthenticated: Boolean(user) }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
