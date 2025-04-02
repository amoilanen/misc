import React, { useState } from 'react';
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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useEvents } from '../hooks/useEvents';
import { useCategories } from '../hooks/useCategories';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
  title: yup.string().required('Title is required'),
  amount: yup.number().required('Amount is required').positive('Amount must be positive'),
  date: yup.string().required('Date is required'),
  categoryId: yup.string().required('Category is required'),
  description: yup.string(),
});

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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events?.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{event.title}</TableCell>
                <TableCell>${event.amount.toFixed(2)}</TableCell>
                <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  {categories?.find((cat) => cat.id === event.categoryId)?.name}
                </TableCell>
                <TableCell>{event.description}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(event)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(event.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              margin="normal"
              {...register('title')}
              error={!!errors.title}
              helperText={errors.title?.message}
            />
            <TextField
              fullWidth
              label="Amount"
              type="number"
              margin="normal"
              {...register('amount')}
              error={!!errors.amount}
              helperText={errors.amount?.message}
            />
            <TextField
              fullWidth
              label="Date"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              {...register('date')}
              error={!!errors.date}
              helperText={errors.date?.message}
            />
            <TextField
              fullWidth
              select
              label="Category"
              margin="normal"
              {...register('categoryId')}
              error={!!errors.categoryId}
              helperText={errors.categoryId?.message}
            >
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Description"
              margin="normal"
              multiline
              rows={4}
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
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