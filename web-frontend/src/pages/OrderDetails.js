import React from 'react';
import { Container, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

const OrderDetails = () => {
  const { id } = useParams();
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5">Order Details #{id}</Typography>
    </Container>
  );
};

export default OrderDetails;


