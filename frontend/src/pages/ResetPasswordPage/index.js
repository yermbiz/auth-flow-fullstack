/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, TextField, Button, Typography, Alert, CircularProgress, Toolbar, AppBar } from '@mui/material';
import validatePasswordComplexity from '../../utils/validatePasswordComplexity';
import { useTheme } from '@mui/material/styles';


const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('loading'); // 'loading', 'valid', 'error'
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const theme = useTheme();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setStatus('error');
      setMessage('Invalid or missing token.');
      return;
    }

    const validateToken = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/validate-reset-token`, { token: tokenFromUrl });
        setToken(tokenFromUrl);
        setStatus('valid');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Invalid or expired token.');
      }
    };

    validateToken();
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      setError('Both password fields are required.');
      return;
    }
    if (!validatePasswordComplexity(formData.password)) {
      setError(
        process.env.REACT_APP_PASSWORD_COMPLEXITY === 'complex'
          ? 'Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.'
          : 'Password must be at least 3 characters long.'
      );
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/reset-password`, {
        token,
        password: formData.password,
      });

      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login?message=Password reset successful. You can now log in.');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Content */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {status === 'loading' ? (
          <Box>
            <CircularProgress />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Validating token...
            </Typography>
          </Box>
        ) : status === 'error' ? (
          <Box sx={{ maxWidth: '500px', mx: 'auto', textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {message}
            </Alert>
            <Button variant="outlined" onClick={() => navigate('/login')} sx={{ mt: 2 }}>
              Go to Login
            </Button>
          </Box>
        ) : (
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{
              maxWidth: 400,
              mx: 'auto',
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" gutterBottom>
              Reset Your Password
            </Typography>
            {message && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              fullWidth
              margin="normal"
              label="New Password"
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
            <TextField
              fullWidth
              margin="normal"
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
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
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              sx={{ fontSize: '1rem', padding: '10px', mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ResetPasswordPage;
