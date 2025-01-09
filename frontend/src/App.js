import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import darkTheme from './theme'; 
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
// import PrivacyPage from './pages/PrivacyPage';
// import TermsPage from './pages/TermsPage';
import PolicyPage from './pages/PolicyPage';
import ExploreFeaturesPage from './pages/ExploreFeaturesPage';
import NotFoundPage from './pages/NotFoundPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ConfirmEmailPage from './pages/ConfirmEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import { useAuth } from './pages/contexts/AuthContext';

const App = () => {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route path="/policies/*" element={<PolicyPage />} />
        
          {/* <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} /> */}
          <Route path="/explore" element={<ExploreFeaturesPage />} />
          <Route path="/confirm-email" element={<ConfirmEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          

          {/* Protected Route */}
          <Route
            path="/dashboard"
            element={user ? <DashboardPage /> : <Navigate to="/login" replace />}
          />

          {/* Catch-All Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
   
    </ThemeProvider>
  );
};

export default App;
