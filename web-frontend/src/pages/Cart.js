import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add, Remove, Delete, ArrowBack } from '@mui/icons-material';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Cart = () => {
  const { cartItems, selectedCanteen, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleQuantityChange = (itemId, change) => {
    const item = cartItems.find(i => i.id === itemId);
    updateQuantity(itemId, item.quantity + change);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');

    try {
      const orderData = {
        canteenId: selectedCanteen.id,
        items: cartItems.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          specialRequests: ''
        })),
        paymentMethod,
        specialInstructions
      };

      console.log('Placing order:', orderData);

      const response = await axios.post(`${API_URL}/orders`, orderData);
      
      alert(`Order placed successfully! Order #${response.data.order.order_number}`);
      clearCart();
      navigate('/orders');
      
    } catch (error) {
      console.error('Order error:', error);
      setError(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">Your Cart</Typography>
        </Box>
        
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h5" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Add some delicious items to get started!
          </Typography>
          <Button variant="contained" onClick={() => navigate('/dashboard')}>
            Browse Canteens
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Your Cart</Typography>
      </Box>
      
      {selectedCanteen && (
        <Typography variant="h6" color="primary" gutterBottom>
          {selectedCanteen.name}
        </Typography>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {cartItems.map((item) => (
            <Card key={item.id} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h6">{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ₹{item.price} each
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleQuantityChange(item.id, -1)}
                      >
                        <Remove />
                      </IconButton>
                      
                      <Typography sx={{ mx: 2, minWidth: '20px', textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      
                      <IconButton 
                        size="small" 
                        onClick={() => handleQuantityChange(item.id, 1)}
                      >
                        <Add />
                      </IconButton>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={2}>
                    <Typography variant="h6" align="center">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={1}>
                    <IconButton 
                      color="error"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Subtotal: ₹{getTotalPrice().toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Taxes and fees: ₹0.00
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Total: ₹{getTotalPrice().toFixed(2)}
              </Typography>

              <FormControl component="fieldset" sx={{ mt: 3, width: '100%' }}>
                <FormLabel component="legend">Payment Method</FormLabel>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <FormControlLabel value="cash" control={<Radio />} label="Cash on Pickup" />
                  <FormControlLabel value="online" control={<Radio />} label="Online Payment" />
                </RadioGroup>
              </FormControl>

              <TextField
                fullWidth
                label="Special Instructions"
                multiline
                rows={3}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                sx={{ mt: 2 }}
                placeholder="Any special requests or dietary requirements..."
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart;