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
import { UpdateProfileData } from '../types';

// Create a schema that matches the UpdateProfileData interface
const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  currentPassword: yup.string().optional(),
  newPassword: yup.string().min(8, 'Password must be at least 8 characters').optional(),
}).test('password-validation', 'Both current and new passwords are required to change password', function(value) {
  const { currentPassword, newPassword } = value;
  
  // If either password field is filled, both must be filled
  if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
    return false;
  }
  
  return true;
});

const Profile = () => {
  const { user, updateProfile, loading } = useAuth();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: UpdateProfileData) => {
    try {
      setError(null);
      await updateProfile(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      setSuccess(false);
    }
  };

  if (loading) {
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
            disabled={loading}
          >
            Update Profile
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile; 