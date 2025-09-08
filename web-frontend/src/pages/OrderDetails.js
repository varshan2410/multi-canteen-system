import React from 'react';
import { Container, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

const OrderDetails = () => {
  const { id } = useParams();
  
  return (
    <Container>
      <Typography variant="h4">Order Details #{id}</Typography>
      <Typography>Order details coming soon...</Typography>
    </Container>
  );
};

export default OrderDetails;