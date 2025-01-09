import React from 'react';
import PropTypes from 'prop-types';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Box } from '@mui/material';
import axios from 'axios';

const GoogleAuth = ({ onContinueRegistration, onLoginSuccess, onLoginError }) => {
  const handleGoogleSuccess = async (response) => {
    try {
      const googleToken = response.credential;
      // eslint-disable-next-line no-undef
      const result = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/google-login`, { googleToken });
      if (result.data.accessToken && result.data.refreshToken) {
        // User exists, no new registration needed, the user will be logged in automatically
        onLoginSuccess(result.data);
      } else if (result.data.email) {
        onContinueRegistration(result.data, googleToken);
      } else {
        onLoginError('Google authentication failed.');
      }
    } catch (error) {
      console.error('Google login error', error);
      onLoginError('An error occurred during Google login.');
    }
  };

  const handleGoogleFailure = () => {
    onLoginError('Google login was unsuccessful. Please try again.');
  };

  return (
    // eslint-disable-next-line no-undef
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <GoogleLogin
          size="large"
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleFailure}
          width="300px"
          theme="filled_blue"
          locale="en"
          text="continue_with"
        />
      </Box>
    </GoogleOAuthProvider>
  );
};

GoogleAuth.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
  onLoginError: PropTypes.func.isRequired,
  onContinueRegistration: PropTypes.func.isRequired,
};

export default GoogleAuth;
