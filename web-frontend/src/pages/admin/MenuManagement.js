import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import { Add, Edit, Delete, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MenuManagement = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [canteen, setCanteen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    price: '',
    categoryId: '',
    isVegetarian: false,
    isVegan: false,
    preparationTime: 15,
    isAvailable: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch canteen info
      const canteenResponse = await axios.get(`${API_URL}/admin/my-canteen`);
      setCanteen(canteenResponse.data);
      
      // Fetch categories
      const categoriesResponse = await axios.get(`${API_URL}/admin/menu-categories`);
      setCategories(categoriesResponse.data);
      
      // Fetch menu items
      const itemsResponse = await axios.get(`${API_URL}/admin/menu-items`);
      setMenuItems(itemsResponse.data);
      
    } catch (err) {
      setError('Failed to load menu data');
      console.error('Menu fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        // Update existing item
        await axios.put(`${API_URL}/admin/menu-items/${editingItem.id}`, formData);
      } else {
        // Create new item
        await axios.post(`${API_URL}/admin/menu-items`, formData);
      }
      
      fetchData();
      setDialogOpen(false);
      resetForm();
      
    } catch (err) {
      alert('Failed to save menu item');
      console.error('Save error:', err);
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${API_URL}/admin/menu-items/${itemId}`);
        fetchData();
      } catch (err) {
        alert('Failed to delete menu item');
        console.error('Delete error:', err);
      }
    }
  };

  const openDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        imageUrl: item.image_url || '',
        price: item.price,
        categoryId: item.category_id,
        isVegetarian: item.is_vegetarian,
        isVegan: item.is_vegan,
        preparationTime: item.preparation_time,
        isAvailable: item.is_available
      });
    } else {
      setEditingItem(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      price: '',
      categoryId: '',
      isVegetarian: false,
      isVegan: false,
      preparationTime: 15,
      isAvailable: true
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate('/admin')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          Menu Management - {canteen?.name}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openDialog()}
        >
          Add New Item
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Menu Items ({menuItems.length})
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Prep Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {menuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.category_name}</TableCell>
                    <TableCell>₹{item.price}</TableCell>
                    <TableCell>
                      {item.is_vegetarian && <Chip label="Veg" size="small" color="success" />}
                      {item.is_vegan && <Chip label="Vegan" size="small" color="success" />}
                    </TableCell>
                    <TableCell>{item.preparation_time} min</TableCell>
                    <TableCell>
                      <Chip 
                        label={item.is_available ? "Available" : "Unavailable"} 
                        color={item.is_available ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => openDialog(item)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(item.id)} color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Item Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            margin="normal"
            multiline
            rows={2}
          />
          
          <TextField
            fullWidth
            label="Price (₹)"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Image URL (optional)"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            helperText="Leave empty to auto-fill a food photo"
            margin="normal"
          />

          {formData.imageUrl && (
            <Box sx={{ mt: 2 }}>
              <img
                src={formData.imageUrl}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </Box>
          )}
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Preparation Time (minutes)"
            type="number"
            value={formData.preparationTime}
            onChange={(e) => setFormData({...formData, preparationTime: e.target.value})}
            margin="normal"
          />
          
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isVegetarian}
                  onChange={(e) => setFormData({...formData, isVegetarian: e.target.checked})}
                />
              }
              label="Vegetarian"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isVegan}
                  onChange={(e) => setFormData({...formData, isVegan: e.target.checked})}
                />
              }
              label="Vegan"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                />
              }
              label="Available"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingItem ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MenuManagement;
