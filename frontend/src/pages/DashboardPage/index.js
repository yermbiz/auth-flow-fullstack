// src/pages/DashboardPage.jsx
import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  console.log('Dashboard Page');
  
  const { user, logout } = useAuth();

  return (
    <Box sx={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.nickname}
      </Typography>
      <Button variant="contained" color="primary" onClick={logout}>
        Logout
      </Button>
    </Box>
  );
};

export default DashboardPage;
