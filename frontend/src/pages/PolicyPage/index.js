/* eslint-disable no-undef */
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Divider, Button } from '@mui/material';

// Function to parse raw policy text into a structured format
const parsePolicyContent = (rawText) => {
  const sections = [];
  const sectionRegex = /^(\d+)\.\s(.+)$/; // Matches "1. Terms of Use"
  const subsectionRegex = /^(\d+\.\d+)\s(.+)$/; // Matches "1.1 Effective Date"

  let currentSection = null;
  let currentSubsection = null;

  rawText.split('\n').forEach((line) => {
    line = line.trim();
    if (!line) return; // Skip empty lines

    const sectionMatch = sectionRegex.exec(line);
    const subsectionMatch = subsectionRegex.exec(line);

    if (sectionMatch) {
      // If a new section starts, save the previous one and start a new section
      if (currentSection) sections.push(currentSection);
      currentSection = { title: sectionMatch[2], subsections: [] };
      currentSubsection = null;
    } else if (subsectionMatch) {
      // If a new subsection starts, save the previous subsection and start a new one
      if (currentSubsection) currentSection.subsections.push(currentSubsection);
      currentSubsection = { title: subsectionMatch[2], content: '' };
    } else if (currentSubsection) {
      // Append content to the current subsection
      currentSubsection.content += `${line}\n`;
    }
  });

  // Push the last subsection and section
  if (currentSubsection) currentSection.subsections.push(currentSubsection);
  if (currentSection) sections.push(currentSection);

  return sections;
};


const PolicyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [policyContent, setPolicyContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Extract type and version from the URL path
  const policyInfo = useMemo(() => {
    const match = location.pathname.match(/^\/policies\/([a-zA-Z]+)-([\d.]+)$/);
    return match ? { type: match[1], version: match[2] } : null;
  }, [location.pathname]);

  useEffect(() => {
    if (!policyInfo) {
      navigate('/not-found');
      return;
    }

    const fetchPolicy = async () => {
      try {
        setLoading(true);
        setError('');
        const { type, version } = policyInfo;

        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/policies/${type}/${version}`);
        if (!response.ok) {
          throw new Error('Policy not found');
        }
        const data = await response.json();
        setPolicyContent(parsePolicyContent(data.content));
      } catch (err) {
        setError('Failed to load policy content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [policyInfo, navigate]);

  return (
    <Box sx={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh', p: 4 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress color="primary" />
        </Box>
      ) : error ? (
        <Typography variant="h6" sx={{ mt: 4, textAlign: 'center', color: '#f44336' }}>
          {error}
        </Typography>
      ) : (
        <>
          {policyContent.map((section, sectionIndex) => (
            <Box key={sectionIndex} sx={{ mb: 4 }}>
              {/* Section Title */}
              <Typography variant="h4" sx={{ mb: 2 }}>
                {section.title}
              </Typography>
              <Divider sx={{ mb: 2 }} />
  
              {/* Subsections */}
              {section.subsections.map((subsection, subsectionIndex) => (
                <Box key={subsectionIndex} sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {subsection.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>
                    {subsection.content.trim()}
                  </Typography>
                </Box>
              ))}
            </Box>
          ))}
        </>
      )}
  
      {/* Navigation Buttons */}
      {!loading && (
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/')} // Navigates to the home page
          >
            Go to Home Page
          </Button>
        </Box>
      )}
    </Box>
  );
  
};

export default PolicyPage;
