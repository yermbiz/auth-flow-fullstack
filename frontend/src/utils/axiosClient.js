import axios from 'axios';

// eslint-disable-next-line no-undef
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const axiosClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to set the Authorization header
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Get access token from localStorage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`; // Add token to Authorization header
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors, including token refresh logic
axiosClient.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is a 401 (Unauthorized) and retry is not yet attempted
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark the request as retried
      const refreshToken = localStorage.getItem('refresh_token');

      try {
        if (!refreshToken) throw new Error('No refresh token found.');

        // Send a request to refresh the token
        const { data } = await axios.post(`${API_URL}/api/auth/refresh-token`, {
          refreshToken,
        });

        // Save the new tokens
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);

        // Update the original request with the new token and retry it
        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);

        // Handle logout if token refresh fails
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    // For other errors, reject the response
    return Promise.reject(error);
  }
);

export default axiosClient;
