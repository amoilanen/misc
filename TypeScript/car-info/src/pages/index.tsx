import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import { getInitialLocale } from '../utils/language';

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [licensePlate, setLicensePlate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate.trim()) return;

    setIsLoading(true);
    try {
      await router.push(`/search?plate=${encodeURIComponent(licensePlate.trim())}`);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            {t('title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            {t('description')}
          </Typography>

          <Box component="form" onSubmit={handleSearch} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label={t('licensePlate')}
              variant="outlined"
              value={licensePlate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLicensePlate(e.target.value.toUpperCase())}
              placeholder="ABC-123"
              sx={{ mb: 3 }}
              disabled={isLoading}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={isLoading || !licensePlate.trim()}
            >
              {isLoading ? <CircularProgress size={24} /> : t('search')}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const locale = getInitialLocale(context);
  
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}; 