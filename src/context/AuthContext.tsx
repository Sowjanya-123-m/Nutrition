import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nutri_token');
    localStorage.removeItem('nutri_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    // Sync with localStorage on component mount
    const savedToken = localStorage.getItem('nutri_token');
    const savedUser = localStorage.getItem('nutri_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch (e) {
        console.error('Error parsing saved auth state', e);
        localStorage.removeItem('nutri_token');
        localStorage.removeItem('nutri_user');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    // Axios global interceptor to automatically logout on 401 response (except for login endpoints)
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const isLoginEndpoint = error.config?.url?.includes('/api/users/login');
        if (error.response?.status === 401 && !isLoginEndpoint) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('nutri_token', newToken);
    localStorage.setItem('nutri_user', JSON.stringify(newUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const updateUserInContext = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('nutri_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUserInContext, isLoading }}>
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
