import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { useEvents } from '../hooks/useEvents';
import { useCategories } from '../hooks/useCategories';

const Dashboard = () => {
  const { events, isLoading: eventsLoading } = useEvents();
  const { categories, isLoading: categoriesLoading } = useCategories();

  if (eventsLoading || categoriesLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const totalEvents = events?.length || 0;
  const totalCategories = categories?.length || 0;
  
  // Ensure totalBudget is always a number
  const totalBudget = events.reduce((sum, event) => sum + event.amount, 0);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Events
            </Typography>
            <Typography component="p" variant="h4">
              {totalEvents}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Categories
            </Typography>
            <Typography component="p" variant="h4">
              {totalCategories}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Budget
            </Typography>
            <Typography component="p" variant="h4">
              {totalBudget.toFixed(2)} €
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 