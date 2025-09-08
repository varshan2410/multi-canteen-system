import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Menu,
  MenuItem
} from '@mui/material';
import {
  ShoppingCart,
  AccountCircle,
  Restaurant,
  Notifications
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Restaurant sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          Multi-Canteen System
        </Typography>

        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user.role === 'student' && (
              <IconButton color="inherit" onClick={() => navigate('/cart')}>
                <Badge badgeContent={getTotalItems()} color="secondary">
                  <ShoppingCart />
                </Badge>
              </IconButton>
            )}

            <IconButton color="inherit">
              <Badge badgeContent={0} color="secondary">
                <Notifications />
              </Badge>
            </IconButton>

            <IconButton color="inherit" onClick={handleMenuOpen}>
              <AccountCircle />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { navigate('/orders'); handleMenuClose(); }}>
                Order History
              </MenuItem>
              {(user.role === 'canteen_admin' || user.role === 'super_admin') && (
                <MenuItem onClick={() => { navigate('/admin'); handleMenuClose(); }}>
                  Admin Dashboard
                </MenuItem>
              )}
              {user.role === 'super_admin' && (
                <MenuItem onClick={() => { navigate('/super-admin'); handleMenuClose(); }}>
                  Super Admin
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
            
            <Typography variant="body2">
              {user.first_name} {user.last_name}
            </Typography>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button color="inherit" onClick={() => navigate('/register')}>
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;