import { createTheme } from '@mui/material/styles';

const customTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff5722', // Vibrant orange for buttons and highlights
    },
    secondary: {
      main: '#00bcd4', // Cool teal for accents
    },
    background: {
      default: '#121212', // Dark background for the page
      paper: '#1e1e1e', // Slightly lighter background for cards
    },
    text: {
      primary: '#e0e0e0', // Soft white for main text
      secondary: '#bdbdbd', // Muted gray for secondary text
    },
  },
  typography: {
    fontFamily: `'Inter', 'Roboto', sans-serif`,
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#ffffff',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#ffffff',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      color: '#ffffff',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#bdbdbd',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#e0e0e0',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          color: '#e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#1e1e1e',
            borderRadius: '6px',
            '& fieldset': {
              borderColor: '#ff5722',
            },
            '&:hover fieldset': {
              borderColor: '#e64a19',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ff5722',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#bdbdbd',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#ff5722',
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: '#ff5722',
          fontSize: '0.85rem',
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          boxShadow: 'none',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          justifyContent: 'space-between',
          padding: '0',
          minHeight: '64px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          color: '#e0e0e0',
          borderRadius: '12px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          padding: '8px 16px',
        },
        contained: {
          backgroundColor: '#ff5722',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#e64a19',
          },
        },
        outlined: {
          borderColor: '#ff5722',
          color: '#ff5722',
          '&:hover': {
            borderColor: '#e64a19',
            backgroundColor: 'rgba(255, 87, 34, 0.1)',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#e0e0e0',
        },
        a: {
          color: '#ff5722',
          textDecoration: 'underline',
          '&:hover': {
            textDecoration: 'none',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#ff5722',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
  },
});

export default customTheme;
