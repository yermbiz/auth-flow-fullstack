/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, TextField, Button, Alert, Link } from '@mui/material';
import GoogleAuth from '../common/auth/GoogleAuth';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const LoginPage = () => {
  const { login, autoLoginAfterRegisterGoogleAuth } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  
  useEffect(() => {
    // Check if a message is passed in the query params
    const params = new URLSearchParams(location.search);
    const message = params.get('message');
    if (message) {
      setSuccessMessage(message);
    }
  }, [location]);
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form login submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueRegistration = async (googleUser, googleToken) => {
    try {
      // Redirect the user to the registration page with prefilled data
      navigate('/register', {
        state: {
          googleTokenState: googleToken,
          email: googleUser.email,
        },
      });
    } catch (err) {
      console.error('Error in handleContinueRegistration:', err);
      setError('Failed to proceed with registration. Please try again.');
    }
  };

  const handleGoogleError = (message) => {
    setError(message);
  };

  const handleLogin = async ({ accessToken, refreshToken }) => {
    // Use the specialized method for auto-login
    await autoLoginAfterRegisterGoogleAuth({ accessToken, refreshToken });
    navigate('/dashboard');
  }

  return (
     <Box
           sx={{
             backgroundColor: theme.palette.background.default,
             color: theme.palette.text.primary,
             minHeight: '100vh',
             display: 'flex',
             flexDirection: 'column',
           }}
         >
           {/* Header */}
           <AppBar
             position="static"
             sx={{
               backgroundColor: theme.palette.background.paper,
               boxShadow: theme.shadows[2],
             }}
           >
             <Toolbar sx={{ justifyContent: 'space-between', px: 4 }}>
               <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                 AuthEase
               </Typography>
               <Box>
                 <Button color="inherit" sx={{ fontWeight: 500, mr: 2 }} href="/">
                   Home
                 </Button>
     
               </Box>
             </Toolbar>
           </AppBar>


      {/* Form Section */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Log in to your account
        </Typography>
        <Box sx={{ maxWidth: '500px', mx: 'auto', textAlign: 'center' }}>
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Google Login */}
          <GoogleAuth
            onContinueRegistration={handleContinueRegistration}
            onLoginSuccess={handleLogin}
            onLoginError={handleGoogleError}
          />

          <Typography variant="body2" sx={{ my: 2 }}>
            Or log in with your email and password
          </Typography>

          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ maxWidth: 400, mx: 'auto' }}
          >
            {/* Email Field */}
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ backgroundColor: '#1e1e1e', borderRadius: 1 }}
              InputProps={{
                style: { color: '#fff' },
              }}
              InputLabelProps={{
                style: { color: '#aaa' },
              }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ backgroundColor: '#1e1e1e', borderRadius: 1 }}
              InputProps={{
                style: { color: '#fff' },
              }}
              InputLabelProps={{
                style: { color: '#aaa' },
              }}
            />

            {/* Submit Button */}
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              sx={{ fontSize: '1rem', padding: '10px', mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Box>

          {/* Navigation */}
          <Typography variant="body2" sx={{ mt: 3 }}>
            Don&apos;t have an account? <Link href="/register" color="secondary.main">Register</Link>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <Link component={RouterLink} to="/forgot-password" color="secondary.main">
              Forgot Password?
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
