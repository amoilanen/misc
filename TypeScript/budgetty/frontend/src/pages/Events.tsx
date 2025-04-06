import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  TableSortLabel,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useEvents } from '../hooks/useEvents';
import { useCategories } from '../hooks/useCategories';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import ImportEvents from '../components/ImportEvents';
import { format } from 'date-fns';

const schema = yup.object().shape({
  description: yup.string().required('Description is required'),
  amount: yup.number().required('Amount is required'),
  date: yup.string().required('Date is required'),
  categoryId: yup.string().required('Category is required'),
  currency: yup.string().default('EUR'),
});

type SortField = 'date' | 'amount' | 'description';
type SortOrder = 'asc' | 'desc';

const Events = () => {
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useEvents();
  const { categories } = useCategories();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleOpen = (event?: any) => {
    if (event) {
      setEditingEvent(event);
      reset(event);
    } else {
      setEditingEvent(null);
      reset({});
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingEvent(null);
    reset({});
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, data);
      } else {
        await createEvent(data);
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(id);
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  const handleSort = (field: SortField) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const sortedEvents = [...events].sort((a, b) => {
    if (sortField === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortField === 'amount') {
      return sortOrder === 'asc'
        ? a.amount - b.amount
        : b.amount - a.amount;
    } else {
      return sortOrder === 'asc'
        ? a.description.localeCompare(b.description)
        : b.description.localeCompare(a.description);
    }
  });

  if (isLoading) {
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Events
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Event
        </Button>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr',
        gap: 3 
      }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Import Events
            </Typography>
            <ImportEvents />
          </CardContent>
        </Card>
      </Box>

      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          Event List
        </Typography>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'date'}
                    direction={sortField === 'date' ? sortOrder : 'asc'}
                    onClick={() => handleSort('date')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'amount'}
                    direction={sortField === 'amount' ? sortOrder : 'asc'}
                    onClick={() => handleSort('amount')}
                  >
                    Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'description'}
                    direction={sortField === 'description' ? sortOrder : 'asc'}
                    onClick={() => handleSort('description')}
                  >
                    Description
                  </TableSortLabel>
                </TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{format(new Date(event.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell align="right">
                    {event.amount.toFixed(2)} €
                  </TableCell>
                  <TableCell>{event.description}</TableCell>
                  <TableCell>
                    {categories?.find((cat) => cat.id === event.categoryId)?.name}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleOpen(event)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(event.id)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 3 
            }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Event Details
                </Typography>
                <TextField
                  fullWidth
                  label="Description"
                  {...register('description')}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  {...register('amount')}
                  error={!!errors.amount}
                  helperText={errors.amount?.message}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Currency"
                  {...register('currency')}
                  error={!!errors.currency}
                  helperText={errors.currency?.message}
                  defaultValue="EUR"
                  margin="normal"
                />
              </Box>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  {...register('date')}
                  error={!!errors.date}
                  helperText={errors.date?.message}
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  fullWidth
                  select
                  label="Category"
                  {...register('categoryId')}
                  error={!!errors.categoryId}
                  helperText={errors.categoryId?.message}
                  margin="normal"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained">
            {editingEvent ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Events; 