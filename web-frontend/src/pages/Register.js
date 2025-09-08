import React from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, Container, TextField, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const { register: registerField, handleSubmit } = useForm();
  const { register: doRegister } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    const result = await doRegister({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Typography variant="h5" gutterBottom>Register</Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth margin="normal" label="First Name" {...registerField('firstName')} />
          <TextField fullWidth margin="normal" label="Last Name" {...registerField('lastName')} />
          <TextField fullWidth margin="normal" label="Phone" {...registerField('phone')} />
          <TextField fullWidth margin="normal" label="Email" {...registerField('email')} />
          <TextField fullWidth margin="normal" label="Password" type="password" {...registerField('password')} />
          <Button type="submit" variant="contained">Register</Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;


