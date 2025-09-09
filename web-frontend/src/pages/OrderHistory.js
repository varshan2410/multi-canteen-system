import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API_URL}/orders/my-orders`);
        setOrders(response.data || []);
      } catch (err) {
        setError('Failed to load orders');
        console.error('Orders fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'primary',
      ready: 'success',
      completed: 'success',
      cancelled: 'error'
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status) => {
    const textMap = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready: 'Ready for Pickup',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return textMap[status] || status;
  };

  if (loading) return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    </Container>
  );

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Order History</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            No orders found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You haven't placed any orders yet.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/dashboard')}>
            Start Ordering
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {orders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 2 }
                }}
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">
                        Order #{order.order_number}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.canteen_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip 
                        label={getStatusText(order.order_status)} 
                        color={getStatusColor(order.order_status)}
                        size="small"
                      />
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        ₹{order.total_amount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.item_count} items
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Payment: {order.payment_method === 'cash' ? 'Cash on Pickup' : 'Online'}
                    </Typography>
                    
                    <Button 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/orders/${order.id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default OrderHistory;