import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const SimpleDashboard = () => {
  console.log('SimpleDashboard rendering...');
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard Test
        </Typography>
        <Typography variant="body1">
          If you can see this, the Dashboard component is working!
        </Typography>
      </Box>
    </Container>
  );
};

export default SimpleDashboard;
