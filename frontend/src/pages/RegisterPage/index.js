/* eslint-disable no-undef */
import React, { useState, useEffect, useMemo } from 'react';
import { Box, AppBar, Toolbar, Typography, TextField, Button, Checkbox, Alert, Link } from '@mui/material';
import GoogleAuth from '../common/auth/GoogleAuth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import validatePasswordComplexity from '../../utils/validatePasswordComplexity';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const RegisterPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { googleTokenState, email } = location.state || {};

  const { autoLoginAfterRegisterGoogleAuth } = useAuth();

  const [googleToken, setGoogleToken] = useState(googleTokenState || null);
  const [emailExists, setEmailExists] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState(null);
  const [nicknameErrorMessage, setNicknameErrorMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [policyVersions, setPolicyVersions] = useState({ terms: '', privacy: '' });

  const [formData, setFormData] = useState({
    email: email || '',
    password: '',
    confirmPassword: '',
    nickname: '',
    termsAccepted: false,
    privacyAccepted: false,
  });

  const nicknameRegex = useMemo(() => /^[a-zA-Z0-9_-]{3,15}$/, []);

  useEffect(() => {
    const fetchPolicyVersions = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/policies/latest`);
        const versions = response.data.reduce((acc, policy) => {
          acc[policy.type] = { version: policy.version, content_url: policy.content_url };
          return acc;
        }, {});
        setPolicyVersions(versions);
      } catch (error) {
        console.error('Error fetching policy versions:', error);
        setError('Failed to load policy versions');
      }
    };

    fetchPolicyVersions();
  }, []);

  const handleCheckEmail = async (email) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/check-user`, { email });
      setEmailExists(response.data.exists && response.data.user.email_confirmed);
    } catch (error) {
      console.error('Error checking email', error);
    }
  };

  const handleCheckNickname = async (nickname) => {
    try {
      if (!nicknameRegex.test(nickname)) {
        setNicknameStatus(false);
        setNicknameErrorMessage('Nickname should be 3-15 characters and contain only letters, numbers, underscores, or dashes.');
        return;
      }

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/check-nickname`, { nickname });
      setNicknameStatus(!response.data.exists);
    } catch (error) {
      console.error('Error checking nickname', error);
    }
  };

  useEffect(() => {
    if (formData.nickname) {
      const debounceTimeout = setTimeout(() => {
        handleCheckNickname(formData.nickname);
      }, 500);

      return () => clearTimeout(debounceTimeout);
    }
  }, [formData.nickname]);

  useEffect(() => {
    if (formData.email) {
      const debounceTimeout = setTimeout(() => {
        handleCheckEmail(formData.email);
      }, 500);

      return () => clearTimeout(debounceTimeout);
    }
  }, [formData.email]);

  const handleLogin = async ({ accessToken, refreshToken }) => {
    try {
      await autoLoginAfterRegisterGoogleAuth({ accessToken, refreshToken });
    } catch (error) {
      console.error('Auto-login failed:', error);
      setError('Auto-login failed. Please log in manually.');
    }
    navigate('/dashboard');
  }

  const handleContinueRegistration = (userInfo, token) => {
    setGoogleToken(token);
    setFormData({
      ...formData,
      email: userInfo.email,
    });
    const debounceTimeout = setTimeout(() => handleCheckEmail(userInfo.email), 500);
    return () => clearTimeout(debounceTimeout);

  };

  const handleGoogleError = (message) => {
    setError(message);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setNicknameErrorMessage('')
    setError('');
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: type === 'checkbox'
        ? checked
        : name === 'nickname'
          ? value.trim()
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedNickname = formData.nickname.trim();

    if (!trimmedNickname) {
      setError('Nickname cannot be empty or just spaces');
      return;
    }

    const nicknameRegex = /^[a-zA-Z0-9_-]{3,15}$/;
    if (!nicknameRegex.test(trimmedNickname)) {
      setError('Nickname should be 3-15 characters long and contain only letters, numbers, underscores, or dashes.');
      return;
    }
    if (nicknameStatus === false) {
      setError('This nickname is already taken.');
      return;
    }

    if (!formData.termsAccepted || !formData.privacyAccepted) {
      setError('You must agree to the Terms and Privacy Policy');
      return;
    }

    if (!googleToken) {
      if (!formData.password || formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
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
    }

    setError('');
    console.log('Registration form data:', formData);
    try {
      setLoading(true);
      setError('');

      const submissionData = googleToken
        ? { ...formData, password: undefined, confirmPassword: undefined, googleToken }
        : formData;

      // Show a loading indicator (optional)
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        ...submissionData,
        agreedPolicyVersions: policyVersions,
      });
      setLoading(false);

      // Handle successful registration
      if (response.status === 201 && response.data.userId) {
        if (googleToken) {
          const { accessToken, refreshToken } = response.data;
          await handleLogin({ accessToken, refreshToken })
          // Use the specialized method for auto-login
        } else {
          navigate(`/login?message=Registration successful! Please check your email to confirm your account.`);
        }

      }
    } catch (error) {
      setLoading(false);
      console.error('Error during registration:', error);

      // Handle errors (e.g., email already exists, server issues)
      if (error.response?.data?.error || error.response?.data?.message) {
        setError(error.response.data.error || error.response?.data?.message);
      } else {
        setError('Registration failed. Please try again later.');
      }
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
          Enter your details
        </Typography>
        <Box sx={{ maxWidth: '500px', mx: 'auto', textAlign: 'center' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Google Sign-Up */}
          <GoogleAuth
            onContinueRegistration={handleContinueRegistration}
            onLoginSuccess={handleLogin}
            onLoginError={handleGoogleError}
          />

          {googleToken ? (
            <Typography variant="body2" sx={{ my: 2 }}>
              You are registering with Google. Please complete the required fields below.
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ my: 2 }}>
              Or register with your email and password
            </Typography>
          )}

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
                readOnly: !!googleToken,
              }}
              InputLabelProps={{
                style: { color: '#aaa' },
              }}
              error={emailExists}
              helperText={
                emailExists
                  ? "User with this email already exists!"
                  : !googleToken
                    ? "An additional email confirmation will be required."
                    : ""
              }
            />

            {/* Nickname Field */}
            <TextField
              fullWidth
              margin="normal"
              label="Unique Nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              required
              sx={{ backgroundColor: '#1e1e1e', borderRadius: 1 }}
              InputProps={{
                style: { color: '#fff' },
              }}
              InputLabelProps={{
                style: { color: '#aaa' },
              }}
              error={nicknameStatus === false || nicknameErrorMessage}
              helperText={
                nicknameStatus === true ? (
                  <span style={{ color: '#4CAF50' }}>Nickname available</span> // Green for success
                ) : nicknameStatus === false ? (
                  <span style={{ color: '#E57373' }}>{nicknameErrorMessage}</span> // Red for error
                ) : (
                  ""
                )
              }
            />

            {/* Conditional Fields for Non-Google Auth */}
            {!googleToken && (
              <>
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
                  helperText={
                    process.env.REACT_APP_PASSWORD_COMPLEXITY === 'complex'
                      ? 'At least 8 characters, one uppercase, one number, and one special character'
                      : 'At least 3 characters'
                  }
                />

                <TextField
                  fullWidth
                  margin="normal"
                  label="Confirm Password"
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
              </>
            )}
            {/* Terms and Privacy Checkboxes */}
            <Box
              sx={{
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                maxWidth: 'fit-content',
                mx: 'auto',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Checkbox
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  sx={{
                    color: '#aaa',
                    p: 0,
                  }}
                />
                <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                  I agree to the{' '}
                  <Typography
                    component="a"
                    href={`/policies/terms-${policyVersions.terms?.version || 'default'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: 'secondary.main', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Terms and Conditions
                  </Typography>
                </Typography>
              </Box>


              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mt: 0,
                }}
              >
                <Checkbox
                  name="privacyAccepted"
                  checked={formData.privacyAccepted}
                  onChange={handleChange}
                  sx={{
                    color: '#aaa',
                    p: 0,
                  }}
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  I agree to the{' '}
                  <Typography
                    component="a"
                    href={`/policies/privacy-${policyVersions.privacy.version}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: 'secondary.main', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Privacy Policy
                  </Typography>
                </Typography>
              </Box>

            </Box>
            {/* Submit Button */}
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              sx={{ fontSize: '1rem', padding: '10px', mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </Box>

          {/* Navigation */}
          <Typography variant="body2" sx={{ mt: 3 }}>
            Already have an account? <Link href="/login" color='secondary.main'>Login</Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterPage;
