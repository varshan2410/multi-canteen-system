import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Restaurant, Schedule, LocationOn } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [canteens, setCanteens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        console.log('Fetching canteens from:', `${API_URL}/canteens`);
        setIsLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_URL}/canteens`);
        console.log('API Response:', response.data);
        setCanteens(response.data || []);
      } catch (err) {
        console.error('API Error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCanteens();
  }, []);

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    console.error('Dashboard error:', error);
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography color="error">
            Error loading canteens: {error}
          </Typography>
        </Box>
      </Container>
    );
  }

  console.log('Dashboard render - canteens:', canteens, 'isLoading:', isLoading, 'error:', error);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Available Canteens
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Choose from our variety of canteens
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {canteens && canteens.length > 0 ? (
          canteens.map((canteen) => (
          <Grid item xs={12} sm={6} md={4} key={canteen.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                },
                transition: 'all 0.2s ease-in-out'
              }}
              onClick={() => navigate(`/canteen/${canteen.id}`)}
            >
              <CardMedia
                component="img"
                height="200"
                image={canteen.image_url || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyDcH_MxdsTsK6KMVon-Ybfa2WiT-R70ZjWw&s'}
                alt={canteen.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Restaurant sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" component="h2">
                    {canteen.name}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {canteen.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {canteen.location}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Schedule sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Open 9:00 AM - 8:00 PM
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={canteen.is_on_hold ? "On Hold" : "Open"} 
                    color={canteen.is_on_hold ? "error" : "success"}
                    size="small"
                  />
                  <Button 
                    variant="contained" 
                    size="small"
                    disabled={canteen.is_on_hold}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/canteen/${canteen.id}`);
                    }}
                  >
                    View Menu
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography variant="h6" color="text.secondary" align="center">
              No canteens available
            </Typography>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;