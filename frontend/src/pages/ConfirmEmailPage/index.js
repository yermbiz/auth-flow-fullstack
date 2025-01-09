/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, CircularProgress, Button, AppBar, Toolbar } from '@mui/material';
import { useTheme } from '@mui/material/styles';


const ConfirmEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

   const theme = useTheme();
  
  const confirmEmail = async () => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing token.');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/confirm-email`, {
        token,
      });

      if (response.status === 200) {
        setStatus('success');
        setMessage('Email confirmed successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to confirm email. Please try again.');
    }
  };

  useEffect(() => {
    confirmEmail();
  }, [searchParams]);

  const handleRetry = () => {
    setStatus('loading');
    setMessage('');
    confirmEmail();
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

      {/* Main Content */}
      <Box
        sx={{
          textAlign: 'center',
          mt: 4,
          maxWidth: '500px',
          mx: 'auto',
          padding: '20px',
          borderRadius: '10px',
          backgroundColor: '#1e1e1e',
        }}
      >
        {status === 'loading' && (
          <>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6">Confirming your email...</Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              {message}
            </Typography>
            <Typography variant="body2">You will be redirected to the login page shortly.</Typography>
          </>
        )}

        {status === 'error' && (
          <>
            <Typography variant="h6" color="error" sx={{ mb: 2 }}>
              {message}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              You can try the following options:
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button variant="contained" color="primary" onClick={handleRetry}>
                Retry Confirmation
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/register')}
              >
                Register Again
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ConfirmEmailPage;
