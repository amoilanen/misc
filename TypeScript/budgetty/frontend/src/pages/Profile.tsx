import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  currentPassword: yup.string().when('newPassword', {
    is: (val: string) => val && val.length > 0,
    then: yup.string().required('Current password is required'),
    otherwise: yup.string(),
  }),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .when('currentPassword', {
      is: (val: string) => val && val.length > 0,
      then: yup.string().required('New password is required'),
      otherwise: yup.string(),
    }),
});

const Profile = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: any) => {
    try {
      setError(null);
      await updateProfile(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      setSuccess(false);
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
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Profile updated successfully
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Email"
            margin="normal"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Change Password
          </Typography>

          <TextField
            fullWidth
            label="Current Password"
            type="password"
            margin="normal"
            {...register('currentPassword')}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword?.message}
          />

          <TextField
            fullWidth
            label="New Password"
            type="password"
            margin="normal"
            {...register('newPassword')}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
          />

          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={isLoading}
          >
            Update Profile
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile; 