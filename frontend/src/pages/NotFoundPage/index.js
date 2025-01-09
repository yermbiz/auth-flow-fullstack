import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';

const NotFoundPage = () => {
  return (
    <Box
      sx={{
        textAlign: 'center',
        minHeight: '100vh',
        backgroundColor: '#121212',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 3,
      }}
    >
      <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
        404
      </Typography>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Oops! The page you&apos;re looking for doesn&apos;t exist.
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        It seems you’ve taken a wrong turn. Don’t worry, it happens to the best of us!
      </Typography>
      <Button
        variant="contained"
        color="primary.main"
        component={Link}
        to="/"
        sx={{ textTransform: 'uppercase', fontSize: '1rem', px: 4, py: 2 }}
      >
        Go Home
      </Button>
    </Box>
  );
};

export default NotFoundPage;
