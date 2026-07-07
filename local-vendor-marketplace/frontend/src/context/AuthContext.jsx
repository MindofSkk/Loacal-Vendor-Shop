import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('lvm_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('lvm_token')));

  useEffect(() => {
    const token = localStorage.getItem('lvm_token');

    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem('lvm_user', JSON.stringify(data));
      })
      .catch(() => {
        localStorage.removeItem('lvm_token');
        localStorage.removeItem('lvm_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persistSession = ({ user: nextUser, token }) => {
    localStorage.setItem('lvm_token', token);
    localStorage.setItem('lvm_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = async (payload) => {
    const { data } = await authApi.login(payload);
    persistSession(data);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    persistSession(data);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('lvm_token');
    localStorage.removeItem('lvm_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
