import React from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, Container, TextField, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { register: registerField, handleSubmit } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Typography variant="h5" gutterBottom>Login</Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth margin="normal" label="Email" {...registerField('email')} />
          <TextField fullWidth margin="normal" label="Password" type="password" {...registerField('password')} />
          <Button type="submit" variant="contained">Login</Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;


