import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Paper,
} from '@mui/material';
import { useEvents } from '../hooks/useEvents';
import { useCategories } from '../hooks/useCategories';
import { Charts } from '../components/Charts';
import { formatCurrency } from '../utils/formatters';

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

  // Calculate total income and expenses
  const totalIncome = events
    .filter(event => event.amount > 0)
    .reduce((sum, event) => sum + event.amount, 0);
  
  const totalExpenses = Math.abs(events
    .filter(event => event.amount < 0)
    .reduce((sum, event) => sum + event.amount, 0));

  const balance = totalIncome - totalExpenses;

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header with totals */}
        <Box sx={{ mb: 6, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h4" gutterBottom>
            Financial Overview
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 3 
          }}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Income
              </Typography>
              <Typography variant="h5" color="success.main">
                {formatCurrency(totalIncome)}
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Expenses
              </Typography>
              <Typography variant="h5" color="error.main">
                {formatCurrency(totalExpenses)}
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Balance
              </Typography>
              <Typography variant="h5" color={balance >= 0 ? 'success.main' : 'error.main'}>
                {formatCurrency(balance)}
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* Charts section */}
        <Box>
          <Charts events={events} categories={categories} />
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard; 