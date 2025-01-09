import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

const AuthContext = createContext();

// eslint-disable-next-line react/prop-types
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      try {
        if (token) {
          const response = await axiosClient.get('/auth/me');
          setUser(response.data); // Set user if token is valid
        } else {
          setUser(null); // Ensure user is null if no token
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      } finally {
        setIsInitialized(true); // Mark initialization as complete
      }
    };

    initializeAuth();
  }, []);
  

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      const { accessToken, refreshToken } = response.data;
  
      // Save tokens and set user
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      const { data } = await axiosClient.get('/auth/me');
      setUser(data);
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.message ||error.response?.data?.error || 'Login failed');
    }
  };  

  const autoLoginAfterRegisterGoogleAuth = async ({ accessToken, refreshToken }) => {
    try {
      // Save tokens
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      const { data } = await axiosClient.get('/auth/me');
      setUser(data);
    } catch (error) {
      console.error('Auto login after Google registration failed:', error);
      throw new Error('Failed to automatically log in after registration.');
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isInitialized, login, autoLoginAfterRegisterGoogleAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};