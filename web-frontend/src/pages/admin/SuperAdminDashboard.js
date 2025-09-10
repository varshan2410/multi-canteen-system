import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Switch,
  FormControlLabel
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
  Restaurant, 
  People, 
  ShoppingCart, 
  AttachMoney,
  TrendingUp,
  Assessment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [analytics, setAnalytics] = useState({
    overview: {
      total_students: 0,
      total_canteens: 0,
      total_orders: 0,
      total_revenue: 0
    },
    topCanteens: [],
    monthlyRevenue: [],
    orderTrends: [],
    canteenPerformance: []
  });
  
  const [canteens, setCanteens] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  const COLORS = ['#2196f3', '#ff9800', '#4caf50', '#f44336', '#9c27b0'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all basic data
      const [canteensResponse, ordersResponse, usersResponse] = await Promise.all([
        axios.get(`${API_URL}/canteens`),
        axios.get(`${API_URL}/admin/orders`),
        // We'll simulate users data since we don't have a users endpoint
        Promise.resolve({ data: [] })
      ]);
      
      const canteensData = canteensResponse.data || [];
      const ordersData = ordersResponse.data || [];
      
      setCanteens(canteensData);
      setOrders(ordersData);

      // Calculate analytics
      const totalRevenue = ordersData.reduce((sum, order) => 
        sum + parseFloat(order.total_amount || 0), 0
      );

      // Calculate canteen performance
      const canteenStats = canteensData.map(canteen => {
        const canteenOrders = ordersData.filter(order => 
          parseInt(order.canteen_id) === canteen.id
        );
        const revenue = canteenOrders.reduce((sum, order) => 
          sum + parseFloat(order.total_amount || 0), 0
        );
        
        return {
          id: canteen.id,
          name: canteen.name,
          location: canteen.location,
          total_orders: canteenOrders.length,
          revenue: revenue,
          avg_order_value: canteenOrders.length > 0 ? revenue / canteenOrders.length : 0,
          is_active: canteen.is_active,
          is_on_hold: canteen.is_on_hold
        };
      });

      // Generate monthly revenue (mock data based on existing orders)
      const monthlyData = Array.from({length: 6}, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return {
          month: date.toISOString(),
          revenue: Math.floor(Math.random() * 15000) + 5000,
          order_count: Math.floor(Math.random() * 300) + 100
        };
      });

      // Generate order trends (last 7 days)
      const orderTrends = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayOrders = ordersData.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.toDateString() === date.toDateString();
        });
        
        return {
          date: date.toISOString(),
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
        };
      });

      setAnalytics({
        overview: {
          total_students: 156, // Mock data
          total_canteens: canteensData.length,
          total_orders: ordersData.length,
          total_revenue: totalRevenue
        },
        topCanteens: canteenStats.sort((a, b) => b.revenue - a.revenue),
        monthlyRevenue: monthlyData,
        orderTrends: orderTrends,
        canteenPerformance: canteenStats
      });
      
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCanteenStatus = async (canteenId, currentStatus) => {
    try {
      await axios.put(`${API_URL}/admin/canteens/${canteenId}/hold`, {
        isOnHold: !currentStatus
      });
      fetchAnalytics(); // Refresh data
    } catch (err) {
      alert('Failed to update canteen status');
      console.error('Status update error:', err);
    }
  };

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
              Super Admin Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              System Overview - {user?.first_name} {user?.last_name}
            </Typography>
          </Box>
        </Box>
        
        <IconButton onClick={fetchAnalytics}>
          <Refresh />
        </IconButton>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Students</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {analytics.overview.total_students}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registered users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Restaurant sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Canteens</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {analytics.overview.total_canteens}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active canteens
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShoppingCart sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Orders</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {analytics.overview.total_orders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total orders placed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Revenue</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                ₹{analytics.overview.total_revenue.toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total system revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Analytics Overview" />
          <Tab label="Canteen Management" />
          <Tab label="Revenue Trends" />
          <Tab label="System Reports" />
          </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Top Performing Canteens */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Performing Canteens
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.topCanteens.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                    <Bar dataKey="revenue" fill="#2196f3" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Revenue Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.topCanteens.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {analytics.topCanteens.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Weekly Order Trends */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Weekly Order Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.orderTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      formatter={(value, name) => [
                        name === 'orders' ? value : `₹${value.toFixed(2)}`,
                        name === 'orders' ? 'Orders' : 'Revenue'
                      ]}
                    />
                    <Line type="monotone" dataKey="orders" stroke="#2196f3" strokeWidth={2} name="orders" />
                    <Line type="monotone" dataKey="revenue" stroke="#ff9800" strokeWidth={2} name="revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {/* Canteen Management */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Canteen Management
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Canteen Name</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell align="right">Total Orders</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Avg Order Value</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.canteenPerformance.map((canteen) => (
                        <TableRow key={canteen.id}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {canteen.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{canteen.location}</TableCell>
                          <TableCell align="right">{canteen.total_orders}</TableCell>
                          <TableCell align="right">₹{canteen.revenue.toFixed(2)}</TableCell>
                          <TableCell align="right">₹{canteen.avg_order_value.toFixed(2)}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Chip 
                                label={canteen.is_active ? "Active" : "Inactive"} 
                                color={canteen.is_active ? "success" : "default"}
                                size="small"
                              />
                              {canteen.is_on_hold && (
                                <Chip 
                                  label="On Hold" 
                                  color="warning"
                                  size="small"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={!canteen.is_on_hold}
                                  onChange={() => toggleCanteenStatus(canteen.id, canteen.is_on_hold)}
                                  color="primary"
                                  size="small"
                                />
                              }
                              label={canteen.is_on_hold ? "Resume" : "Hold"}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<Restaurant />}
                    onClick={() => {
                      // Add functionality to create new canteen
                      alert('Create New Canteen functionality can be added here');
                    }}
                  >
                    Add New Canteen
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<People />}
                    onClick={() => {
                      // Add functionality to manage users
                      alert('User Management functionality can be added here');
                    }}
                  >
                    Manage Users
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<Assessment />}
                    onClick={() => {
                      // Add functionality to generate reports
                      alert('Generate Reports functionality can be added here');
                    }}
                  >
                    Generate Reports
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          {/* Monthly Revenue Trend */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Revenue Trend (Last 6 Months)
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analytics.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      formatter={(value, name) => [
                        name === 'order_count' ? value : `₹${value.toFixed(2)}`,
                        name === 'order_count' ? 'Orders' : 'Revenue'
                      ]}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#2196f3" strokeWidth={3} name="revenue" />
                    <Line type="monotone" dataKey="order_count" stroke="#ff9800" strokeWidth={2} name="order_count" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Revenue Breakdown */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue Breakdown by Canteen
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Canteen</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">% Share</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.topCanteens.map((canteen) => (
                        <TableRow key={canteen.id}>
                          <TableCell>{canteen.name}</TableCell>
                          <TableCell align="right">₹{canteen.revenue.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            {analytics.overview.total_revenue > 0 
                              ? ((canteen.revenue / analytics.overview.total_revenue) * 100).toFixed(1)
                              : 0
                            }%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Average Order Value:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ₹{analytics.overview.total_orders > 0 
                        ? (analytics.overview.total_revenue / analytics.overview.total_orders).toFixed(2)
                        : '0.00'
                      }
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Orders per Canteen:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {analytics.overview.total_canteens > 0 
                        ? Math.round(analytics.overview.total_orders / analytics.overview.total_canteens)
                        : 0
                      }
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Revenue per Student:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ₹{analytics.overview.total_students > 0 
                        ? (analytics.overview.total_revenue / analytics.overview.total_students).toFixed(2)
                        : '0.00'
                      }
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Active Canteens:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {analytics.canteenPerformance.filter(c => c.is_active && !c.is_on_hold).length} / {analytics.overview.total_canteens}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          {/* System Reports */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Reports & Analytics
                </Typography>
                
                {/* Recent Orders Summary */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Recent Orders Summary
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Order #</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Canteen</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orders.slice(0, 10).map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.order_number}</TableCell>
                            <TableCell>{order.first_name} {order.last_name}</TableCell>
                            <TableCell>{order.canteen_name}</TableCell>
                            <TableCell align="right">₹{order.total_amount}</TableCell>
                            <TableCell>
                              <Chip 
                                label={order.order_status} 
                                size="small" 
                                color={order.order_status === 'completed' ? 'success' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(order.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Export Options */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Export Data
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button 
                      variant="outlined" 
                      onClick={() => {
                        // Add CSV export functionality
                        alert('CSV Export functionality can be added here');
                      }}
                    >
                      Export to CSV
                    </Button>
                    <Button 
                      variant="outlined"
                      onClick={() => {
                        // Add PDF export functionality
                        alert('PDF Export functionality can be added here');
                      }}
                    >
                      Generate PDF Report
                    </Button>
                    <Button 
                      variant="outlined"
                      onClick={() => {
                        // Add email report functionality
                        alert('Email Report functionality can be added here');
                      }}
                    >
                      Email Report
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default SuperAdminDashboard;