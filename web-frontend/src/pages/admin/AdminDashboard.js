import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ArrowBack, 
  Refresh, 
  RestaurantMenu, 
  ShoppingCart, 
  AttachMoney, 
  Schedule,
  TrendingUp,
  People
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [orders, setOrders] = useState([]);
  const [canteen, setCanteen] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    activeOrders: 0,
    todayOrders: 0,
    totalMenuItems: 0
  });

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch canteen info
      const canteenResponse = await axios.get(`${API_URL}/admin/my-canteen`);
      setCanteen(canteenResponse.data);
      
      // Fetch orders for this canteen
      const params = new URLSearchParams();
      params.append('canteenId', canteenResponse.data.id);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const ordersResponse = await axios.get(`${API_URL}/admin/orders?${params}`);
      const ordersData = ordersResponse.data || [];
      setOrders(ordersData);
      
      // Fetch menu items
      const menuResponse = await axios.get(`${API_URL}/admin/menu-items`);
      setMenuItems(menuResponse.data || []);
      
      // Calculate analytics
      const today = new Date().toDateString();
      const todayOrders = ordersData.filter(order => 
        new Date(order.created_at).toDateString() === today
      );
      
      const activeOrders = ordersData.filter(order => 
        ['pending', 'confirmed', 'preparing'].includes(order.order_status)
      );
      
      const totalRevenue = ordersData.reduce((sum, order) => 
        sum + parseFloat(order.total_amount || 0), 0
      );
      
      setAnalytics({
        totalOrders: ordersData.length,
        totalRevenue: totalRevenue,
        avgOrderValue: ordersData.length > 0 ? totalRevenue / ordersData.length : 0,
        activeOrders: activeOrders.length,
        todayOrders: todayOrders.length,
        totalMenuItems: menuResponse.data?.length || 0
      });
      
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  // Real-time order updates
  useEffect(() => {
    if (socket) {
      const handleNewOrder = (data) => {
        console.log('New order received:', data);
        fetchData(); // Refresh data when new order comes in
      };

      socket.on('new_order', handleNewOrder);
      return () => socket.off('new_order', handleNewOrder);
    }
  }, [socket]);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_URL}/admin/orders/${orderId}/status`, {
        status: newStatus
      });
      
      fetchData(); // Refresh data after update
      
    } catch (err) {
      alert('Failed to update order status: ' + (err.response?.data?.error || err.message));
      console.error('Status update error:', err);
    }
  };

  // Toggle canteen hold status
  const toggleCanteenHold = async () => {
    try {
      await axios.put(`${API_URL}/admin/canteens/${canteen.id}/hold`, {
        isOnHold: !canteen.is_on_hold
      });
      
      fetchData(); // Refresh data
      
    } catch (err) {
      alert('Failed to update canteen status');
      console.error('Canteen update error:', err);
    }
  };

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

  // Generate chart data
  const getHourlyData = () => {
    const hourlyCount = {};
    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
    });
    
    return Array.from({length: 24}, (_, i) => ({
      hour: i,
      orders: hourlyCount[i] || 0
    })).filter(item => item.orders > 0);
  };

  const getStatusData = () => {
    const statusCount = {};
    orders.forEach(order => {
      statusCount[order.order_status] = (statusCount[order.order_status] || 0) + 1;
    });
    
    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  };

  const COLORS = ['#2196f3', '#ff9800', '#4caf50', '#f44336', '#9c27b0'];

  if (loading) return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    </Container>
  );

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4">
              Admin Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {canteen?.name} - {user?.first_name} {user?.last_name}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<RestaurantMenu />}
            onClick={() => navigate('/admin/menu')}
          >
            Manage Menu
          </Button>
          <IconButton onClick={fetchData}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Canteen Status */}
      {canteen && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">Canteen Status</Typography>
                <Typography variant="body2" color="text.secondary">
                  {canteen.location} • Contact: {canteen.contact_phone || 'Not provided'}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={!canteen.is_on_hold}
                    onChange={toggleCanteenHold}
                    color="primary"
                  />
                }
                label={canteen.is_on_hold ? "On Hold" : "Accepting Orders"}
              />
            </Box>
            {canteen.is_on_hold && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Your canteen is currently on hold and not accepting new orders.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analytics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShoppingCart sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Today</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {analytics.todayOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Orders today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Total</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {analytics.totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Revenue</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                ₹{analytics.totalRevenue.toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Active</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {analytics.activeOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <RestaurantMenu sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Menu</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {analytics.totalMenuItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Items available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Average</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                ₹{analytics.avgOrderValue.toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Order value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hourly Orders Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getHourlyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#2196f3" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getStatusData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Orders Management */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Orders Management ({orders.length})
            </Typography>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Filter Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Filter Status"
              >
                <MenuItem value="all">All Orders</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="preparing">Preparing</MenuItem>
                <MenuItem value="ready">Ready</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {order.order_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.first_name} {order.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.item_count} items
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.payment_method === 'cash' ? 'Cash' : 'Online'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" color="primary">
                        ₹{order.total_amount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.order_status}
                        color={getStatusColor(order.order_status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={order.order_status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          disabled={order.order_status === 'completed' || order.order_status === 'cancelled'}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="confirmed">Confirmed</MenuItem>
                          <MenuItem value="preparing">Preparing</MenuItem>
                          <MenuItem value="ready">Ready</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {orders.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No orders found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Orders will appear here when customers place them
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default AdminDashboard;