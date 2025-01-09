import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Container,
} from '@mui/material';
import { Security, DeveloperMode, VerifiedUser, Build } from '@mui/icons-material';
import axios from 'axios';

const LandingPage = () => {
  const theme = useTheme();
  const [policyVersions, setPolicyVersions] = useState({ terms: '', privacy: '' });

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
      }
    };

    fetchPolicyVersions();
  }, []);

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
            <Button color="inherit" sx={{ fontWeight: 500, mr: 2 }} href="/login">
              Login
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.text.primary,
                '&:hover': { backgroundColor: theme.palette.primary.dark },
              }}
              href="/register"
            >
              Sign Up
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container
        maxWidth="md"
        sx={{
          textAlign: 'center',
          py: 8,
          flexGrow: 1,
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            mb: 3,
          }}
        >
          Authentication Made Easy
        </Typography>
        <Typography
          variant="h6"
          sx={{
            mb: 4,
            color: theme.palette.text.secondary,
          }}
        >
          Full-stack authentication system built with React, Node.js, and PostgreSQL. Experience secure and scalable solutions with comprehensive testing and automation.
        </Typography>
        <Button
          variant="contained"
          href="/explore"
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.text.primary,
            fontSize: '1rem',
            fontWeight: 700,
            py: 1.5,
            px: 4,
            '&:hover': { backgroundColor: theme.palette.primary.dark },
          }}
        >
          Explore Features
        </Button>

      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={3}>
          {[
            {
              icon: <Security sx={{ color: theme.palette.primary.main, fontSize: '2rem', mr: 2 }} />,
              title: 'Secure Authentication',
              description:
                'OAuth2.0 with refresh tokens and classic username/password authentication ensures robust user security.',
            },
            {
              icon: <DeveloperMode sx={{ color: theme.palette.primary.main, fontSize: '2rem', mr: 2 }} />,
              title: 'Full-Stack Integration',
              description: 'A complete solution built with React, Material-UI, Node.js, Express, and PostgreSQL.',
            },
            {
              icon: <VerifiedUser sx={{ color: theme.palette.primary.main, fontSize: '2rem', mr: 2 }} />,
              title: 'Fully Tested',
              description:
                'Comprehensive testing with unit, integration, smoke, and end-to-end tests.',
            },
            {
              icon: <Build sx={{ color: theme.palette.primary.main, fontSize: '2rem', mr: 2 }} />,
              title: 'Environment-Specific Logging',
              description:
                'Configured Winston logger to handle development, testing, and production environments seamlessly.',
            },
          ].map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  boxShadow: theme.shadows[2],
                  color: theme.palette.text.primary,
                  height: '100%',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {feature.icon}
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2">{feature.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          textAlign: 'center',
          py: 4,
          borderTop: 1, // Material-UI shorthand for `1px solid` border
          borderColor: 'divider', // Use theme's `divider` for consistency
          backgroundColor: 'background.paper', // Leverage shorthand for theme properties
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary', // Leverage shorthand for theme text colors
            mb: 2, // Add spacing below text
          }}
        >
          © 2025 AuthEase. All rights reserved.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <a 
           href={`/policies/terms-${policyVersions.terms?.version || 'default'}`}
                   
          style={{ color: '#0a84ff', textDecoration: 'none' }}>
            Terms of Use
          </a>
          <a 
           href={`/policies/privacy-${policyVersions.privacy?.version}`}
                   
          style={{ color: '#0a84ff', textDecoration: 'none' }}>
            Privacy Policy
          </a>
        </Box>
      </Box>

    </Box>
  );
};

export default LandingPage;
