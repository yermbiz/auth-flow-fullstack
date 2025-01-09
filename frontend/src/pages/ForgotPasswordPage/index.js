import React, { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, TextField, Button, Alert } from '@mui/material';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      // eslint-disable-next-line no-undef
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/request-password-reset`, {
        email,
      });

      if (response.status === 200) {
        setMessage(response?.data?.message || 'If the email exists, a password reset link has been sent.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send password reset request.');
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

      {/* Form Section */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Forgot Password
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Enter your email address to receive a password reset link.
        </Typography>
        <Box sx={{ maxWidth: '500px', mx: 'auto', textAlign: 'center' }}>
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ maxWidth: 400, mx: 'auto' }}
          >
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;
