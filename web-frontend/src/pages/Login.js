import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // Quick login buttons for testing
  const quickLogin = async (userType) => {
    setLoading(true);
    setError('');
    
    const credentials = {
      admin: { email: 'admin@admin.com', password: 'password' },
      student: { email: 'student@test.com', password: 'password' },
      'north-canteen': { email: 'north-admin@admin.com', password: 'password' },
      'south-canteen': { email: 'south-admin@admin.com', password: 'password' },
      'fastfood': { email: 'fastfood-admin@admin.com', password: 'password' }
    };

    const result = await login(credentials[userType].email, credentials[userType].password);
    
    if (result.success) {
      // Redirect based on role
      if (result.user.role === 'super_admin') {
        navigate('/super-admin');
      } else if (result.user.role === 'canteen_admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Login
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {/* Quick Login Buttons for Testing */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" align="center" gutterBottom>
              Quick Login (for testing):
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  fullWidth
                  onClick={() => quickLogin('admin')}
                  disabled={loading}
                >
                  Super Admin
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  fullWidth
                  onClick={() => quickLogin('student')}
                  disabled={loading}
                >
                  Student
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  fullWidth
                  onClick={() => quickLogin('north-canteen')}
                  disabled={loading}
                >
                  North Canteen
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  fullWidth
                  onClick={() => quickLogin('south-canteen')}
                  disabled={loading}
                >
                  South Canteen
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  fullWidth
                  onClick={() => quickLogin('fastfood')}
                  disabled={loading}
                >
                  Fast Food
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
            
            <Typography align="center">
              Don't have an account? <Link to="/register">Register here</Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
