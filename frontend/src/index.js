import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Your App component
import { AuthProvider } from './pages/contexts/AuthContext'; // AuthProvider
import { BrowserRouter as Router } from 'react-router-dom';

import './index.css'; // Any additional styles

// Set a dark background color on the body to match the theme
document.body.style.backgroundColor = '#121212'; // Ensure consistent dark background
document.body.style.color = '#ffffff'; // Default text color for fallback

// Find the root element in the DOM
const rootElement = document.getElementById('root');

// Create root using ReactDOM.createRoot
const root = ReactDOM.createRoot(rootElement);

// Render the application
root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
