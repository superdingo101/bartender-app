import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/api';

const AuthContext = createContext(null);

const AUTH_EXPIRY_HOURS = 12;

// Named export for AuthProvider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage with expiry
    const storedUser = localStorage.getItem('bartender_user');
    const storedToken = localStorage.getItem('bartender_token');
    const storedExpiry = localStorage.getItem('bartender_auth_expiry');
    
    if (storedUser && storedToken && storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10);
      const currentTime = new Date().getTime();
      
      if (currentTime < expiryTime) {
        // Auth is still valid
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch (error) {
          console.error('Failed to restore session:', error);
          clearAuthStorage();
        }
      } else {
        // Auth has expired
        clearAuthStorage();
      }
    }
    
    setLoading(false);
  }, []);

  const saveAuthToStorage = (user, token) => {
    const expiryTime = new Date().getTime() + (AUTH_EXPIRY_HOURS * 60 * 60 * 1000);
    localStorage.setItem('bartender_user', JSON.stringify(user));
    localStorage.setItem('bartender_token', token);
    localStorage.setItem('bartender_auth_expiry', expiryTime.toString());
  };

  const clearAuthStorage = () => {
    localStorage.removeItem('bartender_user');
    localStorage.removeItem('bartender_token');
    localStorage.removeItem('bartender_auth_expiry');
  };

  const login = async (email, password) => {
    try {
      const response = await apiLogin({ email, password });
      setUser(response.user);
      setToken(response.token);
      
      // Persist to localStorage with expiry
      saveAuthToStorage(response.user, response.token);
      
      return response;
    } catch (error) {
      // Throw a proper error message, not the error object
      throw new Error(error?.response?.data?.error || error?.message || 'Login failed');
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiRegister(userData);
      setUser(response.user);
      setToken(response.token);
      
      // Persist to localStorage with expiry
      saveAuthToStorage(response.user, response.token);
      
      return response;
    } catch (error) {
      throw new Error(error?.response?.data?.error || error?.message || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    clearAuthStorage();
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Named export for useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default export (for backward compatibility)
export default AuthContext;