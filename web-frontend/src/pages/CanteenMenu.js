import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Rating,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { Search, Add, Spa, ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CanteenMenu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [menu, setMenu] = useState([]);
  const [canteen, setCanteen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch canteen info
        const canteensResponse = await axios.get(`${API_URL}/canteens`);
        const canteenInfo = canteensResponse.data.find(c => c.id === parseInt(id));
        setCanteen(canteenInfo);

        // Fetch menu
        const menuResponse = await axios.get(`${API_URL}/canteens/${id}/menu`);
        setMenu(menuResponse.data || []);
        
      } catch (err) {
        setError('Failed to load menu');
        console.error('Menu fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleCategoryChange = (event, newValue) => {
    setSelectedCategory(newValue);
  };

  const filteredItems = menu[selectedCategory]?.items?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAddToCart = (item) => {
    if (canteen) {
      addToCart(item, canteen);
      // Show success message
      alert(`${item.name} added to cart!`);
    }
  };

  if (loading) return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    </Container>
  );

  if (error) return (
    <Container maxWidth="lg">
      <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
    </Container>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" gutterBottom>
            {canteen?.name}
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          {canteen?.description}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {menu.length > 0 && (
        <>
          <Tabs value={selectedCategory} onChange={handleCategoryChange} variant="scrollable" scrollButtons="auto">
            {menu.map((category, index) => (
              <Tab key={category.id} label={category.name} />
            ))}
          </Tabs>

          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              {filteredItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={item.image_url || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyDcH_MxdsTsK6KMVon-Ybfa2WiT-R70ZjWw&s'}
                      alt={item.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {item.name}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {item.description}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={parseFloat(item.avg_rating) || 0} precision={0.5} size="small" readOnly />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({item.review_count || 0})
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        {item.is_vegetarian && <Chip label="Veg" color="success" size="small" icon={<Spa />} />}
                        {item.is_vegan && <Chip label="Vegan" color="success" size="small" />}
                        <Chip label={`${item.preparation_time} min`} size="small" variant="outlined" />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary">
                          ₹{item.price}
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => handleAddToCart(item)}
                          disabled={!item.is_available}
                        >
                          {item.is_available ? 'Add to Cart' : 'Not Available'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </>
      )}

      {menu.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6">No menu items available</Typography>
        </Box>
      )}
    </Container>
  );
};

export default CanteenMenu;